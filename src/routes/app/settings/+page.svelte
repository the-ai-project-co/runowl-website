<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';

	const sections = [
		{
			label: 'Billing & Plans',
			hint: 'Manage your subscription, payment method, and invoices.',
			href: '/app/settings/billing',
			icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
			ready: true,
		},
		{
			label: 'Workspaces',
			hint: 'Create and switch between workspaces for your organisation.',
			href: '/app/settings/workspace',
			icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
			ready: true,
		},
		{
			label: 'Profile',
			hint: 'Update your name, avatar, and email preferences.',
			href: '/app/profile',
			icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
			ready: true,
		},
		{
			label: 'Notifications',
			hint: 'Control how and when RunOwl alerts you.',
			href: '/app/settings/notifications',
			icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
			ready: true,
		},
		{
			label: 'Custom Rules',
			hint: 'Define your own review rules and severity thresholds.',
			href: '/app/settings/rules',
			icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
			ready: true,
		},
		{
			label: 'SSO / SAML',
			hint: 'Configure single sign-on for your organisation.',
			href: '/app/settings/sso',
			icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
			ready: true,
		},
	];
</script>

<svelte:head>
	<title>Settings — RunOwl</title>
</svelte:head>

<div class="settings-page">
	<div class="page-head">
		<h1 class="page-title">Settings</h1>
		<p class="page-sub">Manage your account, billing, and preferences.</p>
	</div>

	<div class="settings-list">
		{#each sections as s}
			{#if s.ready && s.href}
				<a href={s.href} class="settings-row">
					<span class="row-icon">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html s.icon}
					</span>
					<div class="row-info">
						<span class="row-label">{s.label}</span>
						<span class="row-hint">{s.hint}</span>
					</div>
					<ArrowRight size={16} color="var(--muted)" />
				</a>
			{:else}
				<div class="settings-row row-disabled">
					<span class="row-icon">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html s.icon}
					</span>
					<div class="row-info">
						<span class="row-label">{s.label}</span>
						<span class="row-hint">{s.hint}</span>
					</div>
					<span class="coming-chip">Soon</span>
				</div>
			{/if}
		{/each}
	</div>
</div>

<style>
	.settings-page {
		padding: 2rem 2.5rem 3rem;
		max-width: 680px;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.page-title {
		font-size: 1.45rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		color: var(--text);
		margin-bottom: 0.2rem;
	}
	.page-sub { font-size: 0.82rem; color: var(--muted); }

	.settings-list {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}

	.settings-row {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 1rem 1.1rem;
		border-bottom: 1px solid var(--border);
		text-decoration: none;
		transition: background 0.12s;
	}
	.settings-row:last-child { border-bottom: none; }
	a.settings-row:hover { background: var(--surface-2); }
	.row-disabled { opacity: 0.55; cursor: default; }

	.row-icon {
		width: 36px;
		height: 36px;
		border-radius: 9px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--muted);
		flex-shrink: 0;
	}
	a.settings-row:hover .row-icon { color: var(--text); }

	.row-info { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; }
	.row-label { font-size: 0.88rem; font-weight: 600; color: var(--text); }
	.row-hint { font-size: 0.76rem; color: var(--muted); }

	.coming-chip {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
		background: var(--surface-2);
		color: var(--muted);
		border: 1px solid var(--border);
	}

	@media (max-width: 640px) {
		.settings-page { padding: 1.25rem 1rem 2rem; }
	}
</style>
