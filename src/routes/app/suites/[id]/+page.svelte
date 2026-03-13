<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		ArrowLeft,
		FlaskConical,
		CheckCircle,
		XCircle,
		Clock,
		Play,
		RefreshCw,
		Terminal,
		Video,
		Rewind,
		AlertCircle,
	} from 'lucide-svelte';

	interface TestCase {
		id: string;
		name: string;
		status: 'pass' | 'fail' | 'error' | 'skip' | 'timeout' | 'pending';
		type?: string;
		framework?: string;
		duration_ms: number;
		error?: string;
		video_url?: string | null;
		replay_url?: string | null;
	}

	interface SuiteResult {
		suite_id: string;
		pr_ref: string | null;
		status: string;
		passed: number;
		failed: number;
		errors: number;
		skipped: number;
		total: number;
		duration_ms: number;
		cases: TestCase[];
		video_url: string | null;
		replay_url: string | null;
	}

	// Minimal suite metadata shown while/before results load
	interface SuiteMeta {
		id: string;
		name: string;
		repo: string;
		last_run: string | null;
		version: number;
		tests_count: number;
	}

	const suiteId = $derived($page.params.id);

	let meta = $state<SuiteMeta | null>(null);
	let result = $state<SuiteResult | null>(null);
	let tests = $state<TestCase[]>([]);
	let loading = $state(true);
	let loadError = $state('');
	let running = $state(false);
	let runLog = $state<string[]>([]);
	let activeVideo = $state<string | null>(null);
	let activeReplay = $state<string | null>(null);

	// Load suite results on mount / id change
	$effect(() => {
		if (suiteId) loadSuite(suiteId);
	});

	async function loadSuite(id: string) {
		loading = true;
		loadError = '';
		runLog = [];

		// First try to get the full result
		try {
			const res = await fetch(`/api/tests/results?suite_id=${encodeURIComponent(id)}`);
			if (res.ok) {
				const data: SuiteResult = await res.json();
				result = data;
				tests = (data.cases ?? []) as TestCase[];
				// Build meta from result data
				meta = {
					id,
					name: id, // will be replaced if we get suite list data
					repo: data.pr_ref?.split('#')[0] ?? '',
					last_run: new Date().toISOString(),
					version: 1,
					tests_count: data.total,
				};
			} else if (res.status === 404) {
				loadError = 'Suite not found.';
			} else {
				loadError = 'Failed to load suite results.';
			}
		} catch {
			loadError = 'Failed to load suite results.';
		}

		// Also try to get the suite list to get the name
		try {
			const listRes = await fetch('/api/tests/suites');
			if (listRes.ok) {
				const listData = await listRes.json();
				const found = listData.suites?.find((s: { id: string; name: string; repo: string; last_run: string | null; version: number; tests_count: number }) => s.id === id);
				if (found) {
					meta = {
						id: found.id,
						name: found.name,
						repo: found.repo,
						last_run: found.last_run,
						version: found.version,
						tests_count: found.tests_count,
					};
				}
			}
		} catch {
			// non-fatal — meta from result is fine
		}

		loading = false;
	}

	function formatRun(iso: string | null) {
		if (!iso) return null;
		const diff = Date.now() - new Date(iso).getTime();
		const mins = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		if (hours < 24) return `${hours}h ago`;
		return `${Math.floor(hours / 24)}d ago`;
	}

	async function runSuite() {
		if (!meta || running) return;
		running = true;
		runLog = ['[runowl] Starting sandboxed test run…', `[runowl] Suite: ${meta.name} (v${meta.version})`];

		// Reset test states to pending for animation
		tests = tests.map((t) => ({ ...t, status: 'pending' as const }));

		// Trigger backend run
		const [owner, repo] = meta.repo.split('/');
		try {
			await fetch('/api/tests/run', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ owner: owner ?? 'acme', repo: repo ?? 'api', pr_number: 1 }),
			});
		} catch {
			// noop — still animate
		}

		// Animate through tests one by one, then fetch real results
		const originalCases = result?.cases ?? [];
		for (let i = 0; i < tests.length; i++) {
			await new Promise((r) => setTimeout(r, 150 + Math.random() * 180));
			const orig = originalCases[i];
			const status = orig?.status ?? 'pass';
			tests = tests.map((t, idx) =>
				idx === i ? { ...t, status: status as TestCase['status'] } : t
			);
			runLog = [
				...runLog,
				`  ${status === 'pass' ? '✓' : '✗'} ${tests[i].name} (${tests[i].duration_ms}ms)`,
			];
		}

		// Poll for real results
		await new Promise((r) => setTimeout(r, 800));
		await loadSuite(suiteId!);

		const passed = tests.filter((t) => t.status === 'pass').length;
		const failed = tests.filter((t) => t.status === 'fail' || t.status === 'error').length;
		runLog = [...runLog, `[runowl] Done. ${passed} passed, ${failed} failed.`];
		running = false;
	}

	function statusIcon(status: TestCase['status']) {
		if (status === 'pass') return { icon: CheckCircle, color: 'var(--green)' };
		if (status === 'fail' || status === 'error') return { icon: XCircle, color: 'var(--red)' };
		return { icon: Clock, color: 'var(--yellow)' };
	}
