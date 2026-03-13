<script lang="ts">
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import PRModal from '$lib/components/app/PRModal.svelte';
	import NotificationBell from '$lib/components/app/NotificationBell.svelte';
	import UpgradeModal from '$lib/components/app/UpgradeModal.svelte';
	import PrivateRepoModal from '$lib/components/app/PrivateRepoModal.svelte';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	let theme = $state<'dark' | 'light'>('dark');

	// Collapsible section state — persisted to localStorage
	// Read synchronously so toggles are never overwritten by a deferred effect
	function loadSectionState(): Record<string, boolean> {
		const defaults = { workspace: true, configure: true, admin: true };
		if (typeof localStorage === 'undefined') return defaults;
		try {
			const saved = localStorage.getItem('runowl-sidebar-sections');
			return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
		} catch {
			return defaults;
		}
	}
	let sectionOpen = $state<Record<string, boolean>>(loadSectionState());

	$effect(() => {
		const saved = localStorage.getItem('runowl-theme');
		if (saved === 'light' || saved === 'dark') theme = saved;
	});

	$effect(() => {
		document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
		localStorage.setItem('runowl-theme', theme);
	});

	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
	}

	function toggleSection(key: string) {
		sectionOpen = { ...sectionOpen, [key]: !sectionOpen[key] };
		localStorage.setItem('runowl-sidebar-sections', JSON.stringify(sectionOpen));
	}

	// Role-based visibility — default all sections visible until RBAC is wired server-side
	const isAdmin = true;
	const canConfigure = true;

	const workspaceItems = [
		{
			label: 'Dashboard',
			href: '/app',
			exact: true,
			icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
		},
		{
			label: 'PR Library',
			href: '/app/library',
			exact: false,
			icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>`,
		},
		{
			label: 'Test Suites',
			href: '/app/suites',
			exact: false,
			icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg>`,
		},
		{
			label: 'Analytics',
			href: '/app/analytics',
			exact: false,
			icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
		},
	];

	const configureItems = [
		{
			label: 'Team',
			href: '/app/team',
			exact: false,
			icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
		},
		{
			label: 'Integrations',
			href: '/app/integrations',
			exact: false,
			icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 2v4"/><path d="M17 2v4"/><path d="M5 6h14a1 1 0 0 1 1 1v4a7 7 0 0 1-14 0V7a1 1 0 0 1 1-1z"/><path d="M12 17v5"/><path d="M9 22h6"/></svg>`,
		},
		{
			label: 'Settings',
			href: '/app/settings',
			exact: false,
			icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
		},
	];

	const adminItems = [
		{
			label: 'Audit Logs',
			href: '/app/admin/audit',
			exact: false,
			icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
		},
		{
			label: 'Compliance',
			href: '/app/admin/compliance',
			exact: false,
			icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
		},
		{
			label: 'Admin Console',
			href: '/app/admin',
			exact: true,
			icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
		},
	];

	function isActive(href: string, currentPath: string, exact: boolean) {
		if (exact) return currentPath === href;
		return currentPath.startsWith(href);
	}

	const chevronDown = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`;
	const chevronRight = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>`;
</script>

