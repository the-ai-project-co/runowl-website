<script lang="ts">
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
	<title>Privacy Policy — RunOwl</title>
	<meta name="description" content="RunOwl's privacy policy — what data we collect, how we use it, and your rights." />
</svelte:head>

<Nav />

<main class="legal-page">
	<div class="legal-wrap">

		<div class="legal-header">
			<span class="label">Privacy</span>
			<h1>Privacy Policy</h1>
			<p class="subtitle">
				We believe privacy is a right, not a feature. This policy explains what data RunOwl collects,
				why, and how you can control it.
			</p>
			<p class="updated">Last updated: March 2026 · Effective: March 2026</p>
		</div>

		<div class="legal-body">

			<section>
				<h2>1. Who We Are</h2>
				<p>
					RunOwl is operated by <strong>The AI Project Co.</strong> ("we", "us", "our").
					If you have questions about this policy, contact us at
					<a href="mailto:hello@runowl.ai">hello@runowl.ai</a>.
				</p>
			</section>

			<section>
				<h2>2. What We Collect</h2>

				<h3>When you use the free CLI or self-hosted server</h3>
				<p>
					RunOwl runs entirely on your machine. We collect <strong>nothing</strong>. Execution traces are
					stored locally at <code>~/.runowl/traces/</code> and never leave your environment.
					The only outbound network calls go to GitHub's API and your configured AI provider (Google Gemini or Anthropic).
				</p>

				<h3>When you use RunOwl Cloud</h3>
				<p>We collect the following information:</p>
				<ul>
					<li><strong>Account data:</strong> email address, name, and GitHub OAuth identity used to sign in</li>
					<li><strong>Usage data:</strong> number of reviews run, PR references (owner/repo/number), timestamps</li>
					<li><strong>Review results:</strong> structured findings (severity, type, description, citation) — never raw source code</li>
					<li><strong>Billing data:</strong> payment method details are handled by Stripe; we store only a subscription status and invoice history</li>
					<li><strong>Log data:</strong> server logs including IP address, browser user-agent, and request timestamps, retained for 30 days</li>
				</ul>

				<h3>Source code</h3>
				<p>
					<strong>We do not store your source code or PR diffs.</strong> Diffs are fetched from GitHub at review time,
					sent to the AI provider for analysis, and discarded immediately after the review completes.
					Only the structured results (findings) are retained.
				</p>
			</section>

			<section>
				<h2>3. How We Use Your Data</h2>
				<ul>
					<li>To provide, operate, and improve the RunOwl service</li>
					<li>To send transactional emails (review complete, billing receipts)</li>
					<li>To enforce our Terms of Service and prevent abuse</li>
					<li>To generate anonymised, aggregated usage statistics (e.g. most common finding types)</li>
				</ul>
				<p>We do not sell your data. We do not use your data to train AI models.</p>
			</section>

			<section>
				<h2>4. Data Sharing</h2>
				<p>We share data only with:</p>
				<ul>
					<li><strong>AI providers</strong> (Google Gemini, Anthropic Claude) — PR diffs sent for analysis; subject to their privacy policies</li>
					<li><strong>GitHub</strong> — to post review comments and create Check Runs on your behalf</li>
					<li><strong>Stripe</strong> — to process payments; they receive billing data only</li>
					<li><strong>Infrastructure providers</strong> (cloud hosting, CDN) — under data processing agreements</li>
				</ul>
				<p>We will disclose data to law enforcement only when required by law and, where legally permitted, will notify you first.</p>
			</section>

			<section>
				<h2>5. Data Retention</h2>
				<ul>
					<li>Review results: retained for the duration of your subscription, then deleted within 30 days of account closure</li>
					<li>Account data: deleted within 30 days of account closure</li>
					<li>Server logs: deleted after 30 days</li>
					<li>Billing records: retained for 7 years as required by tax law</li>
				</ul>
			</section>

			<section>
				<h2>6. Your Rights</h2>
				<p>Depending on your location, you may have the right to:</p>
				<ul>
					<li>Access the personal data we hold about you</li>
					<li>Correct inaccurate data</li>
					<li>Request deletion of your data ("right to be forgotten")</li>
					<li>Object to or restrict certain processing</li>
					<li>Data portability — receive your data in a machine-readable format</li>
				</ul>
				<p>
					To exercise any of these rights, email <a href="mailto:hello@runowl.ai">hello@runowl.ai</a>.
					We will respond within 30 days.
				</p>
			</section>

			<section>
				<h2>7. Cookies</h2>
				<p>
					The RunOwl website uses only essential cookies required for authentication and session management.
					We do not use advertising or tracking cookies.
				</p>
			</section>

			<section>
				<h2>8. Security</h2>
				<p>
					We use industry-standard security practices including TLS 1.3 in transit, AES-256 at rest,
					and regular security audits. See our <a href="/security">Security page</a> for details.
				</p>
			</section>

			<section>
				<h2>9. Children</h2>
				<p>
					RunOwl is not directed at children under 16. We do not knowingly collect data from anyone under 16.
					If you believe we have collected data from a child, please contact us immediately.
				</p>
			</section>

			<section>
				<h2>10. Changes to This Policy</h2>
				<p>
					We may update this policy from time to time. When we do, we will update the "Last updated" date above
					and, for material changes, notify you by email or via an in-app notice at least 14 days in advance.
				</p>
			</section>

			<section>
				<h2>Contact</h2>
				<p>
					<strong>The AI Project Co.</strong><br/>
					<a href="mailto:hello@runowl.ai">hello@runowl.ai</a>
				</p>
			</section>

		</div>
	</div>
</main>

<Footer />

<style>
	.legal-page {
		min-height: 100vh;
		padding: 6rem 0 5rem;
	}

	.legal-wrap {
		width: 100%;
		max-width: 48rem;
		margin-left: auto;
		margin-right: auto;
		padding-left: 1.5rem;
		padding-right: 1.5rem;
	}

	.legal-header {
		margin-bottom: 3rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid var(--border);
	}

	.label {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: 0.75rem;
	}

	h1 {
		font-size: clamp(1.8rem, 4vw, 2.5rem);
		font-weight: 800;
		letter-spacing: -0.03em;
		color: var(--text);
		margin-bottom: 1rem;
	}

	.subtitle {
		font-size: 1.05rem;
		color: var(--muted);
		line-height: 1.7;
		margin-bottom: 0.75rem;
	}

	.updated {
		font-size: 0.8rem;
		color: var(--muted);
	}

	.legal-body {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}

	section h2 {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text);
		margin-bottom: 0.75rem;
	}

	section h3 {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text);
		margin-top: 1rem;
		margin-bottom: 0.5rem;
	}

	section p {
		font-size: 0.95rem;
		color: var(--muted);
		line-height: 1.75;
		margin-bottom: 0.75rem;
	}

	section p:last-child {
		margin-bottom: 0;
	}

	section ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 0.75rem;
		padding-left: 0;
	}

	section ul li {
		font-size: 0.95rem;
		color: var(--muted);
		padding-left: 1.25rem;
		position: relative;
		line-height: 1.7;
	}

	section ul li::before {
		content: '–';
		position: absolute;
		left: 0;
		color: var(--accent);
	}

	code {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 0.85em;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 0.1em 0.4em;
		color: var(--accent-2);
	}

	a {
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	a:hover {
		opacity: 0.8;
	}
</style>
