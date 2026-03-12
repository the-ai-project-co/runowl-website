import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** GET /api/team/members — list team members for the authenticated user's org */
export const GET: RequestHandler = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) error(401, 'Unauthorized');

	// Fetch members from Supabase (team_members table)
	const { data, error: dbError } = await locals.supabase
		.from('team_members')
		.select('id, email, role, invited_at, accepted_at')
		.order('invited_at', { ascending: false });

	if (dbError) {
		console.error('team/members fetch error:', dbError);
		error(500, 'Failed to fetch team members');
	}

	return json({ members: data ?? [] });
};
