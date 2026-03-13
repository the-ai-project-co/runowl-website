import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MOCK } from '$lib/server/seed';

/** DELETE /api/team/remove — remove a member (admin only) */
export const DELETE: RequestHandler = async ({ request, locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) error(401, 'Unauthorized');

	if (MOCK) {
		return json({ ok: true });
	}

	// RBAC: only admins/owner can remove members
	const { data: callerRow } = await locals.supabase
		.from('team_members')
		.select('role')
		.eq('user_id', user.id)
		.maybeSingle();

	const isOwner = !callerRow;
	const isAdmin = callerRow?.role === 'admin';
	if (!isOwner && !isAdmin) error(403, 'Only admins can remove team members');

	const body = await request.json().catch(() => null);
	const memberId: string = body?.member_id ?? '';
	if (!memberId) error(400, 'member_id is required');

	const { error: dbError } = await locals.supabase
		.from('team_members')
		.delete()
		.eq('id', memberId);

	if (dbError) {
		console.error('team/remove error:', dbError);
		error(500, 'Failed to remove member');
	}

	return json({ ok: true });
};