<!-- Global modals — available on every /app/* page -->
<PRModal />
<UpgradeModal />
<PrivateRepoModal />

<div class="app-shell">
	<!-- Top header -->
	<header class="app-header">
		<a href="/app" class="app-logo">
			<svg width="22" height="22" viewBox="0 0 28 28" fill="none">
				<circle cx="14" cy="14" r="14" fill="var(--accent)" opacity="0.15" />
				<path
					d="M9 10 Q14 6 19 10 Q21 14 19 18 Q14 22 9 18 Q7 14 9 10Z"
					fill="var(--accent)"
					opacity="0.6"
				/>
				<circle cx="11.5" cy="13" r="2" fill="var(--accent)" />
				<circle cx="16.5" cy="13" r="2" fill="var(--accent)" />
			</svg>
			<span>RunOwl</span>
		</a>

		<div class="app-header-right">
			<span class="user-email">{data.user?.email ?? ''}</span>
			<NotificationBell />
			<button
				class="theme-btn"
				onclick={toggleTheme}
				title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
				aria-label="Toggle theme"
			>
				{#if theme === 'dark'}
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
					</svg>
				{:else}
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
					</svg>
				{/if}
			</button>
			<form method="POST" action="/api/auth">
				<button type="submit" class="signout-btn">Sign out</button>
			</form>
		</div>
	</header>

	<!-- Body: sidebar + main -->
	<div class="app-body">
		<nav class="sidebar" aria-label="App navigation">
			<!-- Workspace section -->
			<button class="section-header" onclick={() => toggleSection('workspace')}>
				<span class="section-label">Workspace</span>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html sectionOpen.workspace ? chevronDown : chevronRight}
			</button>
			{#if sectionOpen.workspace}
				<div class="section-items">
					{#each workspaceItems as item (item.href)}
						<a
							href={item.href}
							class="nav-item"
							class:active={isActive(item.href, $page.url.pathname, item.exact)}
							aria-current={isActive(item.href, $page.url.pathname, item.exact) ? 'page' : undefined}
						>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html item.icon}
							<span>{item.label}</span>
						</a>
					{/each}
				</div>
			{/if}

			<!-- Configure section (reviewer + admin) -->
			{#if canConfigure}
				<button class="section-header" onclick={() => toggleSection('configure')}>
					<span class="section-label">Configure</span>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html sectionOpen.configure ? chevronDown : chevronRight}
				</button>
				{#if sectionOpen.configure}
					<div class="section-items">
						{#each configureItems as item (item.href)}
							<a
								href={item.href}
								class="nav-item"
								class:active={isActive(item.href, $page.url.pathname, item.exact)}
								aria-current={isActive(item.href, $page.url.pathname, item.exact) ? 'page' : undefined}
							>
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html item.icon}
								<span>{item.label}</span>
							</a>
						{/each}
					</div>
				{/if}
			{/if}

			<!-- Admin section (admin only) -->
			{#if isAdmin}
				<button class="section-header" onclick={() => toggleSection('admin')}>
					<span class="section-label">Admin</span>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html sectionOpen.admin ? chevronDown : chevronRight}
				</button>
				{#if sectionOpen.admin}
					<div class="section-items">
						{#each adminItems as item (item.href)}
							<a
								href={item.href}
								class="nav-item"
								class:active={isActive(item.href, $page.url.pathname, item.exact)}
								aria-current={isActive(item.href, $page.url.pathname, item.exact) ? 'page' : undefined}
							>
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html item.icon}
								<span>{item.label}</span>
							</a>
						{/each}
					</div>
				{/if}
			{/if}
		</nav>

		<main class="app-main">
			{@render children()}
		</main>
	</div>
</div>

<style>
	.app-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg);
	}

	/* Header */
	.app-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 1.5rem;
		height: 52px;
		border-bottom: 1px solid var(--border);
		background: var(--surface);
		position: sticky;
		top: 0;
		z-index: 50;
		flex-shrink: 0;
	}

	.app-logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text);
		letter-spacing: -0.02em;
	}

	.app-header-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-email {
		font-size: 0.8rem;
		color: var(--muted);
	}

	.signout-btn {
		background: none;
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.3rem 0.75rem;
		font-size: 0.8rem;
		color: var(--muted);
		cursor: pointer;
		font-family: inherit;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.signout-btn:hover {
		color: var(--text);
		border-color: var(--text);
	}

	.theme-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--muted);
		display: flex;
		align-items: center;
		padding: 0;
		transition: color 0.15s;
	}
	.theme-btn:hover {
		color: var(--text);
	}

	/* Body layout */
	.app-body {
		flex: 1;
		display: flex;
		overflow: hidden;
		min-height: 0;
	}

	/* Sidebar */
	.sidebar {
		width: 210px;
		flex-shrink: 0;
		border-right: 1px solid var(--border);
		background: var(--surface);
		padding: 0.5rem 0.5rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0;
		overflow-y: auto;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.6rem 0.5rem 0.3rem;
		margin-top: 0.5rem;
		color: var(--muted);
		font-family: inherit;
		transition: color 0.12s;
	}
	.section-header:first-child {
		margin-top: 0.25rem;
	}
	.section-header:hover {
		color: var(--text);
	}

	.section-label {
		font-size: 0.67rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.07em;
	}

	.section-items {
		display: flex;
		flex-direction: column;
		gap: 1px;
		padding-bottom: 0.25rem;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.5rem 0.75rem;
		border-radius: 7px;
		text-decoration: none;
		font-size: 0.845rem;
		color: var(--muted);
		transition:
			background 0.12s,
			color 0.12s;
	}
	.nav-item:hover {
		background: var(--surface-2);
		color: var(--text);
	}
	.nav-item.active {
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		color: var(--accent);
	}

	/* Main area */
	.app-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: auto;
		min-width: 0;
	}

	/* Mobile: collapse sidebar */
	@media (max-width: 640px) {
		.sidebar {
			display: none;
		}
	}
</style>
