import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { RequestHandler } from './$types';
import type { FeedbackType } from '$lib/supabase';

const ALLOWED_TYPES: FeedbackType[] = ['general', 'bug', 'feature'];

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const { type, message, email, page } = body as Record<string, unknown>;

	// Validate
	if (!ALLOWED_TYPES.includes(type as FeedbackType)) {
		return json({ error: 'Invalid type' }, { status: 400 });
	}
	if (typeof message !== 'string' || message.length < 10 || message.length > 2000) {
		return json({ error: 'Message must be between 10 and 2000 characters' }, { status: 400 });
	}
	if (email !== undefined && email !== null && email !== '') {
		if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return json({ error: 'Invalid email address' }, { status: 400 });
		}
	}

	const client = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

	const { error } = await client.from('feedback').insert({
		type,
		message,
		email: email || null,
		page: typeof page === 'string' ? page : null,
		user_agent: request.headers.get('user-agent'),
	});

	if (error) {
		console.error('Feedback insert error:', error.message);
		return json({ error: 'Failed to save feedback' }, { status: 500 });
	}

	return json({ ok: true }, { status: 201 });
};
