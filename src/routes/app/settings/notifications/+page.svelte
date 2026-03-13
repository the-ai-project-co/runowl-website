<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';

	interface NotifSetting {
		id: string;
		label: string;
		hint: string;
		enabled: boolean;
	}

	let settings = $state<NotifSetting[]>([
		{ id: 'review_done', label: 'Review completed', hint: 'Notify when an AI review finishes.', enabled: true },
		{ id: 'finding_p0', label: 'Critical findings (P0)', hint: 'Alert immediately on P0 security issues.', enabled: true },
		{ id: 'test_fail', label: 'Test suite failures', hint: 'Notify when a test suite run fails.', enabled: true },
		{ id: 'weekly_digest', label: 'Weekly digest', hint: 'Summary of reviews and findings every Monday.', enabled: false },
		{ id: 'invite', label: 'Team invitations', hint: 'Alert when a new member joins your team.', enabled: true },
		{ id: 'billing', label: 'Billing alerts', hint: 'Notify on usage limits and payment issues.', enabled: true },
	]);

	let saved = $state(false);
	function save() {
		saved = true;
		setTimeout(() => (saved = false), 2000);
	}
</script>

<svelte:head>
	<title>Notifications — RunOwl</title>
</svelte:head>

<div class="page">
	<a href="/app/settings" class="back-link">
		<ArrowLeft size={13} /> Settings
	</a>
	<div class="page-head">
		<h1 class="page-title">Notifications</h1>
		<p class="page-sub">Control how and when RunOwl alerts you.</p>
	</div>

	<div class="card">
		{#each settings as s (s.id)}
			<div class="setting-row">
				<div class="setting-info">
					<span class="setting-label">{s.label}</span>
					<span class="setting-hint">{s.hint}</span>
				</div>
				<button
					class="toggle"
					class:on={s.enabled}
					role="switch"
					aria-checked={s.enabled}
					onclick={() => (s.enabled = !s.enabled)}
					aria-label={s.label}
				>
					<span class="thumb"></span>
				</button>
			</div>
		{/each}
	</div>

	<div class="actions">
		{#if saved}
			<span class="saved-msg">Saved!</span>
		{/if}
		<button class="btn-primary" onclick={save}>Save preferences</button>
	</div>
</div>

<style>
	.page {
		padding: 2rem 2.5rem 3rem;
		max-width: 620px;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.78rem;
		color: var(--muted);
		text-decoration: none;
		transition: color 0.12s;
		width: fit-content;
	}
	.back-link:hover { color: var(--text); }
	.page-title {
		font-size: 1.45rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		color: var(--text);
		margin-bottom: 0.2rem;
	}
	.page-sub { font-size: 0.82rem; color: var(--muted); }

	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}
	.setting-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.1rem;
		border-bottom: 1px solid var(--border);
	}
	.setting-row:last-child { border-bottom: none; }
	.setting-info { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; }
	.setting-label { font-size: 0.88rem; font-weight: 600; color: var(--text); }
	.setting-hint { font-size: 0.76rem; color: var(--muted); }

	.toggle {
		width: 38px;
		height: 22px;
		border-radius: 11px;
		background: var(--border);
		border: none;
		cursor: pointer;
		position: relative;
		transition: background 0.2s;
		flex-shrink: 0;
		padding: 0;
	}
	.toggle.on { background: var(--accent); }
	.thumb {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #fff;
		transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow: 0 1px 3px rgba(0,0,0,0.3);
	}
	.toggle.on .thumb { transform: translateX(16px); }

	.actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.saved-msg { font-size: 0.82rem; color: var(--green); }
	.btn-primary {
		padding: 0.55rem 1.25rem;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 8px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		transition: opacity 0.15s;
	}
	.btn-primary:hover { opacity: 0.9; }

	@media (max-width: 640px) {
		.page { padding: 1.25rem 1rem 2rem; }
	}
</style>
