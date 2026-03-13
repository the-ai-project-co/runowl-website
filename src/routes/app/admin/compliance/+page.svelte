<svelte:head>
	<title>Compliance — RunOwl</title>
</svelte:head>

<div class="coming-soon">
	<div class="icon">
		<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" opacity="0.6">
			<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
		</svg>
	</div>
	<h1>Compliance</h1>
	<p>SOC 2, GDPR data residency, and policy enforcement dashboards — coming soon.</p>
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
