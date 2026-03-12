import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** POST /api/team/invite — invite a member by email */
export const POST: RequestHandler = async ({ request, locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) error(401, 'Unauthorized');

	const body = await request.json().catch(() => null);
	const email: string = (body?.email ?? '').trim().toLowerCase();
	const role: string = body?.role ?? 'member';

	if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		error(400, 'Valid email is required');
	}
	if (!['member', 'admin'].includes(role)) {
		error(400, 'Role must be "member" or "admin"');
	}

	// Insert invite record — the actual email is sent via Supabase trigger or edge function
	const { data, error: dbError } = await locals.supabase
		.from('team_members')
		.insert({ email, role, invited_by: user.id })
		.select()
		.single();

	if (dbError) {
		if (dbError.code === '23505') error(409, 'This email has already been invited');
		console.error('team/invite error:', dbError);
		error(500, 'Failed to send invite');
	}

	return json({ ok: true, member: data }, { status: 201 });
};
