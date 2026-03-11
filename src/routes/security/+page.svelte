<script lang="ts">
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
	<title>Security — RunOwl</title>
	<meta name="description" content="RunOwl's security practices, vulnerability disclosure policy, and data handling." />
</svelte:head>

<Nav />

<main class="legal-page">
	<div class="legal-wrap">

		<div class="legal-header">
			<span class="label">Security</span>
			<h1>Security at RunOwl</h1>
			<p class="subtitle">
				We take the security of RunOwl and the code we analyse seriously.
				This page describes our practices and how to report vulnerabilities.
			</p>
			<p class="updated">Last updated: March 2026</p>
		</div>

		<div class="legal-body">

			<section>
				<h2>Reporting a Vulnerability</h2>
				<p>
					If you discover a security vulnerability in RunOwl, please <strong>do not open a public GitHub issue</strong>.
					Instead, email us directly:
				</p>
				<p class="contact-box">
					<a href="mailto:security@runowl.ai">security@runowl.ai</a>
				</p>
				<p>
					Include as much detail as possible — steps to reproduce, potential impact, and any proof-of-concept code.
					We aim to acknowledge every report within <strong>48 hours</strong> and will keep you informed as we investigate and resolve the issue.
					Researchers who responsibly disclose vulnerabilities will be credited in our changelog.
				</p>
			</section>

			<section>
				<h2>Scope</h2>
				<p>The following are in scope for security reports:</p>
				<ul>
					<li>The RunOwl API server (<code>runowl.ai</code> and self-hosted deployments)</li>
					<li>The <code>npx runowl</code> CLI package</li>
					<li>The GitHub App and webhook integration</li>
					<li>Authentication and authorisation logic</li>
					<li>The Deno sandbox and code execution layer</li>
				</ul>
				<p>Out of scope: third-party services we integrate with (GitHub, Gemini, Anthropic), social engineering, and physical attacks.</p>
			</section>

			<section>
				<h2>Sandbox Architecture</h2>
				<p>
					RunOwl executes AI-generated agent code inside a <strong>Deno 2.x sandbox</strong> with strict permission flags.
					The sandbox:
				</p>
				<ul>
					<li>Blocks all network access inside agent scripts</li>
					<li>Blocks all file writes and subprocess spawning</li>
					<li>Enforces a strict tool whitelist (<code>FETCH_FILE</code>, <code>LIST_DIR</code>, <code>SEARCH_CODE</code>)</li>
					<li>Enforces wall-clock timeouts (60 s) and output size limits (256 KB)</li>
					<li>Runs with no <code>--allow-run</code>, <code>--allow-write</code>, or <code>--allow-net</code> flags</li>
				</ul>
				<p>
					All agent tool calls are dispatched back to the Python host process, which enforces path sanitisation
					and rate limits before executing them against the GitHub API.
				</p>
			</section>

			<section>
				<h2>Data Handling</h2>
				<p>
					When RunOwl reviews a PR, it sends the PR diff and relevant file contents to the configured AI provider
					(Google Gemini or Anthropic Claude). <strong>We do not store your source code.</strong>
					Execution traces are saved locally to <code>~/.runowl/traces/</code> on self-hosted deployments
					and are never transmitted to RunOwl servers.
				</p>
				<p>
					For the cloud offering, we store only the structured review results (findings, severity, citations) —
					never the raw source code or diff. Data is encrypted at rest (AES-256) and in transit (TLS 1.3).
				</p>
			</section>

			<section>
				<h2>GitHub Token Security</h2>
				<p>
					RunOwl requests only the minimum GitHub permissions needed:
				</p>
				<ul>
					<li><code>pull_requests: read &amp; write</code> — to post review comments</li>
					<li><code>checks: read &amp; write</code> — to create Check Runs</li>
					<li><code>contents: read</code> — to fetch file contents and diffs</li>
				</ul>
				<p>
					GitHub tokens are stored in your environment (<code>.env</code>) and are never logged or transmitted
					to RunOwl servers. We recommend using fine-grained tokens scoped to specific repositories.
				</p>
			</section>

			<section>
				<h2>Dependencies</h2>
				<p>
					We regularly audit our dependencies using automated tools. Security findings in dependencies
					should be reported to the relevant upstream project; please also notify us so we can
					update our lockfiles promptly.
				</p>
			</section>

			<section>
				<h2>Contact</h2>
				<p>
					For security disclosures: <a href="mailto:security@runowl.ai">security@runowl.ai</a><br/>
					For general inquiries: <a href="mailto:hello@runowl.ai">hello@runowl.ai</a>
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

	.contact-box {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 1rem 1.25rem;
		text-align: center;
		font-size: 1rem !important;
	}

	.contact-box a {
		color: var(--accent);
		font-weight: 600;
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
