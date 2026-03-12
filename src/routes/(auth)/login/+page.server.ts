import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Already authenticated — hooks.server.ts will redirect, but belt-and-suspenders
	const { session } = await locals.safeGetSession();
	if (session) redirect(303, '/app');
	return { session: null, user: null };
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();
		const password = String(form.get('password') ?? '');
		const redirectTo = url.searchParams.get('redirectTo') ?? '/app';

		// Basic validation
		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, { error: 'Please enter a valid email address.', email });
		}
		if (!password) {
			return fail(400, { error: 'Password is required.', email });
		}

		const { error } = await locals.supabase.auth.signInWithPassword({ email, password });

		if (error) {
			// Don't leak whether the account exists
			return fail(401, {
				error: 'Invalid email or password.',
				email,
			});
		}

		redirect(303, redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/app');
	},
};
