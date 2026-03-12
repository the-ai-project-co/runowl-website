<script lang="ts">
	import VideoPlayer from './VideoPlayer.svelte';

	/**
	 * Session replay viewer panel.
	 * Shows VideoPlayer + timeline + network requests + console logs side by side.
	 */

	interface ReplayEvent {
		type: 'dom_action' | 'network_request' | 'console_log' | 'assertion';
		offset_ms: number;
		detail: Record<string, unknown>;
		linked_assertion_id: string | null;
		cluster_id: number | null;
	}

	interface TestResult {
		test_id: string;
		test_name: string;
		status: string;
		video_path: string | null;
		replay_path: string | null;
		replay_events: ReplayEvent[];
		video_timestamps: Array<{ step_name: string; offset_ms: number }>;
		error_message: string;
	}

	let { result }: { result: TestResult } = $props();

	let activePanel = $state<'network' | 'console'>('network');
	let currentMs = $state(0); // synced from VideoPlayer via binding

	const networkEvents = $derived(result.replay_events.filter((e) => e.type === 'network_request'));
	const consoleEvents = $derived(result.replay_events.filter((e) => e.type === 'console_log'));
	const linkedAssertionMs = $derived(
		result.replay_events.find((e) => e.type === 'assertion' && e.linked_assertion_id)?.offset_ms ??
			null
	);

	const markers = $derived(
		result.video_timestamps.map((ts) => ({ offset_ms: ts.offset_ms, label: ts.step_name }))
	);

	function methodColor(method: string): string {
		const m = (method ?? '').toUpperCase();
		if (m === 'GET') return 'var(--green)';
		if (m === 'POST') return 'var(--accent)';
		if (m === 'PUT' || m === 'PATCH') return 'var(--yellow)';
		if (m === 'DELETE') return 'var(--red)';
		return 'var(--muted)';
	}

	function statusColor(status: number): string {
		if (status >= 200 && status < 300) return 'var(--green)';
		if (status >= 400) return 'var(--red)';
		return 'var(--yellow)';
	}

	function consoleColor(level: string): string {
		if (level === 'error') return 'var(--red)';
		if (level === 'warn') return 'var(--yellow)';
		return 'var(--muted)';
	}

	function formatMs(ms: number): string {
		if (ms < 1000) return `${Math.round(ms)}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	}
</script>

<div class="replay-viewer">
	<!-- Header -->
	<div class="replay-header">
		<div class="test-info">
			<span class="status-dot" class:failed={result.status !== 'pass'}></span>
			<span class="test-name">{result.test_name}</span>
		</div>
		{#if result.error_message}
			<span class="error-snippet" title={result.error_message}>
				{result.error_message.slice(0, 80)}{result.error_message.length > 80 ? '…' : ''}
			</span>
		{/if}
	</div>

	<div class="replay-body">
		<!-- Left: Video player -->
		<div class="video-column">
			{#if result.video_path}
				<VideoPlayer src={result.video_path} {markers} {linkedAssertionMs} />
			{:else}
				<div class="no-video">
					<svg
						width="32"
						height="32"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						opacity="0.3"
					>
						<polygon points="23 7 16 12 23 17 23 7" /><rect
							x="1"
							y="5"
							width="15"
							height="14"
							rx="2"
							ry="2"
						/>
					</svg>
					<p>No recording available</p>
				</div>
			{/if}

			<!-- Step timeline -->
			{#if result.video_timestamps.length > 0}
				<div class="step-timeline">
					<p class="timeline-label">Steps</p>
					{#each result.video_timestamps as ts}
						<div class="step-row">
							<span class="step-time">{formatMs(ts.offset_ms)}</span>
							<span class="step-name">{ts.step_name}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Right: Network + Console -->
		<div class="side-panels">
			<div class="side-tabs" role="tablist">
				<button
					role="tab"
					aria-selected={activePanel === 'network'}
					class:active={activePanel === 'network'}
					onclick={() => (activePanel = 'network')}
				>
					Network
					{#if networkEvents.length}
						<span class="tab-count">{networkEvents.length}</span>
					{/if}
				</button>
				<button
					role="tab"
					aria-selected={activePanel === 'console'}
					class:active={activePanel === 'console'}
					onclick={() => (activePanel = 'console')}
				>
					Console
					{#if consoleEvents.length}
						<span class="tab-count">{consoleEvents.length}</span>
					{/if}
				</button>
			</div>

			<div class="side-content">
				{#if activePanel === 'network'}
					{#if networkEvents.length === 0}
						<div class="side-empty">No network requests captured.</div>
					{:else}
						{#each networkEvents as ev}
							{@const method = String(ev.detail.method ?? 'GET')}
							{@const url = String(ev.detail.url ?? '')}
							{@const status = Number(ev.detail.status ?? 0)}
							{@const duration = Number(ev.detail.duration_ms ?? 0)}
							<div class="net-row" class:linked={!!ev.linked_assertion_id}>
								<span class="net-method" style="color: {methodColor(method)};">{method}</span>
								<span class="net-url" title={url}>{url.replace(/^https?:\/\/[^/]+/, '')}</span>
								<span class="net-status" style="color: {statusColor(status)};">{status || '—'}</span
								>
								<span class="net-dur">{duration ? formatMs(duration) : ''}</span>
							</div>
						{/each}
					{/if}
				{:else if consoleEvents.length === 0}
					<div class="side-empty">No console output captured.</div>
				{:else}
					{#each consoleEvents as ev}
						{@const level = String(ev.detail.level ?? 'log')}
						{@const message = String(ev.detail.message ?? '')}
						<div class="console-row" class:linked={!!ev.linked_assertion_id}>
							<span class="console-level" style="color: {consoleColor(level)};">{level}</span>
							<span class="console-msg">{message}</span>
							<span class="console-time">{formatMs(ev.offset_ms)}</span>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.replay-viewer {
		display: flex;
		flex-direction: column;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 10px;
		overflow: hidden;
	}

	.replay-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0.875rem;
		background: var(--surface);
		border-bottom: 1px solid var(--border);
		flex-wrap: wrap;
	}

	.test-info {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.status-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--green);
	}
	.status-dot.failed {
		background: var(--red);
	}

	.test-name {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text);
		font-family: monospace;
	}

	.error-snippet {
		font-size: 0.75rem;
		color: var(--red);
		font-family: monospace;
		opacity: 0.8;
	}

	.replay-body {
		display: flex;
		gap: 0;
		min-height: 0;
		overflow: hidden;
	}

	.video-column {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
		border-right: 1px solid var(--border);
		overflow-y: auto;
	}

	.no-video {
		aspect-ratio: 16/9;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: var(--surface);
		color: var(--muted);
	}
	.no-video p {
		font-size: 0.82rem;
	}

	.step-timeline {
		padding: 0.75rem 0.875rem;
		border-top: 1px solid var(--border);
	}
	.timeline-label {
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
		margin-bottom: 0.5rem;
	}
	.step-row {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		padding: 0.2rem 0;
	}
	.step-time {
		font-size: 0.7rem;
		color: var(--accent);
		font-family: monospace;
		min-width: 48px;
		flex-shrink: 0;
	}
	.step-name {
		font-size: 0.78rem;
		color: var(--muted);
	}

	/* Side panels */
	.side-panels {
		width: 320px;
		min-width: 240px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.side-tabs {
		display: flex;
		border-bottom: 1px solid var(--border);
		background: var(--surface);
		flex-shrink: 0;
	}
	.side-tabs button {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
		padding: 0.5rem;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--muted);
		cursor: pointer;
		font-family: inherit;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.side-tabs button.active {
		color: var(--text);
		border-bottom-color: var(--accent);
	}

	.tab-count {
		font-size: 0.65rem;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 99px;
		padding: 0.02rem 0.3rem;
	}

	.side-content {
		flex: 1;
		overflow-y: auto;
		font-size: 0.75rem;
		font-family: monospace;
	}

	.side-empty {
		padding: 2rem 1rem;
		text-align: center;
		color: var(--muted);
		font-family: inherit;
		font-size: 0.82rem;
	}

	.net-row,
	.console-row {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
		padding: 0.3rem 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.03);
		transition: background 0.1s;
	}
	.net-row:hover,
	.console-row:hover {
		background: var(--surface);
	}
	.net-row.linked,
	.console-row.linked {
		background: rgba(248, 113, 113, 0.06);
		border-left: 2px solid var(--red);
		padding-left: calc(0.75rem - 2px);
	}

	.net-method {
		font-weight: 700;
		min-width: 36px;
		flex-shrink: 0;
		font-size: 0.68rem;
	}
	.net-url {
		flex: 1;
		color: var(--muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.net-status {
		min-width: 28px;
		text-align: right;
		flex-shrink: 0;
	}
	.net-dur {
		color: var(--muted);
		opacity: 0.6;
		min-width: 36px;
		text-align: right;
		flex-shrink: 0;
	}

	.console-level {
		min-width: 32px;
		font-weight: 700;
		font-size: 0.68rem;
		flex-shrink: 0;
	}
	.console-msg {
		flex: 1;
		color: var(--muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.console-time {
		color: var(--muted);
		opacity: 0.5;
		min-width: 40px;
		text-align: right;
		flex-shrink: 0;
	}
</style>
