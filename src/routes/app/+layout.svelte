<script lang="ts">
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	let theme = $state<'dark' | 'light'>('dark');

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
</script>

<div class="app-shell">
	<header class="app-header">
		<a href="/" class="app-logo">
			<svg width="22" height="22" viewBox="0 0 28 28" fill="none">
				<circle cx="14" cy="14" r="14" fill="var(--accent)" opacity="0.15" />
				<path d="M9 10 Q14 6 19 10 Q21 14 19 18 Q14 22 9 18 Q7 14 9 10Z" fill="var(--accent)" opacity="0.6" />
				<circle cx="11.5" cy="13" r="2" fill="var(--accent)" />
				<circle cx="16.5" cy="13" r="2" fill="var(--accent)" />
			</svg>
			<span>RunOwl</span>
		</a>

		<div class="app-header-right">
			<span class="user-email">{data.user?.email ?? ''}</span>
			<button class="theme-btn" onclick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} aria-label="Toggle theme">
				{#if theme === 'dark'}
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
					</svg>
				{:else}
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
					</svg>
				{/if}
			</button>
			<a href="/app/profile" class="profile-link" title="Account settings">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
					<circle cx="12" cy="7" r="4"/>
				</svg>
			</a>
			<form method="POST" action="/api/auth">
				<button type="submit" class="signout-btn">Sign out</button>
			</form>
		</div>
	</header>

	<main class="app-main">
		{@render children()}
	</main>
</div>

<style>
	.app-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg);
	}

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
		transition: color 0.15s, border-color 0.15s;
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
	.theme-btn:hover { color: var(--text); }

	.profile-link {
		display: flex;
		align-items: center;
		color: var(--muted);
		transition: color 0.15s;
	}
	.profile-link:hover { color: var(--text); }

	.app-main {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
</style>
