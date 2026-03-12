<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<title>RunOwl</title>
</svelte:head>

<div class="auth-shell">
	<a href="/" class="auth-logo">
		<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
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

	<div class="auth-card">
		{@render children()}
	</div>

	<p class="auth-footer">
		By continuing, you agree to our
		<a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
	</p>
</div>

<style>
	.auth-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem 1.5rem;
		background: var(--bg);
		background-image: radial-gradient(
			ellipse 60% 40% at 50% 0%,
			rgba(124, 106, 247, 0.08) 0%,
			transparent 70%
		);
	}

	.auth-logo {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		text-decoration: none;
		margin-bottom: 2rem;
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text);
		letter-spacing: -0.02em;
	}

	.auth-card {
		width: 100%;
		max-width: 400px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 2rem;
	}

	.auth-footer {
		margin-top: 1.5rem;
		font-size: 0.75rem;
		color: var(--muted);
		text-align: center;
	}

	.auth-footer a {
		color: var(--muted);
		text-decoration: underline;
		text-decoration-color: var(--border);
	}
	.auth-footer a:hover {
		color: var(--text);
	}
</style>
