<svelte:head>
	<title>Audit Logs — RunOwl</title>
</svelte:head>

<div class="coming-soon">
	<div class="icon">
		<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" opacity="0.6">
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
		</svg>
	</div>
	<h1>Audit Logs</h1>
	<p>Full event trail of all user actions, API calls, and permission changes — coming soon.</p>
</div>

<style>
	.coming-soon {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 4rem 2rem;
		color: var(--muted);
		text-align: center;
	}
	.icon { margin-bottom: 0.5rem; }
	h1 {
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--text);
		letter-spacing: -0.02em;
	}
	p { font-size: 0.85rem; max-width: 320px; }
</style>
