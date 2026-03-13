<script lang="ts">
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { onMount } from 'svelte';

	const plans = [
		{
			name: 'Free',
			price: '$0',
			period: '/ forever',
			description: 'For individuals and open-source',
			cta: 'Get started free',
			ctaLink: '/signup',
			featured: false,
		},
		{
			name: 'Team',
			price: '$29',
			period: '/ seat / mo',
			description: 'For engineering teams',
			cta: 'Start free trial',
			ctaLink: '/signup',
			featured: true,
		},
		{
			name: 'Business',
			price: '$79',
			period: '/ seat / mo',
			description: 'For larger teams',
			cta: 'Contact sales',
			ctaLink: 'mailto:hello@runowl.ai',
			featured: false,
		},
		{
			name: 'Enterprise',
			price: 'Custom',
			period: '',
			description: 'For large organisations',
			cta: 'Contact us',
			ctaLink: 'mailto:hello@runowl.ai',
			featured: false,
		},
	];

	type CellValue = boolean | string;

	const comparison: { category: string; rows: { feature: string; values: CellValue[] }[] }[] = [
		{
			category: 'Core Review',
			rows: [
				{ feature: 'AI code review (P0–P3 severity)', values: [true, true, true, true] },
				{ feature: 'Interactive Q&A on findings', values: [true, true, true, true] },
				{ feature: 'Surface-level security checks', values: [true, true, true, true] },
				{ feature: 'GitHub webhook integration', values: [true, true, true, true] },
				{ feature: 'CLI (npx runowl)', values: [true, true, true, true] },
				{ feature: 'GitHub Check Runs', values: [false, true, true, true] },
			],
		},
		{
			category: 'Security & Architecture',
			rows: [
				{ feature: 'Full OWASP Top 10 analysis', values: [false, true, true, true] },
				{ feature: 'SOLID / architecture review', values: [false, true, true, true] },
				{ feature: 'Race condition detection', values: [false, true, true, true] },
				{ feature: 'Supply chain analysis', values: [false, true, true, true] },
				{ feature: 'Deep dependency auditing', values: [false, false, true, true] },
			],
		},
		{
			category: 'Testing',
			rows: [
				{ feature: 'AI test generation', values: [false, true, true, true] },
				{ feature: 'Unit & integration test runner', values: [false, true, true, true] },
				{ feature: 'E2E / Playwright testing', values: [false, false, true, true] },
				{ feature: 'Test result history', values: [false, false, true, true] },
			],
		},
		{
			category: 'Team & Access',
			rows: [
				{ feature: 'Unlimited repositories', values: [false, true, true, true] },
				{ feature: 'Team management & roles', values: [false, true, true, true] },
				{ feature: 'SSO / SAML', values: [false, false, true, true] },
				{ feature: 'SCIM provisioning', values: [false, false, false, true] },
				{ feature: 'Audit logs', values: [false, false, true, true] },
			],
		},
		{
			category: 'Deployment & Support',
			rows: [
				{ feature: 'Cloud-hosted (SaaS)', values: [true, true, true, true] },
				{ feature: 'Self-hosted deployment', values: [true, true, false, true] },
				{ feature: 'Email support', values: [false, true, true, true] },
				{ feature: 'Priority support', values: [false, false, true, true] },
				{ feature: 'Dedicated SLA', values: [false, false, false, true] },
				{ feature: 'Custom integrations', values: [false, false, false, true] },
			],
		},
	];

	let cards: HTMLElement[] = [];
	let visible: boolean[] = new Array(plans.length).fill(false);

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const idx = cards.indexOf(entry.target as HTMLElement);
						if (idx !== -1) {
							setTimeout(() => {
								visible[idx] = true;
								visible = [...visible];
							}, idx * 80);
						}
					}
				});
			},
			{ threshold: 0.1 }
		);
		cards.forEach((card) => card && observer.observe(card));
		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>Pricing — RunOwl</title>
	<meta
		name="description"
		content="Simple, transparent pricing for AI-powered code review. Free for individuals and open-source, with Team, Business, and Enterprise plans."
	/>
</svelte:head>

<Nav />

