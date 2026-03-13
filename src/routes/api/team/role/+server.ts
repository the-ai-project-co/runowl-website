import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MOCK } from '$lib/server/seed';

/** PATCH /api/team/role — change a member's role (admin only) */
export const PATCH: RequestHandler = async ({ request, locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) error(401, 'Unauthorized');

	if (MOCK) {
		return json({ ok: true });
	}

	// RBAC: only admins/owner can change roles
	const { data: callerRow } = await locals.supabase
		.from('team_members')
		.select('role')
		.eq('user_id', user.id)
		.maybeSingle();

	const isOwner = !callerRow;
	const isAdmin = callerRow?.role === 'admin';
	if (!isOwner && !isAdmin) error(403, 'Only admins can change member roles');

	const body = await request.json().catch(() => null);
	const memberId: string = body?.member_id ?? '';
	const role: string = body?.role ?? '';

	if (!memberId) error(400, 'member_id is required');
	if (!['reviewer', 'viewer', 'admin'].includes(role)) {
		error(400, 'Role must be "reviewer", "viewer", or "admin"');
	}

	const { error: dbError } = await locals.supabase
		.from('team_members')
		.update({ role })
		.eq('id', memberId)
		.eq('invited_by', user.id); // can only change members you invited or in your org

	if (dbError) {
		console.error('team/role error:', dbError);
		error(500, 'Failed to update role');
	}

	return json({ ok: true });
};
