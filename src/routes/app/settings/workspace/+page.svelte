<script lang="ts">
	import { ArrowLeft, Building2, Plus, Check, AlertCircle, Users, X } from 'lucide-svelte';

	interface Workspace {
		id: string;
		name: string;
		slug: string;
		role: string;
		member_count?: number;
		created_at: string;
	}

	let workspaces = $state<Workspace[]>([]);
	let currentId = $state<string | null>(null);
	let loading = $state(true);
	let loadError = $state('');

	// Create workspace modal
	let showCreate = $state(false);
	let newName = $state('');
	let newSlug = $state('');
	let slugManual = $state(false);
	let createError = $state('');
	let creating = $state(false);
	let createSuccess = $state(false);

	$effect(() => { fetchWorkspaces(); });

	// Auto-generate slug from name
	$effect(() => {
		if (!slugManual && newName) {
			newSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
		}
	});

	async function fetchWorkspaces() {
		loading = true;
		loadError = '';
		try {
			const res = await fetch('/api/workspace');
			if (!res.ok) throw new Error(`${res.status}`);
			const data = await res.json();
			workspaces = data.workspaces ?? [];
			currentId = data.current ?? null;
		} catch {
			loadError = 'Failed to load workspaces.';
		} finally {
			loading = false;
		}
	}

	async function createWorkspace() {
		createError = '';
		if (!newName.trim()) { createError = 'Workspace name is required.'; return; }
		if (!newSlug || !/^[a-z0-9-]+$/.test(newSlug)) {
			createError = 'Slug must be lowercase letters, numbers, and hyphens only.'; return;
		}
		creating = true;
		try {
			const res = await fetch('/api/workspace', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newName.trim(), slug: newSlug.trim() }),
			});
			if (res.status === 409) { createError = 'This slug is already taken.'; creating = false; return; }
			if (!res.ok) { createError = 'Failed to create workspace.'; creating = false; return; }
			const data = await res.json();
			workspaces = [...workspaces, { ...data.workspace, created_at: new Date().toISOString() }];
			createSuccess = true;
			setTimeout(() => {
				createSuccess = false;
				showCreate = false;
				newName = '';
				newSlug = '';
				slugManual = false;
			}, 1400);
		} catch {
			createError = 'Failed to create workspace.';
		} finally {
			creating = false;
		}
	}

	function switchWorkspace(id: string) {
		currentId = id;
		// In production: set cookie/localStorage and reload
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('runowl-workspace', id);
		}
	}

	function closeCreate() {
		showCreate = false;
		newName = '';
		newSlug = '';
		slugManual = false;
		createError = '';
		createSuccess = false;
	}

	function onBackdrop(e: MouseEvent) {
		if ((e.target as HTMLElement).classList.contains('modal-backdrop')) closeCreate();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeCreate();
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
	<title>Workspaces — RunOwl</title>
</svelte:head>

<div class="workspace-page">
	<a href="/app/settings" class="back-link">
		<ArrowLeft size={13} /> Settings
	</a>

	<div class="page-head">
		<div>
			<h1 class="page-title">Workspaces</h1>
			<p class="page-sub">Manage organizations and switch between workspaces.</p>
		</div>
		<button class="cta-btn" onclick={() => (showCreate = true)}>
			<Plus size={14} strokeWidth={2.5} />
			New workspace
		</button>
	</div>

	{#if loadError}
		<div class="error-banner">
			<AlertCircle size={15} />
			{loadError}
			<button class="retry-btn" onclick={fetchWorkspaces}>Retry</button>
		</div>
	{/if}

	{#if loading}
		<div class="ws-list">
			{#each [1,2] as _, i (i)}
				<div class="skeleton-ws"></div>
			{/each}
		</div>
	{:else if workspaces.length === 0}
		<div class="empty-state">
			<Building2 size={40} strokeWidth={1.25} opacity={0.25} />
			<p>No workspaces yet.</p>
			<p class="empty-hint">Create a workspace to organise your team and reviews.</p>
			<button class="cta-btn" onclick={() => (showCreate = true)}>
				<Plus size={14} />
				Create workspace
			</button>
		</div>
	{:else}
		<div class="ws-list">
			{#each workspaces as ws (ws.id)}
				<div class="ws-card" class:ws-current={ws.id === currentId}>
					<div class="ws-icon">
						<Building2 size={18} color="var(--accent)" />
					</div>
					<div class="ws-info">
						<div class="ws-name-row">
							<span class="ws-name">{ws.name}</span>
							<span class="ws-slug">/{ws.slug}</span>
							{#if ws.id === currentId}
								<span class="current-badge">Current</span>
							{/if}
						</div>
						<div class="ws-meta">
							<span class="ws-role role-{ws.role}">{ws.role}</span>
							{#if ws.member_count}
								<span class="ws-members"><Users size={11} />{ws.member_count} members</span>
							{/if}
							<span class="ws-date">Created {formatDate(ws.created_at)}</span>
						</div>
					</div>
					{#if ws.id !== currentId}
						<button class="switch-btn" onclick={() => switchWorkspace(ws.id)}>
							Switch
						</button>
					{:else}
						<span class="active-check"><Check size={15} color="var(--green)" /></span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if showCreate}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={onBackdrop} role="dialog" aria-modal="true" aria-label="Create workspace" tabindex="-1">
		<div class="modal">
			<div class="modal-head">
				<div class="modal-title-row">
					<span class="modal-icon"><Building2 size={15} color="var(--accent)" /></span>
					<h2 class="modal-title">New workspace</h2>
				</div>
				<button class="close-btn" onclick={closeCreate} aria-label="Close"><X size={15} /></button>
			</div>
			<div class="modal-body">
				{#if createSuccess}
					<div class="success-state">
						<Check size={24} color="var(--green)" />
						<span>Workspace created!</span>
					</div>
				{:else}
					<label class="field-label" for="ws-name">Workspace name</label>
					<input
						id="ws-name"
						class="field-input"
						class:field-error={!!createError && !newName}
						type="text"
						placeholder="e.g. Acme Corp"
						bind:value={newName}
						oninput={() => (createError = '')}
					/>

					<label class="field-label" for="ws-slug">
						Slug
						<span class="slug-hint">— used in URLs, e.g. runowl.dev/acme</span>
					</label>
					<input
						id="ws-slug"
						class="field-input"
						class:field-error={!!createError && !newSlug}
						type="text"
						placeholder="acme-corp"
						bind:value={newSlug}
						oninput={() => { slugManual = true; createError = ''; }}
					/>

					{#if createError}
						<p class="error-msg">{createError}</p>
					{/if}
				{/if}
			</div>
			{#if !createSuccess}
				<div class="modal-foot">
					<button class="btn-ghost" onclick={closeCreate}>Cancel</button>
					<button class="btn-primary" onclick={createWorkspace} disabled={creating}>
						{#if creating}<span class="spinner"></span>Creating…{:else}Create workspace{/if}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.workspace-page { padding: 2rem 2.5rem 3rem; max-width: 760px; width: 100%; display: flex; flex-direction: column; gap: 1.25rem; }
	.back-link { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.78rem; color: var(--muted); text-decoration: none; transition: color 0.12s; width: fit-content; }
	.back-link:hover { color: var(--text); }
	.page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
	.page-title { font-size: 1.45rem; font-weight: 700; letter-spacing: -0.03em; color: var(--text); margin-bottom: 0.2rem; }
	.page-sub { font-size: 0.82rem; color: var(--muted); }
	.cta-btn { display: inline-flex; align-items: center; gap: 0.35rem; background: var(--accent); color: #fff; border: none; padding: 0.5rem 1.1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; font-family: inherit; flex-shrink: 0; box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 28%, transparent); transition: opacity 0.15s, transform 0.15s; }
	.cta-btn:hover { opacity: 0.9; transform: translateY(-1px); }
	.error-banner { display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 1rem; border-radius: 8px; background: color-mix(in srgb, var(--red) 8%, transparent); border: 1px solid color-mix(in srgb, var(--red) 20%, transparent); color: var(--red); font-size: 0.82rem; }
	.retry-btn { margin-left: auto; background: none; border: 1px solid currentColor; border-radius: 5px; padding: 0.2rem 0.6rem; font-size: 0.75rem; color: inherit; cursor: pointer; font-family: inherit; }
	.ws-list { display: flex; flex-direction: column; gap: 0.75rem; }
	.skeleton-ws { height: 72px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; animation: shimmer 1.4s ease-in-out infinite; }
	@keyframes shimmer { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
	.empty-state { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 4rem 2rem; color: var(--muted); text-align: center; font-size: 0.88rem; }
	.empty-hint { font-size: 0.78rem; max-width: 280px; }
	.ws-card { display: flex; align-items: center; gap: 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1rem 1.25rem; transition: border-color 0.15s; }
	.ws-card.ws-current { border-color: color-mix(in srgb, var(--accent) 35%, transparent); }
	.ws-icon { width: 38px; height: 38px; border-radius: 9px; background: color-mix(in srgb, var(--accent) 10%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
	.ws-info { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; }
	.ws-name-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
	.ws-name { font-size: 0.88rem; font-weight: 600; color: var(--text); }
	.ws-slug { font-size: 0.75rem; color: var(--muted); font-family: 'SF Mono', monospace; }
	.current-badge { font-size: 0.65rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 3px; background: color-mix(in srgb, var(--green) 12%, transparent); color: var(--green); border: 1px solid color-mix(in srgb, var(--green) 22%, transparent); text-transform: uppercase; letter-spacing: 0.05em; }
	.ws-meta { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
	.ws-role { font-size: 0.68rem; font-weight: 700; padding: 0.1rem 0.35rem; border-radius: 3px; text-transform: uppercase; letter-spacing: 0.04em; }
	.role-owner { background: color-mix(in srgb, var(--red) 10%, transparent); color: var(--red); }
	.role-admin { background: color-mix(in srgb, var(--red) 10%, transparent); color: var(--red); }
	.role-reviewer { background: color-mix(in srgb, var(--accent) 10%, transparent); color: var(--accent); }
	.role-viewer { background: color-mix(in srgb, var(--muted) 10%, transparent); color: var(--muted); }
	.ws-members { display: flex; align-items: center; gap: 0.25rem; font-size: 0.72rem; color: var(--muted); }
	.ws-date { font-size: 0.72rem; color: var(--muted); }
	.switch-btn { background: var(--surface-2); border: 1px solid var(--border); border-radius: 7px; padding: 0.35rem 0.8rem; font-size: 0.78rem; font-weight: 600; color: var(--text); cursor: pointer; font-family: inherit; transition: border-color 0.12s, background 0.12s; flex-shrink: 0; }
	.switch-btn:hover { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 6%, transparent); color: var(--accent); }
	.active-check { display: flex; align-items: center; flex-shrink: 0; }
	.modal-backdrop { position: fixed; inset: 0; z-index: 300; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.15s ease; }
	@keyframes fadeIn { from { opacity: 0; } }
	.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; width: 100%; max-width: 420px; box-shadow: 0 24px 64px rgba(0,0,0,0.5); animation: slideUp 0.18s cubic-bezier(0.16,1,0.3,1); overflow: hidden; }
	@keyframes slideUp { from { opacity: 0; transform: translateY(12px) scale(0.98); } }
	.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 1.1rem 1.25rem 0; }
	.modal-title-row { display: flex; align-items: center; gap: 0.6rem; }
	.modal-icon { width: 30px; height: 30px; border-radius: 8px; background: color-mix(in srgb, var(--accent) 12%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent); display: flex; align-items: center; justify-content: center; }
	.modal-title { font-size: 0.95rem; font-weight: 700; color: var(--text); letter-spacing: -0.02em; }
	.close-btn { width: 28px; height: 28px; border-radius: 7px; background: none; border: 1px solid var(--border); color: var(--muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: color 0.12s, background 0.12s; }
	.close-btn:hover { color: var(--text); background: var(--surface-2); }
	.modal-body { padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.55rem; }
	.field-label { font-size: 0.75rem; font-weight: 600; color: var(--text); }
	.slug-hint { font-weight: 400; color: var(--muted); font-size: 0.72rem; }
	.field-input { background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; padding: 0.6rem 0.85rem; font-size: 0.85rem; color: var(--text); font-family: inherit; outline: none; width: 100%; box-sizing: border-box; transition: border-color 0.15s; }
	.field-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent); }
	.field-input.field-error { border-color: var(--red); }
	.field-input::placeholder { color: var(--muted); opacity: 0.6; }
	.error-msg { font-size: 0.75rem; color: var(--red); }
	.success-state { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; padding: 2rem 1rem; font-size: 0.9rem; font-weight: 600; color: var(--green); }
	.modal-foot { display: flex; align-items: center; justify-content: flex-end; gap: 0.6rem; padding: 0.9rem 1.25rem; border-top: 1px solid var(--border); background: var(--surface-2); }
	.btn-ghost { padding: 0.45rem 0.9rem; border-radius: 7px; border: 1px solid var(--border); background: none; font-size: 0.82rem; color: var(--muted); cursor: pointer; font-family: inherit; }
	.btn-ghost:hover { color: var(--text); }
	.btn-primary { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 1rem; border-radius: 7px; background: var(--accent); color: #fff; font-size: 0.82rem; font-weight: 600; border: none; cursor: pointer; font-family: inherit; }
	.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
	.btn-primary:not(:disabled):hover { opacity: 0.9; }
	.spinner { width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }
	@media (max-width: 640px) { .workspace-page { padding: 1.25rem 1rem 2rem; } }
</style>
