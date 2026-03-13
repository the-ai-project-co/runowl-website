import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals, cookies }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/app';

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			// Mark this as a first login so the app layout can redirect to /app/review
			cookies.set('runowl_first_login', '1', { path: '/', maxAge: 60, httpOnly: true });
			redirect(303, next.startsWith('/') ? next : '/app');
		}
	}

	// Something went wrong — send back to login with error hint
	redirect(303, '/login?error=auth_callback_failed');
};
