import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── E2E: Complete PR review flow (all mocked at fetch level) ─────────────────
//
// These tests exercise the full pipeline: load PR -> trigger review -> poll
// results, verifying that the API client functions compose correctly through
// the entire workflow.

let fetchPR: typeof import('../../src/lib/api-client').fetchPR;
let triggerReview: typeof import('../../src/lib/api-client').triggerReview;
let getReviewResults: typeof import('../../src/lib/api-client').getReviewResults;

const mockFetch = vi.fn();

beforeEach(async () => {
	vi.resetModules();
	vi.stubGlobal('fetch', mockFetch);
	mockFetch.mockReset();

	const mod = await import('../../src/lib/api-client');
	fetchPR = mod.fetchPR;
	triggerReview = mod.triggerReview;
	getReviewResults = mod.getReviewResults;
});

// ── Fixtures ─────────────────────────────────────────────────────────────────

const PR_URL = 'https://github.com/acme/widget/pull/99';

const FAKE_PR_DATA = {
	meta: {
		number: 99,
		title: 'Add caching layer',
		body: 'Implements Redis caching for API responses.',
		author: 'alice',
		head_branch: 'feat/cache',
		base_branch: 'main',
		commits: 3,
		additions: 120,
		deletions: 15,
		changed_files: 4,
		state: 'open' as const,
		created_at: '2025-06-15T10:00:00Z',
		url: PR_URL,
	},
	files: [
		{
			filename: 'src/cache.ts',
			status: 'added' as const,
			additions: 80,
			deletions: 0,
			patch: '@@ -0,0 +1,80 @@\n+export class Cache {}',
			blob_url: 'https://github.com/acme/widget/blob/abc/src/cache.ts',
		},
		{
			filename: 'src/api.ts',
			status: 'modified' as const,
			additions: 40,
			deletions: 15,
			patch: '@@ -10,6 +10,8 @@\n import { db } from "./db";\n+import { Cache } from "./cache";',
			blob_url: 'https://github.com/acme/widget/blob/abc/src/api.ts',
		},
	],
	diff: 'full diff text here',
};

const FAKE_REVIEW_RESULT = {
	suite_id: 'suite-99',
	findings: [
		{
			id: 'f-1',
			severity: 'P1' as const,
			type: 'bug' as const,
			title: 'Cache key collision',
			description: 'Cache keys are not namespaced, which can lead to collisions.',
			file: 'src/cache.ts',
			line_start: 12,
			line_end: 14,
			suggestion: 'Prefix keys with the entity type.',
		},
		{
			id: 'f-2',
			severity: 'P2' as const,
			type: 'style' as const,
			title: 'Missing JSDoc',
			description: 'Public class lacks documentation.',
			file: 'src/cache.ts',
			line_start: 1,
			line_end: 1,
			suggestion: null,
		},
	],
	summary: 'Caching implementation is solid but has a key collision risk.',
	verdict: 'request_changes' as const,
};

function jsonResponse(body: unknown, status = 200) {
	return {
		ok: status >= 200 && status < 300,
		status,
		statusText: status === 200 ? 'OK' : `Error ${status}`,
		json: () => Promise.resolve(body),
	};
}

// ── Happy path: full flow ────────────────────────────────────────────────────

