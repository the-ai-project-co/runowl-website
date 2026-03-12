import { createSupabaseServerClient } from '$lib/supabase-server';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const supabaseHandle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createSupabaseServerClient(event.cookies);

	event.locals.safeGetSession = async () => {
		const {
			data: { session },
		} = await event.locals.supabase.auth.getSession();

		if (!session) return { session: null, user: null };

		// Validate JWT with server to prevent spoofing
		const {
			data: { user },
			error,
		} = await event.locals.supabase.auth.getUser();

		if (error) return { session: null, user: null };

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		},
	});
};

const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	// Protect /app/* routes — redirect to login if not authenticated
	if (event.url.pathname.startsWith('/app') && !session) {
		redirect(303, '/login?redirectTo=' + encodeURIComponent(event.url.pathname));
	}

	// Redirect authenticated users away from auth pages
	if (
		session &&
		(event.url.pathname === '/login' ||
			event.url.pathname === '/signup' ||
			event.url.pathname === '/forgot-password')
	) {
		redirect(303, '/app');
	}

	return resolve(event);
};

export const handle = sequence(supabaseHandle, authGuard);
