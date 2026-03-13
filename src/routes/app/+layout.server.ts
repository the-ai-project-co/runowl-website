import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
	const { session, user } = await locals.safeGetSession();

	// If landing on /app (not a sub-route) check for first-login flag
	if (url.pathname === '/app' && session) {
		const firstLogin = cookies.get('runowl_first_login');
		if (firstLogin === '1') {
			cookies.delete('runowl_first_login', { path: '/' });
			redirect(303, '/app/review');
		}
	}

	return { session, user };
};
