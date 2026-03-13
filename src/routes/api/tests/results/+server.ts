import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MOCK, mockSuiteResults } from '$lib/server/seed';

/** GET /api/tests/results?suite_id= */
export const GET: RequestHandler = async ({ url, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) error(401, 'Unauthorized');

	const suiteId = url.searchParams.get('suite_id') ?? '';
	if (!suiteId) error(400, 'suite_id is required');

	// CI / demo mode
	if (MOCK) {
		const result = mockSuiteResults[suiteId];
		if (!result) error(404, 'Test suite not found');
		return json(result);
	}

	const backendUrl = process.env.RUNOWL_BACKEND_URL ?? 'http://localhost:8000';
	const res = await fetch(`${backendUrl}/tests/${suiteId}`).catch(() => null);

	if (!res) error(502, 'RunOwl backend is unreachable');
	if (res.status === 404) error(404, 'Test suite not found');
	if (!res.ok) error(res.status as 400, 'Backend error');

	return json(await res.json());
};
