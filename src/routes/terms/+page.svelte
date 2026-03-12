<script lang="ts">
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
	<title>Terms of Service — RunOwl</title>
	<meta
		name="description"
		content="RunOwl's Terms of Service — rules for using the platform, acceptable use, and your rights."
	/>
</svelte:head>

<Nav />

<main class="legal-page">
	<div class="legal-wrap">
		<div class="legal-header">
			<span class="label">Legal</span>
			<h1>Terms of Service</h1>
			<p class="subtitle">
				These terms govern your use of RunOwl. By using RunOwl you agree to them. Please read them
				carefully.
			</p>
			<p class="updated">Last updated: March 2026 · Effective: March 2026</p>
		</div>

		<div class="legal-body">
			<section>
				<h2>1. Acceptance</h2>
				<p>
					By accessing or using RunOwl (the "Service") — including the CLI, API, GitHub App, and
					website — you agree to be bound by these Terms of Service ("Terms") and our <a
						href="/privacy">Privacy Policy</a
					>. If you are using RunOwl on behalf of an organisation, you represent that you have
					authority to bind that organisation to these Terms.
				</p>
				<p>
					The Service is operated by <strong>The AI Project Co.</strong> ("RunOwl", "we", "us").
				</p>
			</section>

			<section>
				<h2>2. The Service</h2>
				<p>
					RunOwl provides AI-powered code review, test generation, and related developer tools. The
					open-source core is licensed under the MIT License and available at
					<a href="https://github.com/the-ai-project-co/runowl" target="_blank" rel="noopener"
						>github.com/the-ai-project-co/runowl</a
					>. These Terms apply to both the open-source software and any paid cloud services we
					operate.
				</p>
			</section>

			<section>
				<h2>3. Accounts</h2>
				<ul>
					<li>You must be at least 16 years old to create an account</li>
					<li>You are responsible for keeping your account credentials secure</li>
					<li>
						You must notify us immediately of any unauthorised access at <a
							href="mailto:security@runowl.ai">security@runowl.ai</a
						>
					</li>
					<li>One person or legal entity may not maintain more than one free account</li>
				</ul>
			</section>

			<section>
				<h2>4. Acceptable Use</h2>
				<p>You agree not to use RunOwl to:</p>
				<ul>
					<li>Violate any applicable law or regulation</li>
					<li>Infringe the intellectual property rights of others</li>
					<li>Transmit malware, viruses, or other malicious code</li>
					<li>
						Attempt to reverse-engineer, decompile, or extract proprietary algorithms from the
						Service
					</li>
					<li>Circumvent usage limits or access controls</li>
					<li>Use the Service to build a competing product without our written consent</li>
					<li>Scrape or bulk-extract data from the Service via automated means</li>
					<li>Harass, abuse, or harm any person</li>
				</ul>
				<p>
					We reserve the right to suspend or terminate accounts that violate this section without
					notice.
				</p>
			</section>

			<section>
				<h2>5. Your Code and Data</h2>
				<p>
					You retain all rights to the code and data you submit to RunOwl. By using the Service you
					grant RunOwl a limited, non-exclusive licence to process your code solely for the purpose
					of providing the review and testing features you have requested. We do not claim ownership
					of your code, and we do not use your code to train AI models. See our <a href="/privacy"
						>Privacy Policy</a
					> for details on how data is handled.
				</p>
			</section>

			<section>
				<h2>6. Subscriptions and Billing</h2>
				<ul>
					<li>Paid plans are billed monthly or annually in advance</li>
					<li>All prices are in USD unless stated otherwise</li>
					<li>
						You may cancel your subscription at any time; access continues until the end of the
						current billing period
					</li>
					<li>We do not offer refunds except where required by applicable law</li>
					<li>
						We may change pricing with 30 days' notice; continued use after that date constitutes
						acceptance
					</li>
				</ul>
			</section>

			<section>
				<h2>7. Free Tier Limits</h2>
				<p>
					The free tier is provided as-is with no SLA. We may impose rate limits, usage caps, or
					feature restrictions on free accounts at our discretion. We may discontinue the free tier
					with 30 days' notice.
				</p>
			</section>

			<section>
				<h2>8. Open-Source Components</h2>
				<p>
					The RunOwl core engine is open-source under the MIT License. Nothing in these Terms
					restricts your rights under that licence for the open-source components. Paid extensions (<code
						>runowl-paid</code
					>) are proprietary and are licensed separately under the terms in that package's LICENSE
					file.
				</p>
			</section>

			<section>
				<h2>9. Intellectual Property</h2>
				<p>
					The RunOwl name, logo, and cloud service are the exclusive property of The AI Project Co.
					You may not use our trademarks without prior written permission, except as necessary to
					accurately describe your use of RunOwl (e.g. "Powered by RunOwl").
				</p>
			</section>

			<section>
				<h2>10. Disclaimers</h2>
				<p>
					The Service is provided <strong>"as is"</strong> and <strong>"as available"</strong> without
					warranties of any kind, express or implied, including but not limited to warranties of merchantability,
					fitness for a particular purpose, or non-infringement.
				</p>
				<p>
					RunOwl is an AI-assisted tool. Review findings are suggestions — they are not a substitute
					for human code review. We make no guarantee that RunOwl will find all bugs, security
					vulnerabilities, or other issues in your code.
				</p>
			</section>

			<section>
				<h2>11. Limitation of Liability</h2>
				<p>
					To the maximum extent permitted by law, RunOwl's total liability for any claim arising
					from these Terms or your use of the Service is limited to the amount you paid us in the 12
					months preceding the claim (or $100 if you paid nothing).
				</p>
				<p>
					We are not liable for indirect, incidental, special, consequential, or punitive damages,
					including loss of profits, data, or goodwill.
				</p>
			</section>

			<section>
				<h2>12. Indemnification</h2>
				<p>
					You agree to indemnify and hold harmless The AI Project Co. and its officers, employees,
					and agents from any claims, damages, or expenses (including legal fees) arising from your
					violation of these Terms or your use of the Service.
				</p>
			</section>

			<section>
				<h2>13. Termination</h2>
				<p>
					Either party may terminate the agreement at any time. We may suspend or terminate your
					access immediately if you violate these Terms. Upon termination, your licence to use the
					Service ends and we will delete your data in accordance with our <a href="/privacy"
						>Privacy Policy</a
					>.
				</p>
			</section>

			<section>
				<h2>14. Governing Law</h2>
				<p>
					These Terms are governed by and construed in accordance with the laws of England and
					Wales, without regard to conflict-of-law principles. Any disputes shall be subject to the
					exclusive jurisdiction of the courts of England and Wales.
				</p>
			</section>

			<section>
				<h2>15. Changes to These Terms</h2>
				<p>
					We may update these Terms from time to time. We will notify you of material changes by
					email or via an in-app notice at least 14 days before they take effect. Continued use of
					the Service after that date constitutes your acceptance of the updated Terms.
				</p>
			</section>

			<section>
				<h2>Contact</h2>
				<p>
					Questions about these Terms? Email us at <a href="mailto:hello@runowl.ai"
						>hello@runowl.ai</a
					>.
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
