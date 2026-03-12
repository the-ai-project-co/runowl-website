<script lang="ts">
	import { reviewStore } from '$lib/stores/review.svelte';

	type ViewMode = 'unified' | 'split';
	let viewMode = $state<ViewMode>('unified');

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
		return (line.newNo === highlightedLine.line || line.oldNo === highlightedLine.line);
	}

	// Split view: separate add/context (right) from remove/context (left)
	function buildSplitRows(diffLines: DiffLine[]): Array<{ left: DiffLine | null; right: DiffLine | null }> {
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
</script>

<div class="diff-viewer">
	<!-- Toolbar -->
	<div class="diff-toolbar">
		{#if file}
			<div class="file-path">
				<code>{file.filename}</code>
				<span class="file-status" class:added={file.status === 'added'} class:removed={file.status === 'removed'}>
					{file.status}
				</span>
			</div>
		{/if}

		<div class="toolbar-right">
			<div class="view-toggle" role="group" aria-label="Diff view mode">
				<button
					class:active={viewMode === 'unified'}
					onclick={() => (viewMode = 'unified')}
					title="Unified diff"
				>Unified</button>
				<button
					class:active={viewMode === 'split'}
					onclick={() => (viewMode = 'split')}
					title="Split diff"
				>Split</button>
			</div>
		</div>
	</div>

	<!-- Diff content -->
	<div class="diff-body">
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
			<table class="diff-table unified">
				<tbody>
					{#each diffLines as line}
						<tr
							class="diff-row {line.type}"
							class:highlighted={isHighlighted(line)}
						>
							<td class="ln ln-old">{line.oldNo ?? ''}</td>
							<td class="ln ln-new">{line.newNo ?? ''}</td>
							<td class="diff-sign">
								{line.type === 'add' ? '+' : line.type === 'remove' ? '-' : line.type === 'hunk' ? '' : ''}
							</td>
							<td class="diff-code">
								<pre>{line.content}</pre>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<!-- Split view -->
			<table class="diff-table split">
				<colgroup>
					<col style="width: 40px"/>
					<col style="width: 50%"/>
					<col style="width: 40px"/>
					<col style="width: 50%"/>
				</colgroup>
				<tbody>
					{#each splitRows as row}
						{#if row.left?.type === 'hunk'}
							<tr class="diff-row hunk">
								<td colspan="4" class="diff-code hunk-header"><pre>{row.left.content}</pre></td>
							</tr>
						{:else}
							<tr class="diff-row">
								<!-- Left (old) -->
								<td class="ln ln-old">{row.left?.oldNo ?? ''}</td>
								<td class="diff-code {row.left?.type ?? ''}" class:highlighted={row.left ? isHighlighted(row.left) : false}>
									{#if row.left}
										<pre>{row.left.type === 'remove' ? '-' : ' '}{row.left.content}</pre>
									{/if}
								</td>
								<!-- Right (new) -->
								<td class="ln ln-new">{row.right?.newNo ?? ''}</td>
								<td class="diff-code {row.right?.type ?? ''}" class:highlighted={row.right ? isHighlighted(row.right) : false}>
									{#if row.right}
										<pre>{row.right.type === 'add' ? '+' : ' '}{row.right.content}</pre>
									{/if}
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
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
	.file-status.added { background: rgba(74,222,128,0.1); color: var(--green); }
	.file-status.removed { background: rgba(248,113,113,0.1); color: var(--red); }

	.toolbar-right { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }

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
		transition: color 0.15s, background 0.15s;
	}
	.view-toggle button.active {
		background: var(--accent);
		color: #fff;
	}
	.view-toggle button:not(.active):hover { color: var(--text); }

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

	.diff-row { transition: background 0.1s; }
	.diff-row:hover td { background: rgba(255,255,255,0.02); }
	.diff-row.highlighted td { background: rgba(124,106,247,0.12) !important; }
	.diff-row.highlighted .ln { border-left: 2px solid var(--accent) !important; }

	.diff-row.add td { background: rgba(74,222,128,0.06); }
	.diff-row.remove td { background: rgba(248,113,113,0.06); }
	.diff-row.hunk td { background: rgba(56,189,248,0.06); color: var(--accent-2); }

	/* Split view cell-level coloring */
	td.add { background: rgba(74,222,128,0.06); }
	td.remove { background: rgba(248,113,113,0.06); }
	td.highlighted { background: rgba(124,106,247,0.12) !important; }

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
	.diff-row.add .diff-sign { color: var(--green); }
	.diff-row.remove .diff-sign { color: var(--red); }

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

	.hunk-header pre { color: var(--accent-2); }
</style>
