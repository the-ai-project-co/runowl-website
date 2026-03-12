<script lang="ts">
	import { reviewStore } from '$lib/stores/review.svelte';

	type ViewMode = 'unified' | 'split';
	let viewMode = $state<ViewMode>('unified');
	let collapsedHunks = $state<Set<number>>(new Set());
	let selectionContext = $state<string | null>(null);
	let selectionLineInfo = $state<string | null>(null);

	const file = $derived(reviewStore.selectedFileData);
	const highlightedLine = $derived(reviewStore.highlightedLine);

	interface DiffLine {
		type: 'context' | 'add' | 'remove' | 'hunk';
		oldNo: number | null;
		newNo: number | null;
		content: string;
	}

	function parsePatch(patch: string): DiffLine[] {
		const lines = patch.split('\n');
		const result: DiffLine[] = [];
		let oldNo = 0;
		let newNo = 0;

		for (const line of lines) {
			if (line.startsWith('@@')) {
				// Parse hunk header: @@ -a,b +c,d @@
				const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
				if (m) {
					oldNo = parseInt(m[1]) - 1;
					newNo = parseInt(m[2]) - 1;
				}
				result.push({ type: 'hunk', oldNo: null, newNo: null, content: line });
			} else if (line.startsWith('+')) {
				newNo++;
				result.push({ type: 'add', oldNo: null, newNo, content: line.slice(1) });
			} else if (line.startsWith('-')) {
				oldNo++;
				result.push({ type: 'remove', oldNo, newNo: null, content: line.slice(1) });
			} else {
				oldNo++;
				newNo++;
				result.push({ type: 'context', oldNo, newNo, content: line.slice(1) });
			}
		}
		return result;
	}

	function isHighlighted(line: DiffLine): boolean {
		if (!highlightedLine || !file) return false;
		if (highlightedLine.file !== file.filename) return false;
		return line.newNo === highlightedLine.line || line.oldNo === highlightedLine.line;
	}

	// Split view: separate add/context (right) from remove/context (left)
	function buildSplitRows(
		diffLines: DiffLine[]
	): Array<{ left: DiffLine | null; right: DiffLine | null }> {
		const rows: Array<{ left: DiffLine | null; right: DiffLine | null }> = [];
		let i = 0;
		while (i < diffLines.length) {
			const line = diffLines[i];
			if (line.type === 'hunk') {
				rows.push({ left: line, right: null });
				i++;
			} else if (line.type === 'remove') {
				const next = diffLines[i + 1];
				if (next?.type === 'add') {
					rows.push({ left: line, right: next });
					i += 2;
				} else {
					rows.push({ left: line, right: null });
					i++;
				}
			} else if (line.type === 'add') {
				rows.push({ left: null, right: line });
				i++;
			} else {
				rows.push({ left: line, right: line });
				i++;
			}
		}
		return rows;
	}

	const diffLines = $derived(file?.patch ? parsePatch(file.patch) : []);
	const splitRows = $derived(viewMode === 'split' ? buildSplitRows(diffLines) : []);

	// Group diffLines into hunks (for collapsible context runs)
	interface HunkGroup {
		hunkIndex: number;
		hunkHeader: DiffLine | null;
		lines: DiffLine[];
		contextRunStart: number; // index into lines where a long context run begins
	}

	function groupIntoHunks(
		lines: DiffLine[]
	): Array<{ header: DiffLine | null; lines: DiffLine[]; idx: number }> {
		const groups: Array<{ header: DiffLine | null; lines: DiffLine[]; idx: number }> = [];
		let current: { header: DiffLine | null; lines: DiffLine[]; idx: number } | null = null;
		let idx = 0;
		for (const line of lines) {
			if (line.type === 'hunk') {
				if (current) groups.push(current);
				current = { header: line, lines: [], idx: idx++ };
			} else {
				if (!current) current = { header: null, lines: [], idx: idx++ };
				current.lines.push(line);
			}
		}
		if (current) groups.push(current);
		return groups;
	}

	const hunkGroups = $derived(groupIntoHunks(diffLines));

	// How many consecutive context lines to collapse
	const COLLAPSE_THRESHOLD = 6;

	function isHunkCollapsed(idx: number) {
		return collapsedHunks.has(idx);
	}
	function toggleHunk(idx: number) {
		const next = new Set(collapsedHunks);
		if (next.has(idx)) {
			next.delete(idx);
		} else {
			next.add(idx);
		}
		collapsedHunks = next;
	}

	// Capture text selection and build context for the chat panel
	function onSelectionChange() {
		const sel = window.getSelection();
		if (!sel || sel.isCollapsed || !sel.toString().trim()) {
			selectionContext = null;
			selectionLineInfo = null;
			return;
		}
		const text = sel.toString().trim();
		if (!text || text.length < 3) return;
		selectionContext = text;
		selectionLineInfo = file?.filename ?? null;
	}

	function askAboutSelection() {
		if (!selectionContext || !selectionLineInfo) return;
		const question = `Regarding this code in \`${selectionLineInfo}\`:\n\`\`\`\n${selectionContext}\n\`\`\`\nCan you explain what it does and flag any issues?`;
		reviewStore.sendMessage(question);
		reviewStore.activeTab = 'review';
		selectionContext = null;
	}
