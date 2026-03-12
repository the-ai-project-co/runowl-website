import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** POST /api/tests/run */
export const POST: RequestHandler = async ({ request, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) error(401, 'Unauthorized');

	const body = await request.json().catch(() => null);
	if (!body?.url) error(400, 'url is required');

	const backendUrl = process.env.RUNOWL_BACKEND_URL ?? 'http://localhost:8000';
	const res = await fetch(`${backendUrl}/tests/run`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	}).catch(() => null);

	if (!res) error(502, 'RunOwl backend is unreachable');
	if (!res.ok) error(res.status as 400, 'Backend error');

	return json(await res.json());
};
