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
	} from 'lucide-svelte';

	interface TestSuite {
		id: string;
		name: string;
		repo: string;
		last_run: string | null;
		status: 'passing' | 'failing' | 'pending' | 'never';
		tests_count: number;
		pass_count: number;
		fail_count: number;
		version: number;
	}

	interface TestCase {
		id: string;
		name: string;
		status: 'pass' | 'fail' | 'pending';
		duration_ms: number;
		error?: string;
	}

	// Demo data keyed by suite ID
	const suiteData: Record<string, TestSuite> = {
		'1': {
			id: '1',
			name: 'Auth module tests',
			repo: 'acme/api',
			last_run: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
			status: 'passing',
			tests_count: 24,
			pass_count: 24,
			fail_count: 0,
			version: 3,
		},
		'2': {
			id: '2',
			name: 'Payment flow tests',
			repo: 'acme/api',
			last_run: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
			status: 'failing',
			tests_count: 18,
			pass_count: 15,
			fail_count: 3,
			version: 2,
		},
		'3': {
			id: '3',
			name: 'UI component smoke tests',
			repo: 'acme/web',
			last_run: null,
			status: 'never',
			tests_count: 8,
			pass_count: 0,
			fail_count: 0,
			version: 1,
		},
	};

	const testCaseData: Record<string, TestCase[]> = {
		'1': [
			{ id: 't1', name: 'login() returns 200 with valid credentials', status: 'pass', duration_ms: 42 },
			{ id: 't2', name: 'login() returns 401 with invalid password', status: 'pass', duration_ms: 38 },
			{ id: 't3', name: 'login() returns 429 after rate limit exceeded', status: 'pass', duration_ms: 55 },
			{ id: 't4', name: 'register() creates user and returns 201', status: 'pass', duration_ms: 91 },
			{ id: 't5', name: 'register() returns 409 for duplicate email', status: 'pass', duration_ms: 47 },
			{ id: 't6', name: 'register() enforces rate limit (3 req/5min)', status: 'pass', duration_ms: 61 },
			{ id: 't7', name: 'resetPassword() sends email for known user', status: 'pass', duration_ms: 84 },
			{ id: 't8', name: 'resetPassword() returns 429 after 2 attempts', status: 'pass', duration_ms: 53 },
		],
		'2': [
			{ id: 't1', name: 'checkout() creates order with valid cart', status: 'pass', duration_ms: 120 },
			{ id: 't2', name: 'checkout() applies discount code correctly', status: 'pass', duration_ms: 88 },
			{ id: 't3', name: 'checkout() fails gracefully on payment timeout', status: 'fail', duration_ms: 5012, error: 'Expected status 504, received 500. Payment gateway mock not properly configured.' },
			{ id: 't4', name: 'refund() reverses charge within 24h window', status: 'pass', duration_ms: 77 },
			{ id: 't5', name: 'refund() rejects request outside window', status: 'pass', duration_ms: 64 },
			{ id: 't6', name: 'webhook() verifies Stripe signature', status: 'fail', duration_ms: 19, error: 'TypeError: Cannot read properties of undefined (reading "signature"). Missing STRIPE_WEBHOOK_SECRET in test env.' },
			{ id: 't7', name: 'webhook() idempotent on duplicate events', status: 'pass', duration_ms: 45 },
			{ id: 't8', name: 'invoice() generates PDF for completed order', status: 'fail', duration_ms: 203, error: 'PDFKit dependency missing in sandbox environment.' },
		],
		'3': [],
	};

	const suiteId = $derived($page.params.id);
	let suite = $state<TestSuite | null>(null);
	let tests = $state<TestCase[]>([]);
	let running = $state(false);
	let runLog = $state<string[]>([]);

	$effect(() => {
		const s = suiteId ? suiteData[suiteId] : undefined;
		suite = s ?? null;
		tests = suiteId ? (testCaseData[suiteId] ?? []) : [];
	});

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
		if (!suite) return;
		running = true;
		runLog = ['[runowl] Starting sandboxed test run…', `[runowl] Suite: ${suite.name} (v${suite.version})`];
		tests = tests.map((t) => ({ ...t, status: 'pending' as const }));

		for (let i = 0; i < tests.length; i++) {
			await new Promise((r) => setTimeout(r, 180 + Math.random() * 200));
			const orig = suiteId ? testCaseData[suiteId]?.[i] : undefined;
			tests = tests.map((t, idx) =>
				idx === i ? { ...t, status: orig?.status ?? 'pass' } : t
			);
			runLog = [
				...runLog,
				`  ${tests[i].status === 'pass' ? '✓' : '✗'} ${tests[i].name} (${tests[i].duration_ms}ms)`,
			];
		}

		const passed = tests.filter((t) => t.status === 'pass').length;
		const failed = tests.filter((t) => t.status === 'fail').length;
		runLog = [...runLog, `[runowl] Done. ${passed} passed, ${failed} failed.`];
		if (suite) {
			suite = {
				...suite,
				status: failed > 0 ? 'failing' : 'passing',
				pass_count: passed,
				fail_count: failed,
				last_run: new Date().toISOString(),
			};
		}
		running = false;
	}
