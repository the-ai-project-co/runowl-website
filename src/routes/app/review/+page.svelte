<script lang="ts">
	import { reviewStore } from '$lib/stores/review.svelte';
	import PRLoader from '$lib/components/app/PRLoader.svelte';
	import PRSummary from '$lib/components/app/PRSummary.svelte';
	import FileBrowser from '$lib/components/app/FileBrowser.svelte';
	import DiffViewer from '$lib/components/app/DiffViewer.svelte';
	import ChatPanel from '$lib/components/app/ChatPanel.svelte';
	import Resizer from '$lib/components/app/Resizer.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	// Auto-load PR from ?pr= query param (set by modal navigation)
	onMount(() => {
		const prUrl = $page.url.searchParams.get('pr');
		if (prUrl && prUrl !== reviewStore.prUrl) {
			reviewStore.reset();
			reviewStore.loadPR(prUrl);
		}
	});

	// Panel width state (pixels)
	let summaryWidth = $state(240);
	let fileBrowserWidth = $state(220);
	let chatWidth = $state(340);

	const MIN_SUMMARY = 36;
	const MAX_SUMMARY = 360;
	const MIN_FILES = 160;
	const MAX_FILES = 360;
	const MIN_CHAT = 260;
	const MAX_CHAT = 520;

	const hasData = $derived(
		reviewStore.status === 'ready' ||
			reviewStore.status === 'reviewing' ||
			reviewStore.status === 'done'
	);

	// Handle resize events from Resizer components
	function onPanelResize(e: Event) {
		const ce = e as CustomEvent<{ delta: number; direction: string; panel: string }>;
		const { delta, direction: dir, panel } = ce.detail;
		if (dir !== 'horizontal') return;

		if (panel === 'summary') {
			summaryWidth = Math.max(MIN_SUMMARY, Math.min(MAX_SUMMARY, summaryWidth + delta));
		} else if (panel === 'files') {
			fileBrowserWidth = Math.max(MIN_FILES, Math.min(MAX_FILES, fileBrowserWidth + delta));
		} else if (panel === 'chat') {
			chatWidth = Math.max(MIN_CHAT, Math.min(MAX_CHAT, chatWidth - delta));
		}
	}

	// Mount resize listener on workspace div
	let workspaceEl = $state<HTMLDivElement | null>(null);
	$effect(() => {
		if (!workspaceEl) return;
		workspaceEl.addEventListener('panel-resize', onPanelResize);
		return () => workspaceEl?.removeEventListener('panel-resize', onPanelResize);
	});

	// Keyboard shortcuts
	function onKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			reviewStore.reset();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
	<title>
		{reviewStore.meta ? `#${reviewStore.meta.number} — RunOwl` : 'New Review — RunOwl'}
	</title>
</svelte:head>

<div class="workspace" role="main" bind:this={workspaceEl}>
	{#if !hasData}
		<PRLoader />
	{:else}
		<!-- PR Summary (left) -->
		<div class="panel" style="width: {summaryWidth}px; min-width: {summaryWidth}px;">
			<PRSummary />
		</div>

		<Resizer direction="horizontal" panel="summary" />

		<!-- File browser -->
		<div class="panel" style="width: {fileBrowserWidth}px; min-width: {fileBrowserWidth}px;">
			<FileBrowser />
		</div>

		<Resizer direction="horizontal" panel="files" />

		<!-- Diff viewer (grows to fill) -->
		<div class="panel diff-panel">
			<DiffViewer />
		</div>

		<Resizer direction="horizontal" panel="chat" />

		<!-- Chat panel (right) -->
		<div class="panel" style="width: {chatWidth}px; min-width: {chatWidth}px;">
			<ChatPanel />
		</div>
	{/if}
</div>

<!-- Bottom bar with keyboard hints -->
{#if hasData}
	<div class="status-bar">
		<span class="shortcut"><kbd>⌘K</kbd> Reset</span>
		<span class="shortcut"><kbd>Enter</kbd> Ask AI</span>
		<span class="status-right">
			{#if reviewStore.status === 'reviewing'}
				<span class="pulse-dot"></span> Reviewing…
			{:else if reviewStore.status === 'done'}
				<span class="done-dot"></span>
				{reviewStore.findings.length} finding{reviewStore.findings.length !== 1 ? 's' : ''}
			{:else}
				PR #{reviewStore.meta?.number} loaded
			{/if}
		</span>
	</div>
{/if}

<style>
	.workspace {
		flex: 1;
		display: flex;
		overflow: hidden;
		min-height: 0;
	}

	.panel {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		flex-shrink: 0;
	}

	.diff-panel {
		flex: 1;
		min-width: 200px;
		width: auto !important;
	}

	.status-bar {
		height: 26px;
		display: flex;
		align-items: center;
		gap: 1.25rem;
		padding: 0 0.875rem;
		background: var(--surface);
		border-top: 1px solid var(--border);
		font-size: 0.72rem;
		color: var(--muted);
		flex-shrink: 0;
	}

	.shortcut {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	kbd {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 3px;
		padding: 0.05rem 0.3rem;
		font-size: 0.68rem;
		font-family: inherit;
	}

	.status-right {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.pulse-dot {
		width: 6px;
		height: 6px;
		background: var(--yellow);
		border-radius: 50%;
		animation: pulse 1s ease infinite;
	}
	.done-dot {
		width: 6px;
		height: 6px;
		background: var(--green);
		border-radius: 50%;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}

	/* Responsive: on narrow screens stack panels vertically and hide resizers */
	@media (max-width: 768px) {
		.workspace {
			flex-direction: column;
			overflow-y: auto;
		}
		.panel {
			width: 100% !important;
			min-width: 0 !important;
			max-width: 100% !important;
		}
		.diff-panel {
			min-height: 400px;
		}
		.status-bar {
			display: none;
		}
	}
</style>
