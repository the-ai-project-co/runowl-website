import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MOCK, mockSuites } from '$lib/server/seed';

/** POST /api/tests/run */
export const POST: RequestHandler = async ({ request, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) error(401, 'Unauthorized');

	const body = await request.json().catch(() => null);
	if (!body?.owner || !body?.repo || !body?.pr_number) error(400, 'owner, repo, pr_number are required');

	// CI / demo mode
	if (MOCK) {
		const suite = mockSuites[0];
		return json({
			suite_id: suite.id,
			pr_ref: `${body.owner}/${body.repo}#${body.pr_number}`,
			status: 'running',
			message: `Executing ${suite.tests_count} generated tests in background`,
		});
	}

	const backendUrl = process.env.RUNOWL_BACKEND_URL ?? 'http://localhost:8000';

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 10000);

	const res = await fetch(`${backendUrl}/tests/run`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		signal: controller.signal,
		body: JSON.stringify(body),
	})
		.catch(() => null)
		.finally(() => clearTimeout(timeout));

	if (!res) error(502, 'RunOwl backend is unreachable');
	if (!res.ok) error(res.status, 'Backend error');

	return json(await res.json());
};
