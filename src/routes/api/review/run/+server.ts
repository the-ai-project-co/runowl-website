import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** POST /api/review/run — trigger a review job */
export const POST: RequestHandler = async ({ request, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) error(401, 'Unauthorized');

	const body = await request.json().catch(() => null);
	const prUrl: string = body?.url ?? '';
	const model: string = body?.model ?? '';

	if (!prUrl) error(400, 'url is required');

	const backendUrl = process.env.RUNOWL_BACKEND_URL ?? 'http://localhost:8000';

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15000);

	const res = await fetch(`${backendUrl}/review`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		signal: controller.signal,
		body: JSON.stringify({ url: prUrl, ...(model ? { model } : {}) }),
	})
		.catch(() => null)
		.finally(() => clearTimeout(timeout));

	if (!res) error(502, 'RunOwl backend is unreachable');
	if (!res.ok) {
		const detail = await res.json().catch(() => ({ detail: res.statusText }));
		error(res.status, detail.detail ?? 'Backend error');
	}

	return json(await res.json());
};
