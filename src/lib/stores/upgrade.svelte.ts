export type Plan = 'free' | 'team' | 'business';

export interface UpgradeContext {
	feature: string;       // human-readable feature name
	requiredPlan: 'team' | 'business';
}

function createUpgradeStore() {
	let open = $state(false);
	let context = $state<UpgradeContext | null>(null);
	// In production, load from server/Supabase
	let currentPlan = $state<Plan>('free');

	function show(ctx: UpgradeContext) {
		context = ctx;
		open = true;
	}

	function hide() {
		open = false;
	}

	function setPlan(plan: Plan) {
		currentPlan = plan;
	}

	function hasAccess(requiredPlan: 'team' | 'business') {
		if (requiredPlan === 'team') return currentPlan === 'team' || currentPlan === 'business';
		return currentPlan === 'business';
	}

	return {
		get open() { return open; },
		get context() { return context; },
		get currentPlan() { return currentPlan; },
		show,
		hide,
		setPlan,
		hasAccess,
	};
}

export const upgradeStore = createUpgradeStore();
