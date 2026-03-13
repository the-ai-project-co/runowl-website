<script lang="ts">
	import { githubIntegration } from '$lib/stores/github-integration.svelte';
	import { privateRepoModal } from '$lib/stores/private-repo-modal.svelte';
	import PrivateRepoModal from '$lib/components/app/PrivateRepoModal.svelte';
	import {
		CheckCircle2,
		AlertTriangle,
		Lock,
		Trash2,
		Plus,
		ExternalLink,
	} from 'lucide-svelte';

	let removeConfirm = $state<string | null>(null);

	function confirmRemove(id: string) { removeConfirm = id; }
	function cancelRemove() { removeConfirm = null; }
	function doRemove(id: string) {
		githubIntegration.removeRepo(id);
		removeConfirm = null;
	}

	function formatAdded(iso: string) {
		if (!iso) return '';
		const diff = Date.now() - new Date(iso).getTime();
		const days = Math.floor(diff / 86400000);
		if (days === 0) return 'today';
		if (days === 1) return 'yesterday';
		return `${days} days ago`;
	}

	const futureIntegrations = [
		{ name: 'GitLab', hint: 'Review GitLab merge requests', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"/></svg>` },
		{ name: 'Bitbucket', hint: 'Review Bitbucket pull requests', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M2 2l2.09 14.12L12 22l7.91-5.88L22 2H2z"/></svg>` },
		{ name: 'Slack', hint: 'Get review notifications in Slack', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/><path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/><path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/><path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/></svg>` },
	];
</script>

<svelte:head>
	<title>Integrations — RunOwl</title>
</svelte:head>

<PrivateRepoModal />

<div class="integrations-page">
	<!-- Header -->
	<div class="page-head">
		<div>
			<h1 class="page-title">Integrations</h1>
			<p class="page-sub">Connect GitHub to review private repositories.</p>
		</div>
		{#if !githubIntegration.connected}
			<button class="cta-btn" onclick={() => privateRepoModal.show('', undefined)}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
				Connect GitHub
			</button>
		{/if}
	</div>

	<!-- GitHub integration card -->
	<div class="integration-card" class:connected={githubIntegration.connected}>
		{#if !githubIntegration.connected}
			<div class="card-icon">
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" color="var(--muted)"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
			</div>
			<div class="card-info">
				<span class="card-name">GitHub</span>
				<span class="card-hint">Connect your account to access private repositories.</span>
			</div>
			<span class="status-chip chip-muted">Not connected</span>
			<button class="btn-connect" onclick={() => privateRepoModal.show('', undefined)}>
				Connect
			</button>
		{:else}
			<img
				src={githubIntegration.account?.avatarUrl}
				alt={githubIntegration.account?.login}
				class="gh-avatar"
			/>
			<div class="card-info">
				<div class="account-row">
					<span class="card-name">{githubIntegration.account?.name ?? githubIntegration.account?.login}</span>
					<span class="login-muted">@{githubIntegration.account?.login}</span>
				</div>
				<div class="status-row">
					<span class="status-chip chip-green">
						<CheckCircle2 size={11} />
						Connected
					</span>
					<span class="method-chip">
						via {githubIntegration.method === 'github_app' ? 'GitHub App' : 'PAT'}
					</span>
				</div>
			</div>
			<button class="btn-disconnect" onclick={() => githubIntegration.disconnect()}>
				Disconnect
			</button>
		{/if}
	</div>

	<!-- Org installation nudge -->
	{#if githubIntegration.connected && githubIntegration.orgInstallationStatus !== 'full'}
		<div class="info-banner">
			<AlertTriangle size={14} color="var(--yellow)" />
			<span>
				Install the RunOwl GitHub App on your <strong>organization</strong> to enable access for all org repos automatically.
			</span>
			<a
				href="https://github.com/apps/runowl/installations/new"
				target="_blank"
				rel="noopener"
				class="banner-link"
			>
				Install for org <ExternalLink size={11} />
			</a>
		</div>
	{/if}

	<!-- Connected repositories -->
	{#if githubIntegration.connected}
		<div class="section-card">
			<div class="section-head">
				<span class="section-label">Connected Repositories</span>
				<button class="add-repos-btn" onclick={() => privateRepoModal.show('', undefined)}>
					<Plus size={12} /> Add repos
				</button>
			</div>

			{#if githubIntegration.repos.length === 0}
				<div class="empty-repos">
					<Lock size={28} strokeWidth={1.25} opacity={0.3} />
					<p>No repositories connected yet.</p>
					<button class="btn-add-first" onclick={() => privateRepoModal.show('', undefined)}>
						<Plus size={12} /> Add repositories
					</button>
				</div>
			{:else}
				<div class="repo-list">
					{#each githubIntegration.repos as repo (repo.id)}
						<div class="repo-row">
							<div class="repo-icon">
								<Lock size={12} color="var(--muted)" />
							</div>
							<span class="repo-name">{repo.fullName}</span>
							<span class="private-chip">private</span>
							{#if repo.addedAt}
								<span class="repo-added">Added {formatAdded(repo.addedAt)}</span>
							{/if}

							{#if removeConfirm === repo.id}
								<div class="confirm-inline">
									<span class="confirm-text">Remove?</span>
									<button class="confirm-yes" onclick={() => doRemove(repo.id)}>Yes</button>
									<button class="confirm-no" onclick={cancelRemove}>Cancel</button>
								</div>
							{:else}
								<button
									class="remove-btn"
									onclick={() => confirmRemove(repo.id)}
									aria-label="Remove {repo.fullName}"
								>
									<Trash2 size={13} />
								</button>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Future integrations -->
	<div class="section-card">
		<span class="section-label">Coming soon</span>
		<div class="future-grid">
			{#each futureIntegrations as fi}
				<div class="future-card">
					<span class="future-icon">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html fi.icon}
					</span>
					<div class="future-info">
						<span class="future-name">{fi.name}</span>
						<span class="future-hint">{fi.hint}</span>
					</div>
					<span class="soon-chip">Soon</span>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.integrations-page {
		padding: 2rem 2.5rem 3rem;
		max-width: 760px;
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
	.page-title { font-size: 1.45rem; font-weight: 700; letter-spacing: -0.03em; color: var(--text); margin-bottom: 0.2rem; }
	.page-sub { font-size: 0.82rem; color: var(--muted); }

	.cta-btn {
		display: inline-flex; align-items: center; gap: 0.4rem;
		background: var(--accent); color: #fff;
		border: none; padding: 0.5rem 1.1rem;
		border-radius: 8px; font-size: 0.85rem; font-weight: 600;
		cursor: pointer; font-family: inherit; flex-shrink: 0;
		box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 28%, transparent);
		transition: opacity 0.15s, transform 0.15s;
	}
	.cta-btn:hover { opacity: 0.9; transform: translateY(-1px); }

	/* Integration card */
	.integration-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.1rem 1.25rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: border-color 0.15s;
	}
	.integration-card.connected { border-color: color-mix(in srgb, var(--green) 25%, transparent); }

	.card-icon {
		width: 40px; height: 40px;
		border-radius: 10px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		display: flex; align-items: center; justify-content: center;
		flex-shrink: 0;
	}
	.gh-avatar {
		width: 40px; height: 40px;
		border-radius: 50%;
		border: 2px solid var(--border);
		flex-shrink: 0;
	}
	.card-info { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; }
	.card-name { font-size: 0.9rem; font-weight: 600; color: var(--text); }
	.card-hint { font-size: 0.76rem; color: var(--muted); }
	.account-row { display: flex; align-items: center; gap: 0.5rem; }
	.login-muted { font-size: 0.78rem; color: var(--muted); }
	.status-row { display: flex; align-items: center; gap: 0.5rem; }

	.status-chip {
		display: inline-flex; align-items: center; gap: 0.25rem;
		font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
		padding: 0.15rem 0.45rem; border-radius: 4px;
	}
	.chip-muted { background: var(--surface-2); color: var(--muted); border: 1px solid var(--border); }
	.chip-green { background: color-mix(in srgb, var(--green) 12%, transparent); color: var(--green); }
	.method-chip {
		font-size: 0.68rem; color: var(--muted);
		background: var(--surface-2); border: 1px solid var(--border);
		padding: 0.12rem 0.4rem; border-radius: 4px;
	}

	.btn-connect {
		padding: 0.45rem 1rem;
		background: var(--accent); color: #fff;
		border: none; border-radius: 7px;
		font-size: 0.82rem; font-weight: 600;
		cursor: pointer; font-family: inherit; flex-shrink: 0;
		transition: opacity 0.12s;
	}
	.btn-connect:hover { opacity: 0.9; }
	.btn-disconnect {
		padding: 0.45rem 1rem;
		background: none;
		border: 1px solid var(--border);
		border-radius: 7px;
		font-size: 0.82rem; color: var(--muted);
		cursor: pointer; font-family: inherit; flex-shrink: 0;
		transition: border-color 0.12s, color 0.12s;
	}
	.btn-disconnect:hover { border-color: var(--red); color: var(--red); }

	/* Org nudge banner */
	.info-banner {
		display: flex; align-items: center; gap: 0.65rem;
		background: color-mix(in srgb, var(--yellow) 8%, transparent);
		border: 1px solid color-mix(in srgb, var(--yellow) 25%, transparent);
		border-left: 3px solid var(--yellow);
		border-radius: 8px;
		padding: 0.75rem 1rem;
		font-size: 0.82rem; color: var(--text); flex-wrap: wrap;
	}
	.info-banner span { flex: 1; }
	.banner-link {
		display: inline-flex; align-items: center; gap: 0.25rem;
		font-size: 0.78rem; font-weight: 600;
		color: var(--accent); text-decoration: none; flex-shrink: 0;
		transition: opacity 0.12s;
	}
	.banner-link:hover { opacity: 0.8; text-decoration: underline; }

	/* Section card */
	.section-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.1rem 1.25rem;
		display: flex; flex-direction: column; gap: 0.85rem;
	}
	.section-head {
		display: flex; align-items: center; justify-content: space-between;
	}
	.section-label {
		font-size: 0.72rem; font-weight: 700;
		text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted);
	}
	.add-repos-btn {
		display: inline-flex; align-items: center; gap: 0.3rem;
		font-size: 0.78rem; color: var(--accent);
		background: none; border: none; cursor: pointer; font-family: inherit;
		padding: 0; transition: opacity 0.12s;
	}
	.add-repos-btn:hover { opacity: 0.8; text-decoration: underline; }

	/* Empty state */
	.empty-repos {
		display: flex; flex-direction: column; align-items: center; gap: 0.6rem;
		padding: 2.5rem 1rem;
		color: var(--muted); font-size: 0.85rem; text-align: center;
	}
	.btn-add-first {
		display: inline-flex; align-items: center; gap: 0.3rem;
		margin-top: 0.25rem;
		padding: 0.45rem 0.9rem;
		background: var(--surface-2); border: 1px solid var(--border);
		border-radius: 7px; font-size: 0.8rem; color: var(--text);
		cursor: pointer; font-family: inherit;
		transition: border-color 0.12s;
	}
	.btn-add-first:hover { border-color: var(--accent); color: var(--accent); }

	/* Repo list */
	.repo-list { display: flex; flex-direction: column; }
	.repo-row {
		display: flex; align-items: center; gap: 0.65rem;
		padding: 0.65rem 0;
		border-bottom: 1px solid var(--border);
	}
	.repo-row:last-child { border-bottom: none; }
	.repo-icon { flex-shrink: 0; display: flex; }
	.repo-name { flex: 1; font-size: 0.83rem; color: var(--text); font-family: 'SF Mono', 'Fira Code', monospace; }
	.private-chip {
		font-size: 0.62rem; font-weight: 600;
		padding: 0.1rem 0.35rem; border-radius: 3px;
		background: var(--surface-2); color: var(--muted);
		border: 1px solid var(--border); flex-shrink: 0;
	}
	.repo-added { font-size: 0.72rem; color: var(--muted); flex-shrink: 0; }

	.remove-btn {
		background: none; border: none; cursor: pointer;
		color: var(--muted); display: flex; align-items: center;
		padding: 0.2rem; border-radius: 4px;
		transition: color 0.12s; flex-shrink: 0;
	}
	.remove-btn:hover { color: var(--red); }

	.confirm-inline {
		display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0;
	}
	.confirm-text { font-size: 0.75rem; color: var(--muted); }
	.confirm-yes {
		font-size: 0.72rem; font-weight: 600; color: var(--red);
		background: none; border: 1px solid var(--red);
		border-radius: 4px; padding: 0.15rem 0.45rem;
		cursor: pointer; font-family: inherit;
		transition: background 0.12s;
	}
	.confirm-yes:hover { background: color-mix(in srgb, var(--red) 10%, transparent); }
	.confirm-no {
		font-size: 0.72rem; color: var(--muted);
		background: none; border: none; cursor: pointer; font-family: inherit;
		padding: 0;
	}
	.confirm-no:hover { color: var(--text); }

	/* Future integrations */
	.future-grid { display: flex; flex-direction: column; gap: 0; }
	.future-card {
		display: flex; align-items: center; gap: 0.85rem;
		padding: 0.8rem 0;
		border-bottom: 1px solid var(--border);
		opacity: 0.5;
	}
	.future-card:last-child { border-bottom: none; }
	.future-icon {
		width: 36px; height: 36px;
		border-radius: 9px;
		background: var(--surface-2); border: 1px solid var(--border);
		display: flex; align-items: center; justify-content: center;
		color: var(--muted); flex-shrink: 0;
	}
	.future-info { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; }
	.future-name { font-size: 0.85rem; font-weight: 600; color: var(--text); }
	.future-hint { font-size: 0.75rem; color: var(--muted); }
	.soon-chip {
		font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
		padding: 0.15rem 0.45rem; border-radius: 4px;
		background: var(--surface-2); color: var(--muted); border: 1px solid var(--border);
	}

	@media (max-width: 640px) {
		.integrations-page { padding: 1.25rem 1rem 2rem; }
		.integration-card { flex-wrap: wrap; }
	}
</style>
