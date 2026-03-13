<script lang="ts">
	import { upgradeStore } from '$lib/stores/upgrade.svelte';
	import { goto } from '$app/navigation';
	import { X, Zap, Check, ArrowRight } from 'lucide-svelte';

	const plans = [
		{
			id: 'team' as const,
			name: 'Team',
			price: '$29',
			period: '/seat/mo',
			color: 'var(--accent)',
			features: [
				'Deep OWASP security checks',
				'SOLID architecture analysis',
				'GitHub Check Runs',
				'Unlimited PRs',
				'Up to 20 seats',
			],
		},
		{
			id: 'business' as const,
			name: 'Business',
			price: '$79',
			period: '/seat/mo',
			color: '#8b5cf6',
			features: [
				'Everything in Team',
				'SSO / SAML',
				'Custom review rules',
				'Audit logs & compliance',
				'Unlimited seats',
			],
		},
	];

	function onBackdrop(e: MouseEvent) {
		if ((e.target as HTMLElement).classList.contains('modal-backdrop')) upgradeStore.hide();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') upgradeStore.hide();
	}

	function upgrade(planId: 'team' | 'business') {
		upgradeStore.hide();
		goto('/app/settings/billing');
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if upgradeStore.open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="modal-backdrop"
		onclick={onBackdrop}
		role="dialog"
		aria-modal="true"
		aria-label="Upgrade plan"
		tabindex="-1"
	>
		<div class="modal">
			<!-- Header -->
			<div class="modal-head">
				<div class="modal-title-row">
					<span class="modal-icon">
						<Zap size={15} color="var(--accent)" />
					</span>
					<div>
						<h2 class="modal-title">Upgrade to unlock</h2>
						{#if upgradeStore.context}
							<p class="modal-hint">
								<strong>{upgradeStore.context.feature}</strong> requires the
								<strong>{upgradeStore.context.requiredPlan === 'team' ? 'Team' : 'Business'}</strong> plan.
							</p>
						{/if}
					</div>
				</div>
				<button class="close-btn" onclick={() => upgradeStore.hide()} aria-label="Close">
					<X size={15} />
				</button>
			</div>

			<!-- Plan cards -->
			<div class="plans-wrap">
				{#each plans as plan}
					{@const isRequired = upgradeStore.context?.requiredPlan === plan.id}
					{@const isHigher = plan.id === 'business' && upgradeStore.context?.requiredPlan === 'team'}
					<div
						class="plan-card"
						class:plan-highlight={isRequired}
						style="--plan-color: {plan.color}"
					>
						{#if isRequired}
							<span class="recommended-badge">Recommended</span>
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
								<li><Check size={12} color={plan.color} />{f}</li>
							{/each}
						</ul>
						<button
							class="plan-cta"
							class:cta-outline={!isRequired && !isHigher}
							style={isRequired || isHigher ? `background: ${plan.color};` : ''}
							onclick={() => upgrade(plan.id)}
						>
							Upgrade to {plan.name}
							<ArrowRight size={13} />
						</button>
					</div>
				{/each}
			</div>

			<div class="modal-foot">
				<button class="btn-ghost" onclick={() => upgradeStore.hide()}>Maybe later</button>
				<a href="/app/settings/billing" class="see-all-link" onclick={() => upgradeStore.hide()}>
					See all plans →
				</a>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 400;
		background: rgba(0, 0, 0, 0.65);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		animation: fadeIn 0.15s ease;
	}
	@keyframes fadeIn { from { opacity: 0; } }

	.modal {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 16px;
		width: 100%;
		max-width: 560px;
		box-shadow: 0 32px 80px rgba(0, 0, 0, 0.55);
		animation: slideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
		overflow: hidden;
	}
	@keyframes slideUp {
		from { opacity: 0; transform: translateY(14px) scale(0.97); }
	}

	.modal-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 1.25rem 1.25rem 0;
	}
	.modal-title-row {
		display: flex;
		align-items: flex-start;
		gap: 0.7rem;
	}
	.modal-icon {
		width: 32px;
		height: 32px;
		border-radius: 9px;
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-top: 1px;
	}
	.modal-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text);
		letter-spacing: -0.02em;
		margin-bottom: 0.2rem;
	}
	.modal-hint {
		font-size: 0.8rem;
		color: var(--muted);
		line-height: 1.5;
	}
	.modal-hint strong { color: var(--text); }

	.close-btn {
		width: 28px;
		height: 28px;
		border-radius: 7px;
		background: none;
		border: 1px solid var(--border);
		color: var(--muted);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: color 0.12s, background 0.12s;
	}
	.close-btn:hover { color: var(--text); background: var(--surface-2); }

	.plans-wrap {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
	}

	.plan-card {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		position: relative;
		transition: border-color 0.15s;
	}
	.plan-card.plan-highlight {
		border-color: color-mix(in srgb, var(--plan-color) 45%, transparent);
		background: color-mix(in srgb, var(--plan-color) 4%, var(--surface-2));
	}

	.recommended-badge {
		position: absolute;
		top: -9px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--plan-color);
		color: #fff;
		font-size: 0.62rem;
		font-weight: 700;
		padding: 0.15rem 0.55rem;
		border-radius: 4px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}

	.plan-head { display: flex; flex-direction: column; gap: 0.2rem; }
	.plan-name {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--plan-color);
	}
	.plan-price-row { display: flex; align-items: baseline; gap: 0.15rem; }
	.plan-price { font-size: 1.5rem; font-weight: 800; color: var(--text); letter-spacing: -0.04em; }
	.plan-period { font-size: 0.72rem; color: var(--muted); }

	.plan-features {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		flex: 1;
	}
	.plan-features li {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.76rem;
		color: var(--text);
	}

	.plan-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		padding: 0.5rem 0.85rem;
		border-radius: 7px;
		color: #fff;
		font-size: 0.78rem;
		font-weight: 600;
		border: none;
		cursor: pointer;
		font-family: inherit;
		transition: opacity 0.12s;
	}
	.plan-cta:hover { opacity: 0.88; }
	.plan-cta.cta-outline {
		background: none !important;
		border: 1px solid var(--border);
		color: var(--text);
	}
	.plan-cta.cta-outline:hover { background: var(--surface) !important; }

	.modal-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.85rem 1.25rem;
		border-top: 1px solid var(--border);
		background: var(--surface-2);
	}
	.btn-ghost {
		background: none;
		border: none;
		font-size: 0.8rem;
		color: var(--muted);
		cursor: pointer;
		font-family: inherit;
		padding: 0;
	}
	.btn-ghost:hover { color: var(--text); }
	.see-all-link {
		font-size: 0.8rem;
		color: var(--accent);
		text-decoration: none;
	}
	.see-all-link:hover { text-decoration: underline; }

	@media (max-width: 480px) {
		.plans-wrap { grid-template-columns: 1fr; }
	}
</style>
