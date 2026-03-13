import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MOCK } from '$lib/server/seed';

/** POST /api/team/invite — invite a member by email (admin only) */
export const POST: RequestHandler = async ({ request, locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) error(401, 'Unauthorized');

	if (MOCK) {
		const body = await request.json().catch(() => null);
		return json({
			ok: true,
			member: {
				id: crypto.randomUUID(),
				email: body?.email ?? '',
				role: body?.role ?? 'reviewer',
				status: 'pending',
				invited_at: new Date().toISOString(),
				accepted_at: null,
				reviews_count: 0,
			},
		}, { status: 201 });
	}

	// RBAC: only admins can invite
	const { data: callerRow } = await locals.supabase
		.from('team_members')
		.select('role')
		.eq('user_id', user.id)
		.maybeSingle();

	// Owner (no team_members row) or admin can invite
	const isOwner = !callerRow;
	const isAdmin = callerRow?.role === 'admin';
	if (!isOwner && !isAdmin) error(403, 'Only admins can invite team members');

	const body = await request.json().catch(() => null);
	const email: string = (body?.email ?? '').trim().toLowerCase();
	const role: string = body?.role ?? 'reviewer';

	if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		error(400, 'Valid email is required');
	}
	if (!['reviewer', 'viewer', 'admin'].includes(role)) {
		error(400, 'Role must be "reviewer", "viewer", or "admin"');
	}

	const { data, error: dbError } = await locals.supabase
		.from('team_members')
		.insert({ email, role, invited_by: user.id, status: 'pending' })
		.select()
		.single();

	if (dbError) {
		if (dbError.code === '23505') error(409, 'This email has already been invited');
		console.error('team/invite error:', dbError);
		error(500, 'Failed to send invite');
	}

	return json({ ok: true, member: data }, { status: 201 });
};