</script>

<div class="diff-viewer">
	<!-- Toolbar -->
	<div class="diff-toolbar">
		{#if file}
			<div class="file-path">
				<code>{file.filename}</code>
				<span
					class="file-status"
					class:added={file.status === 'added'}
					class:removed={file.status === 'removed'}
				>
					{file.status}
				</span>
			</div>
		{/if}

		<div class="toolbar-right">
			<div class="view-toggle" role="group" aria-label="Diff view mode">
				<button
					class:active={viewMode === 'unified'}
					onclick={() => (viewMode = 'unified')}
					title="Unified diff">Unified</button
				>
				<button
					class:active={viewMode === 'split'}
					onclick={() => (viewMode = 'split')}
					title="Split diff">Split</button
				>
			</div>
		</div>
	</div>

	<!-- Diff content -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="diff-body" onmouseup={onSelectionChange} onkeyup={onSelectionChange}>
		{#if !file}
			<div class="diff-empty">Select a file to view its diff.</div>
		{:else if !file.patch}
			<div class="diff-empty">
				{#if file.status === 'removed'}
					File was deleted.
				{:else}
					No patch available for this file (binary or too large).
				{/if}
			</div>
		{:else if viewMode === 'unified'}
			{#each hunkGroups as group}
				<table class="diff-table unified">
					<tbody>
						{#if group.header}
							<tr class="diff-row hunk">
								<td class="ln ln-old"></td>
								<td class="ln ln-new"></td>
								<td class="diff-sign"></td>
								<td class="diff-code hunk-header">
									<pre>{group.header.content}</pre>
									<button class="collapse-hunk-btn" onclick={() => toggleHunk(group.idx)}>
										{isHunkCollapsed(group.idx) ? 'Expand' : 'Collapse'} context
									</button>
								</td>
							</tr>
						{/if}
						{#if !isHunkCollapsed(group.idx)}
							{#each group.lines as line, li}
								<!-- Collapse long context runs (>COLLAPSE_THRESHOLD consecutive context lines) -->
								{@const prevIsContext = li > 0 && group.lines[li - 1].type === 'context'}
								{@const nextIsContext =
									li < group.lines.length - 1 && group.lines[li + 1].type === 'context'}
								{#if line.type === 'context'}
									{@const runStart = (() => {
										let s = li;
										while (s > 0 && group.lines[s - 1].type === 'context') s--;
										return s;
									})()}
									{@const runEnd = (() => {
										let e = li;
										while (e < group.lines.length - 1 && group.lines[e + 1].type === 'context') e++;
										return e;
									})()}
									{@const runLen = runEnd - runStart + 1}
									{@const posInRun = li - runStart}
									{#if runLen > COLLAPSE_THRESHOLD && posInRun >= 3 && posInRun < runLen - 3}
										{#if posInRun === 3}
											<tr class="diff-row collapsed-context">
												<td colspan="4" class="collapsed-banner">
													<button onclick={() => {}}>··· {runLen - 6} unchanged lines hidden</button
													>
												</td>
											</tr>
										{/if}
									{:else}
										<tr class="diff-row context" class:highlighted={isHighlighted(line)}>
											<td class="ln ln-old">{line.oldNo ?? ''}</td>
											<td class="ln ln-new">{line.newNo ?? ''}</td>
											<td class="diff-sign"> </td>
											<td class="diff-code"><pre>{line.content}</pre></td>
										</tr>
									{/if}
								{:else}
									<tr class="diff-row {line.type}" class:highlighted={isHighlighted(line)}>
										<td class="ln ln-old">{line.oldNo ?? ''}</td>
										<td class="ln ln-new">{line.newNo ?? ''}</td>
										<td class="diff-sign">{line.type === 'add' ? '+' : '-'}</td>
										<td class="diff-code"><pre>{line.content}</pre></td>
									</tr>
								{/if}
							{/each}
						{:else}
							<tr class="diff-row collapsed-context">
								<td colspan="4" class="collapsed-banner">
									<button onclick={() => toggleHunk(group.idx)}
										>··· {group.lines.length} lines — click to expand</button
									>
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			{/each}
		{:else}
			<!-- Split view -->
			<table class="diff-table split">
				<colgroup>
					<col style="width: 40px" />
					<col style="width: 50%" />
					<col style="width: 40px" />
					<col style="width: 50%" />
				</colgroup>
				<tbody>
					{#each splitRows as row}
						{#if row.left?.type === 'hunk'}
							<tr class="diff-row hunk">
								<td colspan="4" class="diff-code hunk-header"><pre>{row.left.content}</pre></td>
							</tr>
						{:else}
							<tr class="diff-row">
								<td class="ln ln-old">{row.left?.oldNo ?? ''}</td>
								<td
									class="diff-code {row.left?.type ?? ''}"
									class:highlighted={row.left ? isHighlighted(row.left) : false}
								>
									{#if row.left}<pre>{row.left.type === 'remove' ? '-' : ' '}{row.left
												.content}</pre>{/if}
								</td>
								<td class="ln ln-new">{row.right?.newNo ?? ''}</td>
								<td
									class="diff-code {row.right?.type ?? ''}"
									class:highlighted={row.right ? isHighlighted(row.right) : false}
								>
									{#if row.right}<pre>{row.right.type === 'add' ? '+' : ' '}{row.right
												.content}</pre>{/if}
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		{/if}
	</div>

	<!-- Text selection context popup -->
	{#if selectionContext}
		<div class="selection-popup">
			<span class="selection-hint">
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
				</svg>
				{selectionContext.split('\n').length} line{selectionContext.split('\n').length !== 1
					? 's'
					: ''} selected
			</span>
			<button class="selection-ask-btn" onclick={askAboutSelection}>Ask AI about this</button>
			<button
				class="selection-dismiss"
				onclick={() => {
					selectionContext = null;
				}}
				aria-label="Dismiss">×</button
			>
		</div>
	{/if}
</div>

<style>
	.diff-viewer {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: var(--bg);
	}

	.diff-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.875rem;
		border-bottom: 1px solid var(--border);
		background: var(--surface);
		flex-shrink: 0;
		gap: 0.75rem;
	}

	.file-path {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}
	.file-path code {
		font-size: 0.8rem;
		color: var(--text);
		font-family: 'SF Mono', 'Fira Code', monospace;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-status {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.1rem 0.35rem;
		border-radius: 4px;
		background: var(--surface-2);
		color: var(--muted);
		flex-shrink: 0;
	}
	.file-status.added {
		background: rgba(74, 222, 128, 0.1);
		color: var(--green);
	}
	.file-status.removed {
		background: rgba(248, 113, 113, 0.1);
		color: var(--red);
	}

	.toolbar-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.view-toggle {
		display: flex;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 6px;
		overflow: hidden;
	}
	.view-toggle button {
		background: none;
		border: none;
		padding: 0.25rem 0.625rem;
		font-size: 0.75rem;
		color: var(--muted);
		cursor: pointer;
		font-family: inherit;
		transition:
			color 0.15s,
			background 0.15s;
	}
	.view-toggle button.active {
		background: var(--accent);
		color: #fff;
	}
	.view-toggle button:not(.active):hover {
		color: var(--text);
	}

	.diff-body {
		flex: 1;
		overflow: auto;
	}

	.diff-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 200px;
		color: var(--muted);
		font-size: 0.875rem;
	}

	.diff-table {
		width: 100%;
		border-collapse: collapse;
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 0.78rem;
		line-height: 1.6;
	}

	.diff-row {
		transition: background 0.1s;
	}
	.diff-row:hover td {
		background: rgba(255, 255, 255, 0.02);
	}
	.diff-row.highlighted td {
		background: rgba(124, 106, 247, 0.12) !important;
	}
	.diff-row.highlighted .ln {
		border-left: 2px solid var(--accent) !important;
	}

	.diff-row.add td {
		background: rgba(74, 222, 128, 0.06);
	}
	.diff-row.remove td {
		background: rgba(248, 113, 113, 0.06);
	}
	.diff-row.hunk td {
		background: rgba(56, 189, 248, 0.06);
		color: var(--accent-2);
	}

	/* Split view cell-level coloring */
	td.add {
		background: rgba(74, 222, 128, 0.06);
	}
	td.remove {
		background: rgba(248, 113, 113, 0.06);
	}
	td.highlighted {
		background: rgba(124, 106, 247, 0.12) !important;
	}

	.ln {
		width: 40px;
		min-width: 40px;
		text-align: right;
		padding: 0 0.5rem;
		color: var(--muted);
		opacity: 0.5;
		user-select: none;
		font-size: 0.72rem;
		border-right: 1px solid var(--border);
		vertical-align: top;
	}

	.diff-sign {
		width: 16px;
		min-width: 16px;
		text-align: center;
		padding: 0 0.2rem;
		font-weight: 700;
		vertical-align: top;
		color: inherit;
	}
	.diff-row.add .diff-sign {
		color: var(--green);
	}
	.diff-row.remove .diff-sign {
		color: var(--red);
	}

	.diff-code {
		padding: 0 0.875rem;
		vertical-align: top;
	}
	.diff-code pre {
		margin: 0;
		white-space: pre;
		overflow-x: visible;
		font-family: inherit;
		font-size: inherit;
		line-height: inherit;
		color: var(--text);
		background: none;
		border: none;
		padding: 0;
	}

	.hunk-header pre {
		color: var(--accent-2);
	}

	.collapse-hunk-btn {
		margin-left: 0.75rem;
		font-size: 0.68rem;
		background: none;
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--muted);
		padding: 0.1rem 0.4rem;
		cursor: pointer;
		font-family: inherit;
		vertical-align: middle;
		transition:
			border-color 0.15s,
			color 0.15s;
	}
	.collapse-hunk-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.collapsed-context {
		background: var(--surface);
	}
	.collapsed-banner {
		padding: 0;
		text-align: center;
	}
	.collapsed-banner button {
		width: 100%;
		padding: 0.3rem;
		background: none;
		border: none;
		color: var(--muted);
		font-size: 0.72rem;
		font-family: monospace;
		cursor: pointer;
		transition:
			color 0.15s,
			background 0.15s;
	}
	.collapsed-banner button:hover {
		color: var(--accent);
		background: var(--accent-glow);
	}

	.selection-popup {
		position: sticky;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.875rem;
		background: var(--surface);
		border-top: 1px solid var(--border);
		box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.2);
		animation: slideUp 0.15s ease;
	}
	@keyframes slideUp {
		from {
			transform: translateY(8px);
			opacity: 0;
		}
		to {
			transform: none;
			opacity: 1;
		}
	}

	.selection-hint {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.78rem;
		color: var(--muted);
		flex: 1;
	}

	.selection-ask-btn {
		padding: 0.35rem 0.75rem;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 6px;
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		white-space: nowrap;
		transition: opacity 0.15s;
	}
	.selection-ask-btn:hover {
		opacity: 0.88;
	}

	.selection-dismiss {
		background: none;
		border: none;
		color: var(--muted);
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		padding: 0.1rem 0.25rem;
		border-radius: 4px;
	}
	.selection-dismiss:hover {
		color: var(--text);
	}
</style>
