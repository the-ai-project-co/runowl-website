<script lang="ts">
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
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

	.app-main {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
</style>
