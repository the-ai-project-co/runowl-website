<script lang="ts">
	import { Check, Zap, ArrowRight, ArrowLeft, CreditCard, Download } from 'lucide-svelte';

	// Current plan — in production this comes from server data/Supabase
	let currentPlan = $state<'free' | 'team' | 'business'>('free');

	interface Plan {
		id: string;
		name: string;
		price: string;
		period: string;
		color: string;
		popular?: boolean;
		features: readonly string[];
		cta: string;
	}

	const plans: Plan[] = [
		{
			id: 'free',
			name: 'Free',
			price: '$0',
			period: 'forever',
			color: 'var(--muted)',
			features: [
				'Surface security checks',
				'AI code review (10 PRs/mo)',
				'Q&A chat per PR',
				'GitHub webhook',
				'1 seat',
			],
			cta: 'Current plan',
		},
		{
			id: 'team',
			name: 'Team',
			price: '$29',
			period: '/seat/mo',
			color: 'var(--accent)',
			popular: true,
			features: [
				'Everything in Free',
				'Deep OWASP security checks',
				'SOLID architecture analysis',
				'GitHub Check Runs',
				'Unlimited PRs',
				'Up to 20 seats',
				'Priority email support',
			],
			cta: 'Upgrade to Team',
		},
		{
			id: 'business',
			name: 'Business',
			price: '$79',
			period: '/seat/mo',
			color: '#8b5cf6',
			features: [
				'Everything in Team',
				'SSO / SAML',
				'Custom review rules',
				'Audit logs',
				'Compliance reports',
				'Dedicated Slack support',
				'Unlimited seats',
			],
			cta: 'Upgrade to Business',
		},
	];

	// Usage meters
	const usage = {
		prs: { used: 7, limit: 10, label: 'PRs reviewed this month' },
		seats: { used: 1, limit: 1, label: 'Seats used' },
	};

	// Demo invoices
	const invoices = [
		{ id: 'inv-001', date: 'Feb 2026', amount: '$0.00', status: 'paid' },
		{ id: 'inv-002', date: 'Jan 2026', amount: '$0.00', status: 'paid' },
	];

	function usagePct(used: number, limit: number) {
		return Math.min((used / limit) * 100, 100);
	}

	function usageColor(pct: number) {
		if (pct >= 90) return 'var(--red)';
		if (pct >= 70) return '#f97316';
		return 'var(--accent)';
	}
</script>

<svelte:head>
	<title>Billing — RunOwl</title>
</svelte:head>