</script>

<svelte:head>
	<title>{meta?.name ?? 'Suite'} — RunOwl</title>
</svelte:head>

{#if loading}
	<div class="detail-page">
		<div class="skeleton-head"></div>
		<div class="stats-row">
			{#each [1,2,3] as _}
				<div class="skeleton-stat"></div>
			{/each}
		</div>
		<div class="skeleton-list"></div>
	</div>
{:else if loadError && !meta}
	<div class="not-found">
		<AlertCircle size={32} opacity={0.4} />
		<p>{loadError}</p>
		<button class="back-link" onclick={() => goto('/app/suites')}>
			<ArrowLeft size={14} /> Back to suites
		</button>
	</div>
{:else}
	<div class="detail-page">
		<!-- Header -->
		<div class="page-head">
			<div class="head-left">
				<button class="back-link" onclick={() => goto('/app/suites')}>
					<ArrowLeft size={14} /> Suites
				</button>
				<div class="title-row">
					<FlaskConical size={17} color="var(--accent)" />
					<h1 class="page-title">{meta?.name ?? suiteId}</h1>
					{#if meta?.version}
						<span class="version-badge">v{meta.version}</span>
					{/if}
					{#if meta?.repo}
						<span class="repo-badge">{meta.repo}</span>
					{/if}
				</div>
				<p class="page-sub">
					{result?.total ?? meta?.tests_count ?? 0} tests ·
					{#if meta?.last_run}
						Last run {formatRun(meta.last_run)}
					{:else}
						Never run
					{/if}
					{#if result?.pr_ref}
						· PR {result.pr_ref}
					{/if}
				</p>
			</div>
			<div class="head-actions">
				<button class="run-btn" onclick={runSuite} disabled={running}>
					{#if running}
						<RefreshCw size={13} class="spin" />
						Running…
					{:else}
						<Play size={13} />
						Run suite
					{/if}
				</button>
			</div>
		</div>

		<!-- Stats row -->
		{#if result}
			<div class="stats-row">
				<div class="stat-card">
					<span class="stat-value green">{result.passed}</span>
					<span class="stat-label">Passed</span>
				</div>
				<div class="stat-card">
					<span class="stat-value red">{result.failed + result.errors}</span>
					<span class="stat-label">Failed</span>
				</div>
				<div class="stat-card">
					<span class="stat-value">{result.total}</span>
					<span class="stat-label">Total</span>
				</div>
				{#if result.total > 0}
					<div class="stat-card stat-bar-card">
						<div class="bar-track">
							<div
								class="bar-fill"
								style="width: {(result.passed / result.total) * 100}%"
							></div>
						</div>
						<span class="stat-label">
							{Math.round((result.passed / result.total) * 100)}% passing
						</span>
					</div>
				{/if}
				{#if result.duration_ms > 0}
					<div class="stat-card">
						<span class="stat-value">{(result.duration_ms / 1000).toFixed(1)}s</span>
						<span class="stat-label">Duration</span>
					</div>
				{/if}
			</div>
		{/if}

		<div class="content-grid">
			<!-- Test cases -->
			<div class="tests-section">
				<span class="section-label">Test cases</span>
				{#if tests.length === 0}
					<div class="empty-tests">
						<FlaskConical size={32} strokeWidth={1.25} opacity={0.25} />
						<p>No tests generated yet.</p>
						<p class="empty-hint">Click "Run suite" to generate and execute tests against this repository.</p>
					</div>
				{:else}
					<div class="tests-list">
						{#each tests as t (t.id)}
							{@const { icon: StatusIcon, color } = statusIcon(t.status)}
							<div class="test-row" class:test-fail={t.status === 'fail' || t.status === 'error'} class:test-pending={t.status === 'pending'}>
								<div class="test-icon">
									<StatusIcon size={14} {color} />
								</div>
								<div class="test-info">
									<span class="test-name">{t.name}</span>
									{#if t.framework || t.type}
										<div class="test-meta-chips">
											{#if t.framework}
												<span class="test-chip">{t.framework}</span>
											{/if}
											{#if t.type}
												<span class="test-chip">{t.type}</span>
											{/if}
										</div>
									{/if}
									{#if t.error}
										<span class="test-error">{t.error}</span>
									{/if}
								</div>
								<div class="test-right">
									{#if t.status !== 'pending'}
										<span class="test-dur">{t.duration_ms}ms</span>
									{/if}
									{#if t.video_url}
										<button class="media-btn" onclick={() => activeVideo = t.video_url ?? null} title="Watch recording">
											<Video size={12} />
										</button>
									{/if}
									{#if t.replay_url}
										<button class="media-btn" onclick={() => activeReplay = t.replay_url ?? null} title="Session replay">
											<Rewind size={12} />
										</button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Video player (shown when a test recording is selected) -->
			{#if activeVideo}
				<div class="media-section">
					<div class="media-head">
						<Video size={13} color="var(--muted)" />
						<span class="section-label">Test recording</span>
						<button class="close-media" onclick={() => activeVideo = null}>✕</button>
					</div>
					<div class="video-container">
						<video
							src={activeVideo}
							controls
							playsinline
							class="video-player"
						>
							<track kind="captions" />
						</video>
					</div>
				</div>
			{/if}

			<!-- Session replay panel (shown when a replay is selected) -->
			{#if activeReplay}
				<div class="media-section">
					<div class="media-head">
						<Rewind size={13} color="var(--muted)" />
						<span class="section-label">Session replay</span>
						<button class="close-media" onclick={() => activeReplay = null}>✕</button>
					</div>
					<div class="replay-container">
						<iframe
							src={activeReplay}
							title="Session replay"
							class="replay-frame"
							sandbox="allow-scripts allow-same-origin"
						></iframe>
					</div>
				</div>
			{/if}

			<!-- Run log -->
			{#if runLog.length > 0}
				<div class="log-section">
					<div class="log-head">
						<Terminal size={13} color="var(--muted)" />
						<span class="section-label">Run log</span>
					</div>
					<div class="log-box">
						{#each runLog as line}
							<div class="log-line" class:log-pass={line.includes('✓')} class:log-fail={line.includes('✗')}>
								{line}
							</div>
						{/each}
						{#if running}
							<div class="log-line log-cursor">▋</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.detail-page {
		padding: 2rem 2.5rem 3rem;
		max-width: 960px;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.not-found {
		padding: 4rem 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		color: var(--muted);
		font-size: 0.88rem;
	}

	/* Skeletons */
	.skeleton-head {
		height: 80px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		animation: shimmer 1.4s ease-in-out infinite;
	}
	.stats-row {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.skeleton-stat {
		height: 78px;
		width: 90px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 10px;
		animation: shimmer 1.4s ease-in-out infinite;
	}
	.skeleton-list {
		height: 240px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		animation: shimmer 1.4s ease-in-out infinite;
	}
	@keyframes shimmer { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

	.page-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}
	.head-left { display: flex; flex-direction: column; gap: 0.35rem; }

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.78rem;
		color: var(--muted);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		font-family: inherit;
		transition: color 0.12s;
	}
	.back-link:hover { color: var(--text); }

	.title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.page-title {
		font-size: 1.35rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		color: var(--text);
	}
	.version-badge {
		font-size: 0.68rem;
		font-weight: 700;
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		color: var(--accent);
		border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
	}
	.repo-badge {
		font-size: 0.72rem;
		color: var(--muted);
		background: var(--surface-2);
		border: 1px solid var(--border);
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
	}
	.page-sub { font-size: 0.78rem; color: var(--muted); }

	.run-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: var(--accent);
		color: #fff;
		border: none;
		padding: 0.5rem 1.1rem;
		border-radius: 8px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 28%, transparent);
		transition: opacity 0.15s, transform 0.15s;
		flex-shrink: 0;
	}
	.run-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
	.run-btn:disabled { opacity: 0.65; cursor: not-allowed; }

	:global(.spin) { animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }

	/* Stats */
	.stat-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.85rem 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 80px;
	}
	.stat-bar-card { flex: 1; min-width: 160px; justify-content: center; }
	.stat-value {
		font-size: 1.6rem;
		font-weight: 800;
		letter-spacing: -0.04em;
		color: var(--text);
	}
	.stat-value.green { color: var(--green); }
	.stat-value.red { color: var(--red); }
	.stat-label { font-size: 0.72rem; color: var(--muted); }
	.bar-track {
		height: 6px;
		background: var(--border);
		border-radius: 3px;
		overflow: hidden;
		margin-bottom: 0.4rem;
	}
	.bar-fill {
		height: 100%;
		background: var(--green);
		border-radius: 3px;
		transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
	}

	/* Content grid */
	.content-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Tests section */
	.tests-section {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}
	.section-label {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}
	.empty-tests {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 3rem 1rem;
		color: var(--muted);
		font-size: 0.85rem;
		text-align: center;
	}
	.empty-hint { font-size: 0.75rem; }

	.tests-list {
		display: flex;
		flex-direction: column;
		gap: 0;
	}
	.test-row {
		display: flex;
		align-items: flex-start;
		gap: 0.65rem;
		padding: 0.65rem 0;
		border-bottom: 1px solid var(--border);
	}
	.test-row:last-child { border-bottom: none; }
	.test-row.test-fail { background: color-mix(in srgb, var(--red) 4%, transparent); margin: 0 -1.25rem; padding-left: 1.25rem; padding-right: 1.25rem; }
	.test-row.test-pending { opacity: 0.5; }
	.test-icon { flex-shrink: 0; margin-top: 1px; }
	.test-info { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
	.test-name { font-size: 0.82rem; color: var(--text); }
	.test-meta-chips { display: flex; gap: 0.3rem; flex-wrap: wrap; }
	.test-chip {
		font-size: 0.65rem;
		padding: 0.1rem 0.35rem;
		border-radius: 3px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		color: var(--muted);
		font-weight: 600;
		text-transform: lowercase;
	}
	.test-error {
		font-size: 0.72rem;
		color: var(--red);
		font-family: 'SF Mono', 'Fira Code', monospace;
		line-height: 1.5;
	}
	.test-right {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		flex-shrink: 0;
	}
	.test-dur { font-size: 0.7rem; color: var(--muted); font-variant-numeric: tabular-nums; }

	.media-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 4px;
		border: 1px solid var(--border);
		background: var(--surface-2);
		color: var(--muted);
		cursor: pointer;
		transition: color 0.12s, border-color 0.12s;
	}
	.media-btn:hover { color: var(--accent); border-color: var(--accent); }

	/* Video / Replay panels */
	.media-section {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}
	.media-head {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.85rem 1.25rem;
		border-bottom: 1px solid var(--border);
	}
	.close-media {
		margin-left: auto;
		background: none;
		border: 1px solid var(--border);
		border-radius: 5px;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: var(--muted);
		font-size: 0.75rem;
		transition: color 0.12s;
	}
	.close-media:hover { color: var(--text); }
	.video-container { padding: 1rem; background: #000; }
	.video-player {
		width: 100%;
		border-radius: 6px;
		max-height: 400px;
	}
	.replay-container { height: 360px; }
	.replay-frame {
		width: 100%;
		height: 100%;
		border: none;
	}

	/* Log section */
	.log-section {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.log-head {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.log-box {
		background: #0d0d0d;
		border-radius: 8px;
		padding: 0.85rem 1rem;
		font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
		font-size: 0.75rem;
		line-height: 1.7;
		color: #a0a0a0;
		overflow-x: auto;
		max-height: 280px;
		overflow-y: auto;
	}
	.log-line { white-space: pre; }
	.log-pass { color: #4ade80; }
	.log-fail { color: #f87171; }
	.log-cursor { animation: blink 1s step-end infinite; }
	@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

	@media (max-width: 640px) {
		.detail-page { padding: 1.25rem 1rem 2rem; }
		.stats-row { gap: 0.5rem; }
	}
</style>
