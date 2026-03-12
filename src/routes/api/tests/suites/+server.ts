import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** GET /api/tests/suites?pr_ref=owner/repo%23123 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) error(401, 'Unauthorized');

	const prRef = url.searchParams.get('pr_ref') ?? '';
	const backendUrl = process.env.RUNOWL_BACKEND_URL ?? 'http://localhost:8000';
	const res = await fetch(
		`${backendUrl}/tests/suites${prRef ? `?pr_ref=${encodeURIComponent(prRef)}` : ''}`
	).catch(() => null);

	if (!res) error(502, 'RunOwl backend is unreachable');
	if (!res.ok) error(res.status as 400, 'Backend error');

	return json(await res.json());
};
