import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/app';

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			redirect(303, next.startsWith('/') ? next : '/app');
		}
	}

	// Something went wrong — send back to login with error hint
	redirect(303, '/login?error=auth_callback_failed');
};
