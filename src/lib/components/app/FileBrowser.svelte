<script lang="ts">
	import { reviewStore } from '$lib/stores/review.svelte';

	const files = $derived(reviewStore.files);
	const selected = $derived(reviewStore.selectedFile);

	const statusIcon: Record<string, { icon: string; color: string }> = {
		added:    { icon: 'A', color: 'var(--green)' },
		modified: { icon: 'M', color: 'var(--yellow)' },
		removed:  { icon: 'D', color: 'var(--red)' },
		renamed:  { icon: 'R', color: 'var(--accent)' },
	};

	function shortName(filename: string): string {
		const parts = filename.split('/');
		return parts.length > 2 ? `…/${parts.slice(-2).join('/')}` : filename;
	}
</script>

<div class="file-browser">
	<div class="browser-header">
		<span class="browser-label">Files changed</span>
		<span class="file-count">{files.length}</span>
	</div>

	<ul class="file-list">
		{#each files as file (file.filename)}
			{@const si = statusIcon[file.status] ?? { icon: '?', color: 'var(--muted)' }}
			<li>
				<button
					class="file-item"
					class:active={selected === file.filename}
					onclick={() => reviewStore.selectFile(file.filename)}
					title={file.filename}
				>
					<span class="status-badge" style="color: {si.color};">{si.icon}</span>
					<span class="file-name">{shortName(file.filename)}</span>
					<span class="file-diff">
						{#if file.additions > 0}<span class="add">+{file.additions}</span>{/if}
						{#if file.deletions > 0}<span class="del">-{file.deletions}</span>{/if}
					</span>
				</button>
			</li>
		{/each}
	</ul>
</div>

<style>
	.file-browser {
		width: 220px;
		min-width: 180px;
		border-right: 1px solid var(--border);
		background: var(--surface);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.browser-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.65rem 0.875rem;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}
	.browser-label {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}
	.file-count {
		font-size: 0.72rem;
		font-weight: 600;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 99px;
		padding: 0.05rem 0.4rem;
		color: var(--muted);
	}

	.file-list {
		list-style: none;
		overflow-y: auto;
		flex: 1;
		padding: 0.25rem 0;
	}

	.file-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.875rem;
		background: none;
		border: none;
		cursor: pointer;
		font-family: inherit;
		text-align: left;
		transition: background 0.1s;
	}
	.file-item:hover { background: var(--surface-2); }
	.file-item.active {
		background: var(--accent-glow);
		border-left: 2px solid var(--accent);
		padding-left: calc(0.875rem - 2px);
	}

	.status-badge {
		font-size: 0.65rem;
		font-weight: 800;
		font-family: monospace;
		flex-shrink: 0;
		width: 14px;
		text-align: center;
	}

	.file-name {
		flex: 1;
		font-size: 0.78rem;
		color: var(--text);
		font-family: 'SF Mono', 'Fira Code', monospace;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

	.file-diff {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
		font-size: 0.68rem;
		font-family: monospace;
	}
	.add { color: var(--green); }
	.del { color: var(--red); }
</style>
