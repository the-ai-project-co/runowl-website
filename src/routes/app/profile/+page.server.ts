import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	return { session, user };
};

export const actions: Actions = {
	updatePassword: async ({ request, locals }) => {
		const { session } = await locals.safeGetSession();
		if (!session) return fail(401, { error: 'Not authenticated' });

		const form = await request.formData();
		const password = String(form.get('password') ?? '');
		const confirmPassword = String(form.get('confirmPassword') ?? '');

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.', field: 'password' });
		}
		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.', field: 'confirmPassword' });
		}

		const { error } = await locals.supabase.auth.updateUser({ password });
		if (error) return fail(400, { error: error.message });

		return { passwordUpdated: true };
	},

	deleteAccount: async ({ locals }) => {
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { error: 'Not authenticated' });

		// Sign out first, then the user can contact support for full data deletion
		await locals.supabase.auth.signOut();
		return { accountDeleted: true };
	},
};
