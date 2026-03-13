<script lang="ts">
	import { upgradeStore, type Plan } from '$lib/stores/upgrade.svelte';
	import { Zap, Lock } from 'lucide-svelte';

	interface Props {
		feature: string;
		requiredPlan: 'team' | 'business';
		compact?: boolean;
		children?: import('svelte').Snippet;
	}

	let { feature, requiredPlan, compact = false, children }: Props = $props();

	const hasAccess = $derived(upgradeStore.hasAccess(requiredPlan));

	function trigger() {
		upgradeStore.show({ feature, requiredPlan });
	}
</script>

{#if hasAccess}
	{@render children?.()}
{:else if compact}
	<!-- Inline lock badge -->
	<button class="lock-badge" onclick={trigger} title="Upgrade to unlock {feature}">
		<Lock size={11} />
		{requiredPlan === 'team' ? 'Team' : 'Business'}
	</button>
{:else}
	<!-- Full gate card -->
	<div class="gate-card">
		<div class="gate-icon">
			<Zap size={20} color="var(--accent)" />
		</div>
		<div class="gate-body">
			<span class="gate-title">{feature}</span>
			<span class="gate-hint">
				Available on the <strong>{requiredPlan === 'team' ? 'Team' : 'Business'}</strong> plan.
			</span>
		</div>
		<button class="gate-cta" onclick={trigger}>
			Upgrade
			<Zap size={12} />
		</button>
	</div>
{/if}

<style>
	/* Compact lock badge */
	.lock-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
		background: color-mix(in srgb, var(--accent) 10%, transparent);
		color: var(--accent);
		border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
		cursor: pointer;
		font-family: inherit;
		transition: background 0.12s;
	}
	.lock-badge:hover {
		background: color-mix(in srgb, var(--accent) 18%, transparent);
	}

	/* Full gate card */
	.gate-card {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		background: color-mix(in srgb, var(--accent) 5%, var(--surface));
		border: 1px solid color-mix(in srgb, var(--accent) 18%, var(--border));
		border-radius: 10px;
		padding: 0.85rem 1rem;
	}
	.gate-icon {
		width: 36px;
		height: 36px;
		border-radius: 9px;
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.gate-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.gate-title {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text);
	}
	.gate-hint {
		font-size: 0.75rem;
		color: var(--muted);
	}
	.gate-hint strong { color: var(--text); }
	.gate-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 7px;
		padding: 0.45rem 0.9rem;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		flex-shrink: 0;
		transition: opacity 0.12s;
	}
	.gate-cta:hover { opacity: 0.88; }
</style>
