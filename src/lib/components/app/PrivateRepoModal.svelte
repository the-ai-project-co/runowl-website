<script lang="ts">
	import { githubIntegration, MOCK_AVAILABLE_REPOS } from '$lib/stores/github-integration.svelte';
	import { privateRepoModal } from '$lib/stores/private-repo-modal.svelte';
	import { CheckCircle2, Lock, AlertCircle, X } from 'lucide-svelte';

	let { onConnected }: { onConnected?: () => void } = $props();

	let selectedRepos = $state<string[]>([]);
	let allSelected = $derived(selectedRepos.length === MOCK_AVAILABLE_REPOS.length);

	function toggleRepo(id: string) {
		selectedRepos = selectedRepos.includes(id)
			? selectedRepos.filter((r) => r !== id)
			: [...selectedRepos, id];
	}

	function toggleAll() {
		selectedRepos = allSelected ? [] : MOCK_AVAILABLE_REPOS.map((r) => r.id);
	}

	function back() {
		githubIntegration.reset();
		githubIntegration.startConnect();
		selectedRepos = [];
	}

	function close() {
		if (githubIntegration.step === 'oauth_pending') return;
		selectedRepos = [];
		privateRepoModal.hide();
	}

	function onBackdrop(e: MouseEvent) {
		if ((e.target as HTMLElement).classList.contains('modal-backdrop')) close();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}

	// Auto-fire onConnected after step reaches 'done'
	$effect(() => {
		if (githubIntegration.step !== 'done') return;
		const timer = setTimeout(() => {
			privateRepoModal.fireConnected();
			onConnected?.();
		}, 400);
		return () => clearTimeout(timer);
	});
</script>

<svelte:window onkeydown={onKeydown} />

