<script lang="ts">
	import { notifStore } from '$lib/stores/notifications.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		notifStore.addDemo();
	});

	function relTime(iso: string) {
		const diff = Date.now() - new Date(iso).getTime();
		const mins = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		if (hours < 24) return `${hours}h ago`;
		return `${days}d ago`;
	}

	function iconForType(type: string) {
		switch (type) {
			case 'review_complete':
				return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
			case 'finding_high':
				return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
			case 'team_invite':
				return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`;
			default:
				return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		const t = e.target as HTMLElement;
		if (!t.closest('.notif-panel') && !t.closest('.bell-btn')) {
			notifStore.closePanel();
		}
	}
</script>

<svelte:window onclick={handleBackdropClick} />

<div class="bell-wrap">
	<button
		class="bell-btn"
		onclick={(e) => { e.stopPropagation(); notifStore.toggleOpen(); }}
		aria-label="Notifications"
		aria-expanded={notifStore.open}
	>
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
			<path d="M13.73 21a2 2 0 0 1-3.46 0"/>
		</svg>
		{#if notifStore.unread > 0}
			<span class="badge">{notifStore.unread > 9 ? '9+' : notifStore.unread}</span>
		{/if}
	</button>

	{#if notifStore.open}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="notif-panel" onclick={(e) => e.stopPropagation()}>
			<div class="panel-head">
				<span class="panel-title">Notifications</span>
				{#if notifStore.unread > 0}
					<button class="mark-all" onclick={() => notifStore.markAllRead()}>
						Mark all read
					</button>
				{/if}
			</div>

			{#if notifStore.items.length === 0}
				<div class="panel-empty">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
						<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
						<path d="M13.73 21a2 2 0 0 1-3.46 0"/>
					</svg>
					<span>No notifications yet</span>
				</div>
			{:else}
				<div class="notif-list">
					{#each notifStore.items as n (n.id)}
						{#if n.href}
							<a
								href={n.href}
								class="notif-row"
								class:unread={!n.read}
								onclick={() => { notifStore.markRead(n.id); notifStore.closePanel(); }}
							>
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								<span class="notif-icon">{@html iconForType(n.type)}</span>
								<div class="notif-body">
									<span class="notif-title">{n.title}</span>
									<span class="notif-msg">{n.body}</span>
									<span class="notif-time">{relTime(n.created_at)}</span>
								</div>
								{#if !n.read}
									<span class="unread-dot"></span>
								{/if}
							</a>
						{:else}
							<div
								class="notif-row"
								class:unread={!n.read}
								role="button"
								tabindex="0"
								onclick={() => notifStore.markRead(n.id)}
								onkeydown={(e) => e.key === 'Enter' && notifStore.markRead(n.id)}
							>
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								<span class="notif-icon">{@html iconForType(n.type)}</span>
								<div class="notif-body">
									<span class="notif-title">{n.title}</span>
									<span class="notif-msg">{n.body}</span>
									<span class="notif-time">{relTime(n.created_at)}</span>
								</div>
								{#if !n.read}
									<span class="unread-dot"></span>
								{/if}
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.bell-wrap {
		position: relative;
	}

	.bell-btn {
		position: relative;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--muted);
		display: flex;
		align-items: center;
		padding: 0.2rem;
		border-radius: 6px;
		transition: color 0.12s, background 0.12s;
	}
	.bell-btn:hover {
		color: var(--text);
		background: var(--surface-2);
	}

	.badge {
		position: absolute;
		top: -3px;
		right: -3px;
		min-width: 16px;
		height: 16px;
		background: var(--red);
		color: #fff;
		font-size: 0.6rem;
		font-weight: 700;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 3px;
		line-height: 1;
	}

	.notif-panel {
		position: absolute;
		top: calc(100% + 10px);
		right: 0;
		width: 320px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
		z-index: 300;
		overflow: hidden;
		animation: popIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes popIn {
		from { opacity: 0; transform: translateY(-6px) scale(0.97); }
	}

	.panel-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.85rem 1rem 0.6rem;
		border-bottom: 1px solid var(--border);
	}
	.panel-title {
		font-size: 0.83rem;
		font-weight: 700;
		color: var(--text);
	}
	.mark-all {
		background: none;
		border: none;
		font-size: 0.72rem;
		color: var(--accent);
		cursor: pointer;
		font-family: inherit;
		padding: 0;
	}
	.mark-all:hover { text-decoration: underline; }

	.panel-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 2.5rem 1rem;
		color: var(--muted);
		font-size: 0.8rem;
	}

	.notif-list {
		max-height: 340px;
		overflow-y: auto;
	}

	.notif-row {
		display: flex;
		align-items: flex-start;
		gap: 0.65rem;
		padding: 0.7rem 1rem;
		text-decoration: none;
		cursor: default;
		transition: background 0.12s;
		position: relative;
		border-bottom: 1px solid var(--border);
	}
	.notif-row:last-child { border-bottom: none; }
	.notif-row:hover { background: var(--surface-2); }
	a.notif-row { cursor: pointer; }
	[role="button"].notif-row { cursor: pointer; }

	.notif-icon {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		background: var(--surface-2);
		border-radius: 50%;
		margin-top: 1px;
	}

	.notif-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.notif-title {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text);
	}
	.notif-msg {
		font-size: 0.75rem;
		color: var(--muted);
		line-height: 1.4;
	}
	.notif-time {
		font-size: 0.68rem;
		color: var(--muted);
		margin-top: 0.2rem;
	}

	.unread-dot {
		width: 7px;
		height: 7px;
		background: var(--accent);
		border-radius: 50%;
		flex-shrink: 0;
		margin-top: 4px;
	}
</style>
