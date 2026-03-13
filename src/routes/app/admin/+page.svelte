<svelte:head>
	<title>Admin Console — RunOwl</title>
</svelte:head>

<div class="coming-soon">
	<div class="icon">
		<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" opacity="0.6">
			<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
		</svg>
	</div>
	<h1>Admin Console</h1>
	<p>User management, org settings, SCIM provisioning — coming soon.</p>
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
