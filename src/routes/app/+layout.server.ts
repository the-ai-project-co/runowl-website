import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	// hooks.server.ts already redirects unauthenticated users, but we pass data down
	return { session, user };
};
