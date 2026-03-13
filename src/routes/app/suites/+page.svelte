<script lang="ts">
	import { Plus, FlaskConical, CheckCircle, XCircle, Clock, Play, ChevronRight, X } from 'lucide-svelte';

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

	const demoSuites: TestSuite[] = [
		{
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
		{
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
		{
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
	];

	let suites = $state<TestSuite[]>(demoSuites);
	let showCreate = $state(false);
	let newName = $state('');
	let newRepo = $state('');
	let createError = $state('');
	let creating = $state(false);

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

	async function createSuite() {
		createError = '';
		if (!newName.trim()) { createError = 'Name is required.'; return; }
		if (!newRepo.trim()) { createError = 'Repository is required.'; return; }
		creating = true;
		await new Promise((r) => setTimeout(r, 600));
		suites = [
			...suites,
			{
				id: crypto.randomUUID(),
				name: newName.trim(),
				repo: newRepo.trim(),
				last_run: null,
				status: 'never',
				tests_count: 0,
				pass_count: 0,
				fail_count: 0,
				version: 1,
			},
		];
		creating = false;
		showCreate = false;
		newName = '';
		newRepo = '';
	}

	function closeCreate() {
		showCreate = false;
		newName = '';
		newRepo = '';
		createError = '';
	}

	function onBackdrop(e: MouseEvent) {
		if ((e.target as HTMLElement).classList.contains('modal-backdrop')) closeCreate();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeCreate();
	}

	function simulateRun(id: string) {
		suites = suites.map((s) =>
			s.id === id ? { ...s, status: 'pending' as const } : s
		);
		setTimeout(() => {
			suites = suites.map((s) =>
				s.id === id
					? { ...s, status: 'passing' as const, last_run: new Date().toISOString(), pass_count: s.tests_count, fail_count: 0 }
					: s
			);
		}, 2000);
	}
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
	<title>Test Suites — RunOwl</title>
</svelte:head>

<div class="suites-page">
	<!-- Header -->
	<div class="page-head">
		<div>
			<h1 class="page-title">Test Suites</h1>
			<p class="page-sub">AI-generated test suites, sandboxed execution, version history.</p>
		</div>
		<button class="cta-btn" onclick={() => (showCreate = true)}>
			<Plus size={14} strokeWidth={2.5} />
			New suite
		</button>
	</div>

	<!-- Suite cards -->
	{#if suites.length === 0}
		<div class="empty-state">
			<FlaskConical size={40} strokeWidth={1.25} opacity={0.25} />
			<p>No test suites yet.</p>
			<p class="empty-hint">Create a suite to generate and run AI tests against your PRs.</p>
		</div>
	{:else}
		<div class="suites-grid">
			{#each suites as suite (suite.id)}
				{@const runLabel = formatRun(suite.last_run)}
				<div class="suite-card status-{suite.status}">
					<!-- Card header -->
					<div class="suite-head">
						<div class="suite-title-row">
							<FlaskConical size={15} color="var(--accent)" />
							<span class="suite-name">{suite.name}</span>
						</div>
						<span class="suite-repo">{suite.repo}</span>
					</div>

					<!-- Stats row -->
					<div class="suite-stats">
						{#if suite.status === 'never'}
							<span class="stat-chip chip-muted">Never run</span>
						{:else if suite.status === 'pending'}
							<span class="stat-chip chip-yellow">
								<Clock size={11} />
								Running…
							</span>
						{:else}
							<span class="stat-chip chip-green">
								<CheckCircle size={11} />
								{suite.pass_count} passed
							</span>
							{#if suite.fail_count > 0}
								<span class="stat-chip chip-red">
									<XCircle size={11} />
									{suite.fail_count} failed
								</span>
							{/if}
						{/if}
						<span class="stat-dot"></span>
						<span class="suite-meta">{suite.tests_count} tests · v{suite.version}</span>
					</div>

					<!-- Progress bar -->
					{#if suite.tests_count > 0 && suite.status !== 'never' && suite.status !== 'pending'}
						<div class="pass-bar-track">
							<div
								class="pass-bar-fill"
								style="width: {(suite.pass_count / suite.tests_count) * 100}%"
							></div>
						</div>
					{:else}
						<div class="pass-bar-track"></div>
					{/if}

					<!-- Footer -->
					<div class="suite-foot">
						<span class="last-run">
							{#if runLabel}
								Last run {runLabel}
							{:else}
								Not run yet
							{/if}
						</span>
						<div class="suite-actions">
							<button
								class="run-btn"
								onclick={() => simulateRun(suite.id)}
								disabled={suite.status === 'pending'}
								title="Run suite"
							>
								<Play size={12} />
								Run
							</button>
							<a href="/app/suites/{suite.id}" class="detail-btn" title="View details">
								<ChevronRight size={14} />
							</a>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create modal -->
{#if showCreate}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={onBackdrop} role="dialog" aria-modal="true" aria-label="Create test suite" tabindex="-1">
		<div class="modal">
			<div class="modal-head">
				<div class="modal-title-row">
					<span class="modal-icon"><FlaskConical size={15} color="var(--accent)" /></span>
					<h2 class="modal-title">New test suite</h2>
				</div>
				<button class="close-btn" onclick={closeCreate} aria-label="Close"><X size={15} /></button>
			</div>

			<div class="modal-body">
				<label class="field-label" for="suite-name">Suite name</label>
				<input
					id="suite-name"
					class="field-input"
					class:field-error={!!createError && !newName}
					type="text"
					placeholder="e.g. Auth module tests"
					bind:value={newName}
					oninput={() => (createError = '')}
				/>

				<label class="field-label" for="suite-repo">Repository</label>
				<input
					id="suite-repo"
					class="field-input"
					class:field-error={!!createError && !newRepo}
					type="text"
					placeholder="owner/repo"
					bind:value={newRepo}
					oninput={() => (createError = '')}
				/>

				{#if createError}
					<p class="error-msg">{createError}</p>
				{/if}

				<p class="create-hint">
					RunOwl will analyse your repository and generate an AI test suite. Tests run in a secure Deno sandbox.
				</p>
			</div>

			<div class="modal-foot">
				<button class="btn-ghost" onclick={closeCreate}>Cancel</button>
				<button class="btn-primary" onclick={createSuite} disabled={creating}>
					{#if creating}
						<span class="spinner"></span>Creating…
					{:else}
						Create suite
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.suites-page {
		padding: 2rem 2.5rem 3rem;
		max-width: 960px;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.page-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}
	.page-title {
		font-size: 1.45rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		color: var(--text);
		margin-bottom: 0.2rem;
	}
	.page-sub { font-size: 0.82rem; color: var(--muted); }

	.cta-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: var(--accent);
		color: #fff;
		border: none;
		padding: 0.5rem 1.1rem;
		border-radius: 8px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		flex-shrink: 0;
		box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 28%, transparent);
		transition: opacity 0.15s, transform 0.15s;
	}
	.cta-btn:hover { opacity: 0.9; transform: translateY(-1px); }

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.65rem;
		padding: 5rem 2rem;
		color: var(--muted);
		text-align: center;
		font-size: 0.88rem;
	}
	.empty-hint { font-size: 0.78rem; color: var(--muted); max-width: 320px; }

	/* Suite cards */
	.suites-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
	}

	.suite-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1rem 1.15rem;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.suite-card:hover {
		box-shadow: 0 6px 20px rgba(0,0,0,0.15);
	}
	.suite-card.status-passing:hover { border-color: color-mix(in srgb, var(--green) 35%, transparent); }
	.suite-card.status-failing:hover { border-color: color-mix(in srgb, var(--red) 35%, transparent); }

	.suite-head { display: flex; flex-direction: column; gap: 0.2rem; }
	.suite-title-row { display: flex; align-items: center; gap: 0.45rem; }
	.suite-name { font-size: 0.88rem; font-weight: 600; color: var(--text); }
	.suite-repo { font-size: 0.72rem; color: var(--muted); margin-left: calc(15px + 0.45rem); }

	.suite-stats {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}
	.stat-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.18rem 0.45rem;
		border-radius: 4px;
	}
	.chip-green { background: color-mix(in srgb, var(--green) 12%, transparent); color: var(--green); }
	.chip-red { background: color-mix(in srgb, var(--red) 12%, transparent); color: var(--red); }
	.chip-yellow { background: color-mix(in srgb, var(--yellow) 12%, transparent); color: var(--yellow); }
	.chip-muted { background: var(--surface-2); color: var(--muted); }
	.stat-dot {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: var(--border);
	}
	.suite-meta { font-size: 0.72rem; color: var(--muted); }

	.pass-bar-track {
		height: 3px;
		background: var(--border);
		border-radius: 2px;
		overflow: hidden;
	}
	.pass-bar-fill {
		height: 100%;
		background: var(--green);
		border-radius: 2px;
		transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.suite-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.last-run { font-size: 0.72rem; color: var(--muted); }
	.suite-actions { display: flex; align-items: center; gap: 0.35rem; }

	.run-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		background: var(--surface-2);
		border: 1px solid var(--border);
		color: var(--text);
		border-radius: 6px;
		padding: 0.3rem 0.65rem;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		transition: background 0.12s, border-color 0.12s;
	}
	.run-btn:hover:not(:disabled) { background: var(--surface); border-color: var(--accent); color: var(--accent); }
	.run-btn:disabled { opacity: 0.5; cursor: not-allowed; }

	.detail-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 6px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		color: var(--muted);
		text-decoration: none;
		transition: color 0.12s, border-color 0.12s;
	}
	.detail-btn:hover { color: var(--text); border-color: var(--muted); }

	/* Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 300;
		background: rgba(0,0,0,0.6);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		animation: fadeIn 0.15s ease;
	}
	@keyframes fadeIn { from { opacity: 0; } }
	.modal {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		width: 100%;
		max-width: 420px;
		box-shadow: 0 24px 64px rgba(0,0,0,0.5);
		animation: slideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
		overflow: hidden;
	}
	@keyframes slideUp { from { opacity: 0; transform: translateY(12px) scale(0.98); } }

	.modal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.1rem 1.25rem 0;
	}
	.modal-title-row { display: flex; align-items: center; gap: 0.6rem; }
	.modal-icon {
		width: 30px; height: 30px;
		border-radius: 8px;
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
		display: flex; align-items: center; justify-content: center;
	}
	.modal-title { font-size: 0.95rem; font-weight: 700; color: var(--text); letter-spacing: -0.02em; }
	.close-btn {
		width: 28px; height: 28px;
		border-radius: 7px;
		background: none;
		border: 1px solid var(--border);
		color: var(--muted);
		cursor: pointer;
		display: flex; align-items: center; justify-content: center;
		transition: color 0.12s, background 0.12s;
	}
	.close-btn:hover { color: var(--text); background: var(--surface-2); }

	.modal-body {
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}
	.field-label { font-size: 0.75rem; font-weight: 600; color: var(--text); }
	.field-input {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.6rem 0.85rem;
		font-size: 0.85rem;
		color: var(--text);
		font-family: inherit;
		outline: none;
		width: 100%;
		box-sizing: border-box;
		transition: border-color 0.15s;
	}
	.field-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent); }
	.field-input.field-error { border-color: var(--red); }
	.field-input::placeholder { color: var(--muted); opacity: 0.6; }
	.error-msg { font-size: 0.75rem; color: var(--red); }
	.create-hint { font-size: 0.75rem; color: var(--muted); line-height: 1.5; margin-top: 0.25rem; }

	.modal-foot {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.6rem;
		padding: 0.9rem 1.25rem;
		border-top: 1px solid var(--border);
		background: var(--surface-2);
	}
	.btn-ghost {
		padding: 0.45rem 0.9rem;
		border-radius: 7px;
		border: 1px solid var(--border);
		background: none;
		font-size: 0.82rem;
		color: var(--muted);
		cursor: pointer;
		font-family: inherit;
	}
	.btn-ghost:hover { color: var(--text); }
	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem 1rem;
		border-radius: 7px;
		background: var(--accent);
		color: #fff;
		font-size: 0.82rem;
		font-weight: 600;
		border: none;
		cursor: pointer;
		font-family: inherit;
	}
	.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
	.btn-primary:not(:disabled):hover { opacity: 0.9; }
	.spinner {
		width: 13px; height: 13px;
		border: 2px solid rgba(255,255,255,0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	@media (max-width: 640px) {
		.suites-page { padding: 1.25rem 1rem 2rem; }
		.suites-grid { grid-template-columns: 1fr; }
	}
</style>
