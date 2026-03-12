import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** GET /api/review/results/:jobId */
export const GET: RequestHandler = async ({ params, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) error(401, 'Unauthorized');

	const backendUrl = process.env.RUNOWL_BACKEND_URL ?? 'http://localhost:8000';
	const res = await fetch(`${backendUrl}/api/review/results/${params.jobId}`).catch(() => null);

	if (!res) error(502, 'RunOwl backend is unreachable');
	if (res.status === 404) error(404, 'Job not found');
	if (!res.ok) error(res.status, 'Backend error');

	return json(await res.json());
};
