<script lang="ts">
	import { reviewStore } from '$lib/stores/review.svelte';

	let collapsed = $state(false);

	const meta = $derived(reviewStore.meta);
	const status = $derived(reviewStore.status);

	function timeAgo(iso: string): string {
		const diff = Date.now() - new Date(iso).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		return `${Math.floor(hrs / 24)}d ago`;
	}

	const stateColor = $derived(
		meta?.state === 'open'
			? 'var(--green)'
			: meta?.state === 'merged'
				? 'var(--accent)'
				: 'var(--red)'
	);

	const reviewStatusLabel = $derived(
		status === 'reviewing'
			? 'Running review…'
			: status === 'done'
				? 'Review complete'
				: status === 'ready'
					? 'Ready to review'
					: ''
	);
</script>

<aside class="pr-summary" class:collapsed>
	<div class="summary-header">
		<span class="summary-title">Pull Request</span>
		<button
			class="collapse-btn"
			onclick={() => (collapsed = !collapsed)}
			aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
			title={collapsed ? 'Expand' : 'Collapse'}
		>
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				{#if collapsed}
					<polyline points="9 18 15 12 9 6" />
				{:else}
					<polyline points="15 18 9 12 15 6" />
				{/if}
			</svg>
		</button>
	</div>

	{#if !collapsed && meta}
		<div class="summary-body">
			<!-- State badge -->
			<div class="pr-state" style="color: {stateColor};">
				<span class="state-dot" style="background: {stateColor};"></span>
				{meta.state}
			</div>

			<!-- Title -->
			<a href={meta.url} target="_blank" rel="noopener" class="pr-title">
				#{meta.number}
				{meta.title}
			</a>

			<!-- Meta row -->
			<div class="meta-row">
				<span class="meta-item">
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
					</svg>
					{meta.author}
				</span>
				<span class="meta-item">
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
					</svg>
					{timeAgo(meta.created_at)}
				</span>
			</div>

			<!-- Branch info -->
			<div class="branch-row">
				<code class="branch">{meta.head_branch}</code>
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
				</svg>
				<code class="branch">{meta.base_branch}</code>
			</div>

			<!-- Stats -->
			<div class="stats-grid">
				<div class="stat">
					<span class="stat-value">{meta.changed_files}</span>
					<span class="stat-label">files</span>
				</div>
				<div class="stat">
					<span class="stat-value" style="color: var(--green);">+{meta.additions}</span>
					<span class="stat-label">additions</span>
				</div>
				<div class="stat">
					<span class="stat-value" style="color: var(--red);">-{meta.deletions}</span>
					<span class="stat-label">deletions</span>
				</div>
				<div class="stat">
					<span class="stat-value">{meta.commits}</span>
					<span class="stat-label">commits</span>
				</div>
			</div>

			<!-- Diff bar -->
			{#if meta.additions + meta.deletions > 0}
				{@const total = meta.additions + meta.deletions}
				{@const addPct = (meta.additions / total) * 100}
				<div class="diff-bar" title="+{meta.additions} / -{meta.deletions}">
					<div class="diff-add" style="width: {addPct}%;"></div>
					<div class="diff-del" style="width: {100 - addPct}%;"></div>
				</div>
			{/if}

			<!-- Review status -->
			{#if reviewStatusLabel}
				<div class="review-status" class:pulsing={status === 'reviewing'}>
					{#if status === 'reviewing'}
						<span class="status-dot reviewing"></span>
					{:else if status === 'done'}
						<svg
							width="13"
							height="13"
							viewBox="0 0 24 24"
							fill="none"
							stroke="var(--green)"
							stroke-width="2.5"
						>
							<polyline points="20 6 9 17 4 12" />
						</svg>
					{:else}
						<span class="status-dot ready"></span>
					{/if}
					<span>{reviewStatusLabel}</span>
				</div>
			{/if}

			<!-- Run review button -->
			{#if status === 'ready'}
				<button class="btn-run-review" onclick={() => reviewStore.runReview()}>
					<svg
						width="13"
						height="13"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<polygon points="5 3 19 12 5 21 5 3" />
					</svg>
					Run AI Review
				</button>
			{/if}

			<!-- Findings count badges (shown when done) -->
			{#if status === 'done'}
				<div class="findings-summary">
					{#if reviewStore.bugs.length}
						<span class="badge bug-badge"
							>{reviewStore.bugs.length} bug{reviewStore.bugs.length !== 1 ? 's' : ''}</span
						>
					{/if}
					{#if reviewStore.flags.length}
						<span class="badge flag-badge"
							>{reviewStore.flags.length} flag{reviewStore.flags.length !== 1 ? 's' : ''}</span
						>
					{/if}
					{#if !reviewStore.bugs.length && !reviewStore.flags.length}
						<span class="badge clean-badge">No issues found</span>
					{/if}
				</div>
			{/if}

			<!-- Test execution status -->
			{#if reviewStore.testSuite}
				{@const ts = reviewStore.testSuite}
				<div class="test-status">
					<div class="test-status-header">
						<svg
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<polyline points="9 11 12 14 22 4" /><path
								d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
							/>
						</svg>
						<span>Tests</span>
						{#if ts.all_passed}
							<span class="test-badge pass">passed</span>
						{:else}
							<span class="test-badge fail">{ts.failed} failed</span>
						{/if}
					</div>
					<div class="test-bar">
						{#if ts.total > 0}
							<div class="test-pass-fill" style="width: {(ts.passed / ts.total) * 100}%;"></div>
						{/if}
					</div>
					<div class="test-counts">
						<span style="color: var(--green);">{ts.passed} passed</span>
						{#if ts.failed}<span style="color: var(--red);">{ts.failed} failed</span>{/if}
						{#if ts.errors}<span style="color: var(--yellow);">{ts.errors} errors</span>{/if}
						<span style="margin-left: auto; color: var(--muted);">{ts.total} total</span>
					</div>
				</div>
			{/if}

			<!-- PR description (collapsible) -->
			{#if meta.body}
				<details class="pr-body">
					<summary>Description</summary>
					<p>{meta.body}</p>
				</details>
			{/if}
		</div>
	{/if}
</aside>

<style>
	.pr-summary {
		width: 240px;
		min-width: 240px;
		border-right: 1px solid var(--border);
		background: var(--surface);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		transition:
			width 0.2s ease,
			min-width 0.2s ease;
	}
	.pr-summary.collapsed {
		width: 36px;
		min-width: 36px;
	}

	.summary-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 0.875rem;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}
	.summary-title {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
		white-space: nowrap;
		overflow: hidden;
	}
	.collapsed .summary-title {
		opacity: 0;
	}

	.collapse-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--muted);
		display: flex;
		align-items: center;
		padding: 0;
		flex-shrink: 0;
		transition: color 0.15s;
	}
	.collapse-btn:hover {
		color: var(--text);
	}

	.summary-body {
		padding: 0.875rem;
		overflow-y: auto;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.pr-state {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: capitalize;
	}
	.state-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.pr-title {
		font-size: 0.83rem;
		font-weight: 600;
		color: var(--text);
		line-height: 1.45;
		text-decoration: none;
	}
	.pr-title:hover {
		color: var(--accent);
	}

	.meta-row {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.78rem;
		color: var(--muted);
	}

	.branch-row {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.75rem;
		color: var(--muted);
		flex-wrap: wrap;
	}
	.branch {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 0.1rem 0.35rem;
		font-size: 0.72rem;
		color: var(--accent-2);
		font-family: monospace;
		max-width: 90px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}
	.stat {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.4rem 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.stat-value {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--text);
		font-variant-numeric: tabular-nums;
	}
	.stat-label {
		font-size: 0.68rem;
		color: var(--muted);
	}

	.diff-bar {
		height: 5px;
		border-radius: 99px;
		overflow: hidden;
		display: flex;
		background: var(--border);
	}
	.diff-add {
		background: var(--green);
	}
	.diff-del {
		background: var(--red);
	}

	.review-status {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.status-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.status-dot.reviewing {
		background: var(--yellow);
		animation: pulse 1s ease infinite;
	}
	.status-dot.ready {
		background: var(--accent);
	}
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}

	.btn-run-review {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		width: 100%;
		padding: 0.55rem 0;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 7px;
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		transition: opacity 0.15s;
	}
	.btn-run-review:hover {
		opacity: 0.88;
	}

	.findings-summary {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.badge {
		font-size: 0.72rem;
		font-weight: 600;
		padding: 0.2rem 0.5rem;
		border-radius: 99px;
	}
	.bug-badge {
		background: rgba(248, 113, 113, 0.12);
		color: var(--red);
		border: 1px solid rgba(248, 113, 113, 0.2);
	}
	.flag-badge {
		background: rgba(251, 191, 36, 0.1);
		color: var(--yellow);
		border: 1px solid rgba(251, 191, 36, 0.2);
	}
	.clean-badge {
		background: rgba(74, 222, 128, 0.1);
		color: var(--green);
		border: 1px solid rgba(74, 222, 128, 0.2);
	}

	.pr-body {
		font-size: 0.8rem;
	}
	.pr-body summary {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--muted);
		cursor: pointer;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.4rem;
	}
	.pr-body p {
		color: var(--muted);
		line-height: 1.6;
		white-space: pre-wrap;
		word-break: break-word;
	}
</style>