{#if privateRepoModal.open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={onBackdrop}>
		<div class="modal" role="dialog" aria-modal="true" aria-label="Connect GitHub">

			{#if githubIntegration.step === 'selecting_method'}
				<!-- ── Step 1: Choose method ── -->
				<div class="modal-head">
					<div class="modal-title-row">
						<span class="modal-icon">
							<Lock size={15} color="var(--accent)" />
						</span>
						<div>
							<h2 class="modal-title">Connect GitHub to continue</h2>
							{#if privateRepoModal.repoFullName}
								<p class="modal-sub"><code>{privateRepoModal.repoFullName}</code> is a private repository.</p>
							{:else}
								<p class="modal-sub">Grant RunOwl access to your private repositories.</p>
							{/if}
						</div>
					</div>
					<button class="close-btn" onclick={close} aria-label="Close"><X size={15} /></button>
				</div>
				<div class="modal-body">
					<div class="method-grid">
						<button class="method-card recommended" onclick={() => githubIntegration.selectMethod('github_app')}>
							<span class="recommended-badge">Recommended</span>
							<div class="method-icon">
								<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
									<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
								</svg>
							</div>
							<span class="method-name">GitHub App</span>
							<span class="method-hint">Fine-grained access, select specific repos.</span>
						</button>
						<button class="method-card" onclick={() => githubIntegration.selectMethod('pat')}>
							<div class="method-icon">
								<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
									<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
								</svg>
							</div>
							<span class="method-name">Personal Access Token</span>
							<span class="method-hint">Paste a classic or fine-grained PAT.</span>
						</button>
					</div>
				</div>
				<div class="modal-foot">
					<a class="why-link" href="https://docs.github.com/en/apps" target="_blank" rel="noopener">Why do I need this?</a>
				</div>

			{:else if githubIntegration.step === 'oauth_pending'}
				<!-- ── Step 2: Pending ── -->
				<div class="modal-body centered">
					<div class="pending-spinner"></div>
					<p class="pending-text">Connecting with GitHub…</p>
					<div class="pending-bar"><div class="pending-fill"></div></div>
				</div>

			{:else if githubIntegration.step === 'select_repos'}
				<!-- ── Step 3: Select repos ── -->
				<div class="modal-head">
					<div class="modal-title-row">
						<span class="modal-icon">
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
						</span>
						<div>
							<h2 class="modal-title">Choose repositories</h2>
							<p class="modal-sub">Select which repos RunOwl can access.</p>
						</div>
					</div>
					<button class="close-btn" onclick={close} aria-label="Close"><X size={15} /></button>
				</div>
				<div class="modal-body">
					<div class="select-all-row">
						<button class="select-all-btn" onclick={toggleAll}>
							{allSelected ? 'Deselect all' : 'Select all'}
						</button>
						<span class="selected-count">{selectedRepos.length} selected</span>
					</div>
					<div class="repo-list">
						{#each MOCK_AVAILABLE_REPOS as repo (repo.id)}
							<label class="repo-row" class:checked={selectedRepos.includes(repo.id)}>
								<input
									type="checkbox"
									checked={selectedRepos.includes(repo.id)}
									onchange={() => toggleRepo(repo.id)}
								/>
								<div class="repo-avatar">{repo.fullName[0].toUpperCase()}</div>
								<span class="repo-name">{repo.fullName}</span>
								<span class="private-chip"><Lock size={9} /> private</span>
							</label>
						{/each}
					</div>
				</div>
				<div class="modal-foot foot-row">
					<button class="btn-ghost" onclick={back}>Back</button>
					<button
						class="btn-primary"
						onclick={() => githubIntegration.confirmRepoSelection(selectedRepos)}
						disabled={selectedRepos.length === 0}
					>
						Grant access ({selectedRepos.length})
					</button>
				</div>

			{:else if githubIntegration.step === 'pat_entry'}
				<!-- ── Step 4: PAT entry ── -->
				<div class="modal-head">
					<div class="modal-title-row">
						<span class="modal-icon">
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
						</span>
						<div>
							<h2 class="modal-title">Personal Access Token</h2>
							<p class="modal-sub">Paste a token with <code>repo</code> scope.</p>
						</div>
					</div>
					<button class="close-btn" onclick={close} aria-label="Close"><X size={15} /></button>
				</div>
				<div class="modal-body">
					<label class="field-label" for="pat-input">GitHub token</label>
					<input
						id="pat-input"
						class="field-input"
						class:field-error={!!githubIntegration.patError}
						type="password"
						placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
						value={githubIntegration.patValue}
						oninput={(e) => (githubIntegration.patValue = (e.target as HTMLInputElement).value)}
					/>
					{#if githubIntegration.patError}
						<div class="input-error">
							<AlertCircle size={12} />
							{githubIntegration.patError}
						</div>
					{/if}
					<a
						class="gen-link"
						href="https://github.com/settings/tokens/new?scopes=repo&description=RunOwl"
						target="_blank"
						rel="noopener"
					>
						Generate token on GitHub ↗
					</a>
				</div>
				<div class="modal-foot foot-row">
					<button class="btn-ghost" onclick={back}>Back</button>
					<button class="btn-primary" onclick={() => githubIntegration.submitPAT(githubIntegration.patValue)}>
						Connect
					</button>
				</div>

			{:else if githubIntegration.step === 'done'}
				<!-- ── Step 5: Success ── -->
				<div class="modal-body centered">
					<div class="success-icon">
						<CheckCircle2 size={40} color="var(--green)" strokeWidth={1.5} />
					</div>
					<p class="success-title">Connected to GitHub</p>
					{#if githubIntegration.account}
						<div class="success-account">
							<img src={githubIntegration.account.avatarUrl} alt={githubIntegration.account.login} class="success-avatar" />
							<span class="success-login">@{githubIntegration.account.login}</span>
						</div>
					{/if}
					<p class="success-repos">
						{githubIntegration.repos.length} {githubIntegration.repos.length === 1 ? 'repository' : 'repositories'} granted access
					</p>
					<p class="success-hint">Starting review…</p>
				</div>
			{/if}

		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 300;
		background: rgba(0, 0, 0, 0.65);
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
		max-width: 440px;
		box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
		animation: slideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
		overflow: hidden;
	}
	@keyframes slideUp { from { opacity: 0; transform: translateY(12px) scale(0.98); } }

	/* Header */
	.modal-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 1.1rem 1.25rem 0;
	}
	.modal-title-row { display: flex; align-items: flex-start; gap: 0.65rem; flex: 1; }
	.modal-icon {
		width: 32px; height: 32px; flex-shrink: 0;
		border-radius: 8px;
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
		display: flex; align-items: center; justify-content: center;
	}
	.modal-title { font-size: 0.95rem; font-weight: 700; color: var(--text); letter-spacing: -0.02em; }
	.modal-sub { font-size: 0.78rem; color: var(--muted); margin-top: 0.15rem; }
	.modal-sub code { font-size: 0.75rem; background: var(--surface-2); padding: 0.05rem 0.3rem; border-radius: 3px; }

	.close-btn {
		width: 28px; height: 28px; flex-shrink: 0;
		border-radius: 7px; background: none;
		border: 1px solid var(--border);
		color: var(--muted); cursor: pointer;
		display: flex; align-items: center; justify-content: center;
		transition: color 0.12s, background 0.12s;
	}
	.close-btn:hover { color: var(--text); background: var(--surface-2); }

	/* Body */
	.modal-body {
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.modal-body.centered {
		align-items: center;
		text-align: center;
		padding: 2rem 1.25rem;
		gap: 0.85rem;
	}

	/* Footer */
	.modal-foot {
		padding: 0.9rem 1.25rem;
		border-top: 1px solid var(--border);
		background: var(--surface-2);
	}
	.foot-row { display: flex; align-items: center; justify-content: flex-end; gap: 0.6rem; }
	.why-link { font-size: 0.75rem; color: var(--muted); text-decoration: none; transition: color 0.12s; }
	.why-link:hover { color: var(--text); }

	/* Method selection */
	.method-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; }
	.method-card {
		position: relative;
		display: flex; flex-direction: column; align-items: flex-start; gap: 0.35rem;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 1rem;
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.method-card:hover { border-color: var(--accent); box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 20%, transparent); }
	.method-card.recommended { border-color: color-mix(in srgb, var(--accent) 30%, transparent); }
	.recommended-badge {
		position: absolute; top: -9px; left: 12px;
		background: var(--accent); color: #fff;
		font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
		padding: 0.15rem 0.5rem; border-radius: 3px;
	}
	.method-icon { color: var(--muted); margin-bottom: 0.15rem; }
	.method-name { font-size: 0.85rem; font-weight: 600; color: var(--text); }
	.method-hint { font-size: 0.72rem; color: var(--muted); line-height: 1.4; }

	/* Pending state */
	.pending-spinner {
		width: 36px; height: 36px;
		border: 3px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }
	.pending-text { font-size: 0.88rem; color: var(--muted); }
	.pending-bar {
		width: 180px; height: 3px;
		background: var(--border); border-radius: 2px; overflow: hidden;
	}
	.pending-fill {
		height: 100%; width: 40%;
		background: var(--accent);
		border-radius: 2px;
		animation: slide 1.2s ease-in-out infinite;
	}
	@keyframes slide {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(350%); }
	}

	/* Repo selection */
	.select-all-row {
		display: flex; align-items: center; justify-content: space-between;
	}
	.select-all-btn {
		font-size: 0.75rem; color: var(--accent); background: none; border: none;
		cursor: pointer; font-family: inherit; padding: 0;
	}
	.select-all-btn:hover { text-decoration: underline; }
	.selected-count { font-size: 0.72rem; color: var(--muted); }

	.repo-list {
		display: flex; flex-direction: column; gap: 0;
		max-height: 240px; overflow-y: auto;
		border: 1px solid var(--border); border-radius: 8px;
		overflow: hidden;
	}
	.repo-row {
		display: flex; align-items: center; gap: 0.65rem;
		padding: 0.65rem 0.85rem;
		cursor: pointer;
		border-bottom: 1px solid var(--border);
		transition: background 0.1s;
	}
	.repo-row:last-child { border-bottom: none; }
	.repo-row:hover { background: var(--surface-2); }
	.repo-row.checked { background: color-mix(in srgb, var(--accent) 5%, transparent); }
	.repo-row input[type='checkbox'] { accent-color: var(--accent); flex-shrink: 0; }
	.repo-avatar {
		width: 22px; height: 22px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--accent) 20%, transparent);
		color: var(--accent);
		font-size: 0.65rem; font-weight: 700;
		display: flex; align-items: center; justify-content: center;
		flex-shrink: 0;
	}
	.repo-name { flex: 1; font-size: 0.82rem; color: var(--text); font-family: 'SF Mono', 'Fira Code', monospace; }
	.private-chip {
		display: inline-flex; align-items: center; gap: 0.2rem;
		font-size: 0.62rem; font-weight: 600;
		padding: 0.1rem 0.35rem; border-radius: 3px;
		background: color-mix(in srgb, var(--muted) 10%, transparent);
		color: var(--muted);
		flex-shrink: 0;
	}

	/* PAT entry */
	.field-label { font-size: 0.75rem; font-weight: 600; color: var(--text); }
	.field-input {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.6rem 0.85rem;
		font-size: 0.85rem;
		color: var(--text);
		font-family: 'SF Mono', 'Fira Code', monospace;
		outline: none;
		width: 100%;
		box-sizing: border-box;
		transition: border-color 0.15s;
	}
	.field-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent); }
	.field-input.field-error { border-color: var(--red); }
	.input-error {
		display: flex; align-items: center; gap: 0.35rem;
		font-size: 0.75rem; color: var(--red);
	}
	.gen-link {
		font-size: 0.75rem; color: var(--accent); text-decoration: none;
		transition: opacity 0.12s;
	}
	.gen-link:hover { opacity: 0.8; text-decoration: underline; }

	/* Success */
	.success-icon { animation: popIn 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
	@keyframes popIn { from { opacity: 0; transform: scale(0.6); } }
	.success-title { font-size: 1rem; font-weight: 700; color: var(--text); }
	.success-account { display: flex; align-items: center; gap: 0.5rem; }
	.success-avatar { width: 26px; height: 26px; border-radius: 50%; border: 2px solid var(--border); }
	.success-login { font-size: 0.82rem; color: var(--muted); }
	.success-repos { font-size: 0.78rem; color: var(--muted); }
	.success-hint { font-size: 0.72rem; color: var(--muted); opacity: 0.6; }

	/* Buttons */
	.btn-primary {
		display: inline-flex; align-items: center; gap: 0.4rem;
		padding: 0.5rem 1rem; border-radius: 7px;
		background: var(--accent); color: #fff;
		font-size: 0.83rem; font-weight: 600;
		border: none; cursor: pointer; font-family: inherit;
		transition: opacity 0.12s;
	}
	.btn-primary:hover:not(:disabled) { opacity: 0.9; }
	.btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
	.btn-ghost {
		padding: 0.5rem 0.9rem; border-radius: 7px;
		border: 1px solid var(--border); background: none;
		font-size: 0.82rem; color: var(--muted);
		cursor: pointer; font-family: inherit;
	}
	.btn-ghost:hover { color: var(--text); }
</style>