<main class="pricing-page">
	<div class="section-wrap">
		<!-- Header -->
		<div class="page-header">
			<span class="label">Pricing</span>
			<h1>Simple, transparent pricing</h1>
			<p class="subtitle">Free for individuals and open-source. No credit card required.</p>
		</div>

		<!-- Plan cards -->
		<div class="pricing-grid">
			{#each plans as plan, i}
				<div
					class="pricing-card"
					class:featured={plan.featured}
					class:visible={visible[i]}
					bind:this={cards[i]}
				>
					{#if plan.featured}
						<div class="featured-badge">Most popular</div>
					{/if}

					<div class="plan-header">
						<h3 class="plan-name">{plan.name}</h3>
						<p class="plan-desc">{plan.description}</p>
					</div>

					<div class="plan-price">
						<span class="price-amount">{plan.price}</span>
						{#if plan.period}
							<span class="price-period">{plan.period}</span>
						{/if}
					</div>

					<a href={plan.ctaLink} class="plan-cta" class:cta-featured={plan.featured}>
						{plan.cta}
					</a>
				</div>
			{/each}
		</div>

		<!-- Comparison table -->
		<div class="compare-wrap">
			<h2 class="compare-title">Full feature comparison</h2>

			<div class="compare-table-wrap">
				<table class="compare-table">
					<thead>
						<tr>
							<th class="feat-col">Feature</th>
							{#each plans as plan}
								<th class:th-featured={plan.featured}>{plan.name}</th>
							{/each}
						</tr>
					</thead>

					{#each comparison as group}
						<tbody>
							<tr class="category-row">
								<td colspan={plans.length + 1}>{group.category}</td>
							</tr>
							{#each group.rows as row}
								<tr>
									<td class="feat-name">{row.feature}</td>
									{#each row.values as val}
										<td class="feat-cell">
											{#if val === true}
												<span class="check" aria-label="Included">✓</span>
											{:else if val === false}
												<span class="dash" aria-label="Not included">—</span>
											{:else}
												<span class="custom-val">{val}</span>
											{/if}
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					{/each}
				</table>
			</div>
		</div>

		<!-- FAQ strip -->
		<div class="faq-strip">
			<p>
				Questions? Email us at <a href="mailto:hello@runowl.ai">hello@runowl.ai</a> — we reply within
				one business day.
			</p>
		</div>
	</div>
</main>

<Footer />

<style>
	.pricing-page {
		min-height: 100vh;
		padding: 7rem 0 5rem;
	}

	/* Header */
	.page-header {
		text-align: center;
		margin-bottom: 3.5rem;
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
		font-size: clamp(2rem, 4.5vw, 3rem);
		font-weight: 800;
		letter-spacing: -0.03em;
		color: var(--text);
		margin-bottom: 0.75rem;
	}

	.subtitle {
		font-size: 1.05rem;
		color: var(--muted);
	}

	/* Plan cards */
	.pricing-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.25rem;
		margin-bottom: 5rem;
		align-items: start;
	}

	.pricing-card {
		position: relative;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.75rem;
		opacity: 0;
		transform: translateY(20px);
		transition:
			opacity 0.5s ease,
			transform 0.5s ease,
			border-color 0.2s;
	}
	.pricing-card.visible {
		opacity: 1;
		transform: translateY(0);
	}
	.pricing-card.featured {
		border-color: var(--accent);
		box-shadow: 0 0 40px var(--accent-glow);
	}
	.pricing-card:not(.featured):hover {
		border-color: var(--muted);
	}

	.featured-badge {
		position: absolute;
		top: -12px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--accent);
		color: #fff;
		font-size: 0.7rem;
		font-weight: 700;
		padding: 0.2rem 0.75rem;
		border-radius: 99px;
		white-space: nowrap;
	}

	.plan-header {
		margin-bottom: 1rem;
	}
	.plan-name {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text);
		margin-bottom: 0.25rem;
	}
	.plan-desc {
		font-size: 0.8rem;
		color: var(--muted);
	}

	.plan-price {
		display: flex;
		align-items: baseline;
		gap: 0.35rem;
		margin-bottom: 1.25rem;
	}
	.price-amount {
		font-size: 2rem;
		font-weight: 800;
		color: var(--text);
	}
	.price-period {
		font-size: 0.8rem;
		color: var(--muted);
	}

	.plan-cta {
		display: block;
		text-align: center;
		padding: 0.6rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		background: var(--surface-2);
		color: var(--text);
		border: 1px solid var(--border);
		transition: all 0.2s;
	}
	.plan-cta:hover {
		border-color: var(--muted);
	}
	.plan-cta.cta-featured {
		background: var(--accent);
		color: #fff;
		border-color: var(--accent);
	}
	.plan-cta.cta-featured:hover {
		opacity: 0.9;
	}

	/* Comparison table */
	.compare-wrap {
		margin-bottom: 4rem;
	}

	.compare-title {
		font-size: 1.4rem;
		font-weight: 700;
		color: var(--text);
		margin-bottom: 1.5rem;
		letter-spacing: -0.02em;
	}

	.compare-table-wrap {
		overflow-x: auto;
		border: 1px solid var(--border);
		border-radius: 12px;
	}

	.compare-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.compare-table thead th {
		padding: 0.9rem 1.25rem;
		text-align: center;
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.07em;
		border-bottom: 1px solid var(--border);
		background: var(--surface);
		white-space: nowrap;
	}

	.compare-table thead th.feat-col {
		text-align: left;
		width: 35%;
	}

	.compare-table thead th.th-featured {
		color: var(--accent);
	}

	/* Category rows */
	.category-row td {
		padding: 0.6rem 1.25rem;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.09em;
		color: var(--accent);
		background: var(--surface);
		border-top: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
	}

	/* Feature rows */
	.compare-table tbody tr:not(.category-row) {
		border-bottom: 1px solid var(--border);
		transition: background 0.15s;
	}
	.compare-table tbody tr:not(.category-row):last-child {
		border-bottom: none;
	}
	.compare-table tbody tr:not(.category-row):hover {
		background: var(--surface);
	}

	.feat-name {
		padding: 0.75rem 1.25rem;
		color: var(--muted);
		text-align: left;
	}

	.feat-cell {
		padding: 0.75rem 1.25rem;
		text-align: center;
	}

	.check {
		color: var(--green);
		font-weight: 700;
		font-size: 0.95rem;
	}

	.dash {
		color: var(--border);
		font-size: 0.95rem;
	}

	.custom-val {
		color: var(--text);
		font-size: 0.8rem;
	}

	/* FAQ strip */
	.faq-strip {
		text-align: center;
		padding: 1.5rem;
		border: 1px solid var(--border);
		border-radius: 10px;
		background: var(--surface);
		font-size: 0.9rem;
		color: var(--muted);
	}

	.faq-strip a {
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.faq-strip a:hover {
		opacity: 0.8;
	}
</style>
