export interface Notification {
	id: string;
	type: 'review_complete' | 'finding_high' | 'team_invite' | 'system';
	title: string;
	body: string;
	href?: string;
	read: boolean;
	created_at: string; // ISO
}

function createNotificationStore() {
	let items = $state<Notification[]>([]);
	let open = $state(false);

	// Seed with demo notifications for first-time users (cleared once real data loads)
	const DEMO: Notification[] = [
		{
			id: 'demo-1',
			type: 'review_complete',
			title: 'Review complete',
			body: 'sveltejs/svelte #1 — 3 findings caught.',
			href: '/app/library',
			read: false,
			created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
		},
		{
			id: 'demo-2',
			type: 'finding_high',
			title: 'High severity finding',
			body: 'SQL injection risk detected in acme/api #42.',
			href: '/app/library',
			read: false,
			created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
		},
		{
			id: 'demo-3',
			type: 'system',
			title: 'Welcome to RunOwl',
			body: 'Get started by loading a GitHub PR URL.',
			href: null as unknown as string,
			read: true,
			created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
		},
	];

	function init(notifications: Notification[]) {
		items = notifications.length > 0 ? notifications : DEMO;
	}

	function addDemo() {
		if (items.length === 0) items = DEMO;
	}

	function markRead(id: string) {
		items = items.map((n) => (n.id === id ? { ...n, read: true } : n));
	}

	function markAllRead() {
		items = items.map((n) => ({ ...n, read: true }));
	}

	function push(n: Omit<Notification, 'id' | 'read'>) {
		items = [{ ...n, id: crypto.randomUUID(), read: false }, ...items];
	}

	function toggleOpen() {
		open = !open;
		if (!open) return;
		// Auto-mark all as read after 2s
		setTimeout(() => markAllRead(), 2000);
	}

	function closePanel() {
		open = false;
	}

	return {
		get items() { return items; },
		get open() { return open; },
		get unread() { return items.filter((n) => !n.read).length; },
		init,
		addDemo,
		markRead,
		markAllRead,
		push,
		toggleOpen,
		closePanel,
	};
}

export const notifStore = createNotificationStore();
