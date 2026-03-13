import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MOCK } from '$lib/server/seed';

/** GET /api/billing/usage — PR and seat usage for the current billing period */
export const GET: RequestHandler = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) error(401, 'Unauthorized');

	if (MOCK) {
		return json({
			prs: { used: 7, limit: 10 },
			seats: { used: 1, limit: 1 },
		});
	}

	// Count PRs reviewed this calendar month
	const startOfMonth = new Date();
	startOfMonth.setDate(1);
	startOfMonth.setHours(0, 0, 0, 0);

	const { count: prCount } = await locals.supabase
		.from('reviews')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', user.id)
		.gte('created_at', startOfMonth.toISOString());

	// Count active seats
	const { count: seatCount } = await locals.supabase
		.from('team_members')
		.select('id', { count: 'exact', head: true })
		.eq('invited_by', user.id)
		.eq('status', 'active');

	// Get plan limits
	const { data: sub } = await locals.supabase
		.from('subscriptions')
		.select('plan, seats')
		.eq('user_id', user.id)
		.maybeSingle();

	const plan = sub?.plan ?? 'free';
	const prLimit = plan === 'free' ? 10 : -1; // -1 = unlimited
	const seatLimit = plan === 'free' ? 1 : (sub?.seats ?? 20);

	return json({
		prs: { used: prCount ?? 0, limit: prLimit },
		seats: { used: (seatCount ?? 0) + 1, limit: seatLimit }, // +1 for owner
	});
};