describe('e2e — complete PR review flow', () => {
	it('loads PR, triggers review, and retrieves results', async () => {
		// Step 1: fetchPR
		mockFetch.mockResolvedValueOnce(jsonResponse(FAKE_PR_DATA));
		// Step 2: triggerReview
		mockFetch.mockResolvedValueOnce(jsonResponse({ job_id: 'job-99' }));
		// Step 3: getReviewResults
		mockFetch.mockResolvedValueOnce(jsonResponse(FAKE_REVIEW_RESULT));

		const prData = await fetchPR(PR_URL);
		expect(prData.meta.title).toBe('Add caching layer');
		expect(prData.files).toHaveLength(2);

		const { job_id } = await triggerReview(PR_URL, 'gpt-4o');
		expect(job_id).toBe('job-99');

		const result = await getReviewResults(job_id);
		expect(result.findings).toHaveLength(2);
		expect(result.verdict).toBe('request_changes');
		expect(result.summary).toContain('collision');
	});

	it('loads PR with auth token for private repos', async () => {
		mockFetch.mockResolvedValueOnce(jsonResponse(FAKE_PR_DATA));
		mockFetch.mockResolvedValueOnce(jsonResponse({ job_id: 'job-priv' }));
		mockFetch.mockResolvedValueOnce(jsonResponse({ ...FAKE_REVIEW_RESULT, verdict: 'approve' }));

		const prData = await fetchPR(PR_URL, 'ghp_secret_token');
		expect(prData.meta.number).toBe(99);

		// Verify the token was sent
		const [, fetchOpts] = mockFetch.mock.calls[0];
		expect(fetchOpts.headers['X-GitHub-Token']).toBe('ghp_secret_token');

		const { job_id } = await triggerReview(PR_URL);
		const result = await getReviewResults(job_id);
		expect(result.verdict).toBe('approve');
	});

	it('completes the full flow with a clean PR (no findings)', async () => {
		const cleanResult = {
			suite_id: 'suite-clean',
			findings: [],
			summary: 'Looks good! No issues found.',
			verdict: 'approve',
		};

		mockFetch.mockResolvedValueOnce(jsonResponse(FAKE_PR_DATA));
		mockFetch.mockResolvedValueOnce(jsonResponse({ job_id: 'job-clean' }));
		mockFetch.mockResolvedValueOnce(jsonResponse(cleanResult));

		const prData = await fetchPR(PR_URL);
		const { job_id } = await triggerReview(prData.meta.url);
		const result = await getReviewResults(job_id);

		expect(result.findings).toHaveLength(0);
		expect(result.verdict).toBe('approve');
	});
});

// ── Error handling ───────────────────────────────────────────────────────────

describe('e2e — error handling across the flow', () => {
	it('fails gracefully on invalid PR URL (backend 400)', async () => {
		mockFetch.mockResolvedValueOnce(
			jsonResponse({ detail: 'Invalid GitHub PR URL.' }, 400)
		);

		await expect(fetchPR('https://not-github.com/foo')).rejects.toThrow(
			'Invalid GitHub PR URL.'
		);

		// Subsequent steps should never have been called
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('fails when backend is unreachable (fetch throws)', async () => {
		mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));

		await expect(fetchPR(PR_URL)).rejects.toThrow('fetch failed');
	});

	it('handles review trigger failure after successful PR load', async () => {
		mockFetch.mockResolvedValueOnce(jsonResponse(FAKE_PR_DATA));
		mockFetch.mockResolvedValueOnce(
			jsonResponse({ detail: 'Service temporarily unavailable' }, 503)
		);

		const prData = await fetchPR(PR_URL);
		expect(prData.meta.title).toBe('Add caching layer');

		await expect(triggerReview(PR_URL)).rejects.toThrow(
			'Service temporarily unavailable'
		);
	});

	it('handles review results polling failure (job not found)', async () => {
		mockFetch.mockResolvedValueOnce(jsonResponse(FAKE_PR_DATA));
		mockFetch.mockResolvedValueOnce(jsonResponse({ job_id: 'job-ghost' }));
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 404,
			json: () => Promise.resolve({ detail: 'Job not found' }),
		});

		await fetchPR(PR_URL);
		const { job_id } = await triggerReview(PR_URL);
		await expect(getReviewResults(job_id)).rejects.toThrow('Backend error 404');
	});

	it('handles 401 for private repos without token', async () => {
		mockFetch.mockResolvedValueOnce(
			jsonResponse({ detail: 'Repository is private - a token is required.' }, 401)
		);

		await expect(fetchPR(PR_URL)).rejects.toThrow('token is required');
	});

	it('handles sequential retry after transient failure', async () => {
		// First attempt fails
		mockFetch.mockResolvedValueOnce(
			jsonResponse({ detail: 'Temporary failure' }, 502)
		);
		// Second attempt succeeds
		mockFetch.mockResolvedValueOnce(jsonResponse(FAKE_PR_DATA));

		await expect(fetchPR(PR_URL)).rejects.toThrow('Temporary failure');

		// Retry succeeds
		const prData = await fetchPR(PR_URL);
		expect(prData.meta.number).toBe(99);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});
});
