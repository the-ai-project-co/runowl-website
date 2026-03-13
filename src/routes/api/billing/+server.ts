import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MOCK } from '$lib/server/seed';

/** GET /api/billing — current plan and invoices for the authenticated user */
export const GET: RequestHandler = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) error(401, 'Unauthorized');

	if (MOCK) {
		return json({
			plan: 'free',
			seats: 1,
			invoices: [],
		});
	}

	// Read subscription from Supabase
	const { data: sub } = await locals.supabase
		.from('subscriptions')
		.select('plan, seats, stripe_customer_id')
		.eq('user_id', user.id)
		.maybeSingle();

	// Read invoices from Supabase
	const { data: invs } = await locals.supabase
		.from('invoices')
		.select('id, period, amount_cents, status, created_at')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })
		.limit(12);

	return json({
		plan: sub?.plan ?? 'free',
		seats: sub?.seats ?? 1,
		invoices: (invs ?? []).map((inv) => ({
			id: inv.id,
			date: new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
			amount: `$${((inv.amount_cents ?? 0) / 100).toFixed(2)}`,
			status: inv.status ?? 'paid',
		})),
	});
};