<div class="billing-page">
	<a href="/app/settings" class="back-link">
		<ArrowLeft size={13} /> Settings
	</a>
	<div class="page-head">
		<h1 class="page-title">Billing & Plans</h1>
		<p class="page-sub">Manage your subscription and usage.</p>
	</div>

	<!-- Usage meters (only show when on free plan) -->
	{#if currentPlan === 'free'}
		<div class="usage-card">
			<span class="section-label">Free tier usage</span>
			<div class="meters">
				{#each Object.values(usage) as m}
					{@const pct = usagePct(m.used, m.limit)}
					<div class="meter">
						<div class="meter-head">
							<span class="meter-label">{m.label}</span>
							<span class="meter-count">{m.used} / {m.limit}</span>
						</div>
						<div class="meter-track">
							<div
								class="meter-fill"
								style="width: {pct}%; background: {usageColor(pct)};"
							></div>
						</div>
						{#if pct >= 90}
							<span class="meter-warn">
								<Zap size={11} />
								Near limit — upgrade to continue
							</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Plan cards -->
	<div class="plans-grid">
		{#each plans as plan}
			<div
				class="plan-card"
				class:plan-current={plan.id === currentPlan}
				class:plan-popular={plan.popular}
				style="--plan-color: {plan.color}"
			>
				{#if plan.popular}
					<span class="popular-badge">Most popular</span>
				{/if}
				<div class="plan-head">
					<span class="plan-name">{plan.name}</span>
					<div class="plan-price-row">
						<span class="plan-price">{plan.price}</span>
						<span class="plan-period">{plan.period}</span>
					</div>
				</div>
				<ul class="plan-features">
					{#each plan.features as f}
						<li>
							<Check size={13} color={plan.color} />
							{f}
						</li>
					{/each}
				</ul>
				{#if plan.id === currentPlan}
					<span class="plan-active-label">
						<span class="active-dot"></span>
						Current plan
					</span>
				{:else}
					<button
						class="plan-cta"
						style="background: {plan.color};"
						onclick={() => (currentPlan = plan.id as typeof currentPlan)}
					>
						{plan.cta}
						<ArrowRight size={13} />
					</button>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Payment method -->
	<div class="section-card">
		<div class="section-head">
			<span class="section-label">Payment method</span>
		</div>
		<div class="payment-row">
			<span class="payment-icon">
				<CreditCard size={18} color="var(--muted)" />
			</span>
			<div class="payment-info">
				<span class="payment-label">No payment method on file</span>
				<span class="payment-hint">Add a card to upgrade your plan.</span>
			</div>
			<button class="btn-outline">Add card</button>
		</div>
	</div>

	<!-- Invoice history -->
	<div class="section-card">
		<div class="section-head">
			<span class="section-label">Invoice history</span>
		</div>
		{#if invoices.length === 0}
			<p class="empty-invoices">No invoices yet.</p>
		{:else}
			<table class="invoice-table">
				<thead>
					<tr>
						<th>Date</th>
						<th>Amount</th>
						<th>Status</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each invoices as inv (inv.id)}
						<tr>
							<td>{inv.date}</td>
							<td class="inv-amount">{inv.amount}</td>
							<td>
								<span class="inv-status status-{inv.status}">{inv.status}</span>
							</td>
							<td>
								<button class="dl-btn" aria-label="Download invoice">
									<Download size={13} />
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>

<style>
	.billing-page {
		padding: 2rem 2.5rem 3rem;
		max-width: 900px;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.78rem;
		color: var(--muted);
		text-decoration: none;
		transition: color 0.12s;
		width: fit-content;
	}
	.back-link:hover { color: var(--text); }

	.page-head { display: contents; }
	.page-title {
		font-size: 1.45rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		color: var(--text);
		margin-bottom: 0.2rem;
	}
	.page-sub { font-size: 0.82rem; color: var(--muted); }

	.section-label {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}

	/* Usage card */
	.usage-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.meters {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}
	.meter { display: flex; flex-direction: column; gap: 0.35rem; }
	.meter-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.meter-label { font-size: 0.82rem; color: var(--text); }
	.meter-count { font-size: 0.78rem; color: var(--muted); }
	.meter-track {
		height: 5px;
		background: var(--border);
		border-radius: 3px;
		overflow: hidden;
	}
	.meter-fill {
		height: 100%;
		border-radius: 3px;
		transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.meter-warn {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.72rem;
		color: var(--red);
	}

	/* Plans grid */
	.plans-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1rem;
	}
	.plan-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		position: relative;
		transition: border-color 0.15s;
	}
	.plan-card.plan-current {
		border-color: color-mix(in srgb, var(--plan-color) 40%, transparent);
	}
	.plan-card.plan-popular {
		border-color: color-mix(in srgb, var(--plan-color) 30%, transparent);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--plan-color) 15%, transparent);
	}

	.popular-badge {
		position: absolute;
		top: -10px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--plan-color);
		color: #fff;
		font-size: 0.65rem;
		font-weight: 700;
		padding: 0.2rem 0.6rem;
		border-radius: 4px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}

	.plan-head { display: flex; flex-direction: column; gap: 0.3rem; }
	.plan-name {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--plan-color);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.plan-price-row { display: flex; align-items: baseline; gap: 0.2rem; }
	.plan-price {
		font-size: 1.8rem;
		font-weight: 800;
		color: var(--text);
		letter-spacing: -0.04em;
	}
	.plan-period { font-size: 0.78rem; color: var(--muted); }

	.plan-features {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		flex: 1;
	}
	.plan-features li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		color: var(--text);
	}

	.plan-active-label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.78rem;
		color: var(--muted);
	}
	.active-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--green);
	}

	.plan-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 0.55rem 1rem;
		border-radius: 8px;
		color: #fff;
		font-size: 0.83rem;
		font-weight: 600;
		border: none;
		cursor: pointer;
		font-family: inherit;
		transition: opacity 0.12s, transform 0.12s;
	}
	.plan-cta:hover { opacity: 0.9; transform: translateY(-1px); }

	/* Section card */
	.section-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}
	.section-head { display: contents; }

	.payment-row {
		display: flex;
		align-items: center;
		gap: 0.85rem;
	}
	.payment-icon {
		width: 38px;
		height: 38px;
		border-radius: 9px;
		border: 1px solid var(--border);
		background: var(--surface-2);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.payment-info { flex: 1; display: flex; flex-direction: column; gap: 0.15rem; }
	.payment-label { font-size: 0.83rem; color: var(--text); font-weight: 500; }
	.payment-hint { font-size: 0.75rem; color: var(--muted); }

	.btn-outline {
		background: none;
		border: 1px solid var(--border);
		border-radius: 7px;
		padding: 0.4rem 0.85rem;
		font-size: 0.8rem;
		color: var(--text);
		cursor: pointer;
		font-family: inherit;
		transition: border-color 0.12s, background 0.12s;
		flex-shrink: 0;
	}
	.btn-outline:hover { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 6%, transparent); }

	/* Invoice table */
	.empty-invoices { font-size: 0.82rem; color: var(--muted); }
	.invoice-table {
		width: 100%;
		border-collapse: collapse;
	}
	.invoice-table th {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
		padding: 0 0 0.5rem;
		text-align: left;
		border-bottom: 1px solid var(--border);
	}
	.invoice-table td {
		padding: 0.7rem 0;
		font-size: 0.82rem;
		color: var(--text);
		border-bottom: 1px solid var(--border);
	}
	.invoice-table tr:last-child td { border-bottom: none; }
	.inv-amount { font-variant-numeric: tabular-nums; }

	.inv-status {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
	}
	.status-paid {
		background: color-mix(in srgb, var(--green) 12%, transparent);
		color: var(--green);
	}
	.dl-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--muted);
		display: flex;
		align-items: center;
		padding: 0.2rem;
		border-radius: 4px;
		transition: color 0.12s;
	}
	.dl-btn:hover { color: var(--text); }

	@media (max-width: 640px) {
		.billing-page { padding: 1.25rem 1rem 2rem; }
		.plans-grid { grid-template-columns: 1fr; }
	}
</style>