</script>

<svelte:head>
	<title>{suite?.name ?? 'Suite'} — RunOwl</title>
</svelte:head>

{#if !suite}
	<div class="not-found">
		<p>Suite not found.</p>
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
					<h1 class="page-title">{suite.name}</h1>
					<span class="version-badge">v{suite.version}</span>
					<span class="repo-badge">{suite.repo}</span>
				</div>
				<p class="page-sub">
					{suite.tests_count} tests ·
					{#if suite.last_run}
						Last run {formatRun(suite.last_run)}
					{:else}
						Never run
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
		<div class="stats-row">
			<div class="stat-card">
				<span class="stat-value green">{suite.pass_count}</span>
				<span class="stat-label">Passed</span>
			</div>
			<div class="stat-card">
				<span class="stat-value red">{suite.fail_count}</span>
				<span class="stat-label">Failed</span>
			</div>
			<div class="stat-card">
				<span class="stat-value">{suite.tests_count}</span>
				<span class="stat-label">Total</span>
			</div>
			{#if suite.tests_count > 0}
				<div class="stat-card stat-bar-card">
					<div class="bar-track">
						<div
							class="bar-fill"
							style="width: {(suite.pass_count / suite.tests_count) * 100}%"
						></div>
					</div>
					<span class="stat-label">
						{Math.round((suite.pass_count / suite.tests_count) * 100)}% passing
					</span>
				</div>
			{/if}
		</div>

		<div class="content-grid">
			<!-- Test cases -->
			<div class="tests-section">
				<span class="section-label">Test cases</span>
				{#if tests.length === 0}
					<div class="empty-tests">
						<FlaskConical size={32} strokeWidth={1.25} opacity={0.25} />
						<p>No tests generated yet.</p>
						<p class="empty-hint">Click "Run suite" to generate and execute tests.</p>
					</div>
				{:else}
					<div class="tests-list">
						{#each tests as t (t.id)}
							<div class="test-row" class:test-fail={t.status === 'fail'} class:test-pending={t.status === 'pending'}>
								<div class="test-icon">
									{#if t.status === 'pass'}
										<CheckCircle size={14} color="var(--green)" />
									{:else if t.status === 'fail'}
										<XCircle size={14} color="var(--red)" />
									{:else}
										<Clock size={14} color="var(--yellow)" />
									{/if}
								</div>
								<div class="test-info">
									<span class="test-name">{t.name}</span>
									{#if t.error}
										<span class="test-error">{t.error}</span>
									{/if}
								</div>
								{#if t.status !== 'pending'}
									<span class="test-dur">{t.duration_ms}ms</span>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>

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
	.stats-row {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
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
	.test-error {
		font-size: 0.72rem;
		color: var(--red);
		font-family: 'SF Mono', 'Fira Code', monospace;
		line-height: 1.5;
	}
	.test-dur { font-size: 0.7rem; color: var(--muted); flex-shrink: 0; font-variant-numeric: tabular-nums; }

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
