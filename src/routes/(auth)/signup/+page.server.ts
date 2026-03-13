import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
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
		const confirmPassword = String(form.get('confirmPassword') ?? '');

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, { error: 'Please enter a valid email address.', email });
		}
		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.', email });
		}
		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.', email });
		}

		const { error } = await locals.supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${url.origin}/auth/callback`,
			},
		});

		if (error) {
			console.error('[signup] Supabase error:', error.message, error.status);
			if (error.message.toLowerCase().includes('already registered')) {
				return fail(400, {
					error: 'An account with this email already exists.',
					email,
				});
			}
			return fail(400, { error: error.message, email });
		}

		// Supabase sends a confirmation email — show the success state
		return { success: true, email };
	},
};
