import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Integration tests for src/lib/api-client.ts with mocked fetch ────────────

// We dynamically import the module so that each test suite gets the mocked
// global.fetch wired in before the module-level `fetch` calls execute.

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200) {
	return {
		ok: status >= 200 && status < 300,
		status,
		statusText: status === 200 ? 'OK' : 'Error',
		json: () => Promise.resolve(body),
	};
}

// ── fetchPR ──────────────────────────────────────────────────────────────────

describe('api-client — fetchPR', () => {
	const prUrl = 'https://github.com/owner/repo/pull/42';

	const fakePRData = {
		meta: {
			number: 42,
			title: 'Fix typo',
			body: null,
			author: 'dev',
			head_branch: 'fix-typo',
			base_branch: 'main',
			commits: 1,
			additions: 1,
			deletions: 1,
			changed_files: 1,
			state: 'open',
			created_at: '2025-01-01T00:00:00Z',
			url: prUrl,
		},
		files: [],
		diff: '',
	};

	it('sends POST with correct body and Content-Type header', async () => {
		mockFetch.mockResolvedValue(jsonResponse(fakePRData));

		await fetchPR(prUrl);

		expect(mockFetch).toHaveBeenCalledOnce();
		const [url, opts] = mockFetch.mock.calls[0];
		expect(url).toContain('/api/pr/load');
		expect(opts.method).toBe('POST');
		expect(opts.headers['Content-Type']).toBe('application/json');
		expect(JSON.parse(opts.body)).toEqual({ url: prUrl });
	});

	it('returns parsed PRData on success', async () => {
		mockFetch.mockResolvedValue(jsonResponse(fakePRData));

		const result = await fetchPR(prUrl);

		expect(result).toEqual(fakePRData);
		expect(result.meta.number).toBe(42);
		expect(result.files).toEqual([]);
	});

	it('throws on HTTP error with detail message', async () => {
		mockFetch.mockResolvedValue(jsonResponse({ detail: 'PR not found' }, 404));

		await expect(fetchPR(prUrl)).rejects.toThrow('PR not found');
	});

	it('throws with fallback message when error body has no detail', async () => {
		mockFetch.mockResolvedValue({
			ok: false,
			status: 500,
			statusText: 'Internal Server Error',
			json: () => Promise.reject(new Error('not json')),
		});

		await expect(fetchPR(prUrl)).rejects.toThrow('Internal Server Error');
	});

	it('includes X-GitHub-Token header when githubToken is provided', async () => {
		mockFetch.mockResolvedValue(jsonResponse(fakePRData));

		await fetchPR(prUrl, 'ghp_testtoken123');

		const [, opts] = mockFetch.mock.calls[0];
		expect(opts.headers['X-GitHub-Token']).toBe('ghp_testtoken123');
	});

	it('does not include X-GitHub-Token header when token is omitted', async () => {
		mockFetch.mockResolvedValue(jsonResponse(fakePRData));

		await fetchPR(prUrl);

		const [, opts] = mockFetch.mock.calls[0];
		expect(opts.headers['X-GitHub-Token']).toBeUndefined();
	});
});

// ── triggerReview ────────────────────────────────────────────────────────────

describe('api-client — triggerReview', () => {
	const prUrl = 'https://github.com/owner/repo/pull/7';

	it('sends correct body with url and model', async () => {
		mockFetch.mockResolvedValue(jsonResponse({ job_id: 'job-abc' }));

		await triggerReview(prUrl, 'gpt-4o');

		const [url, opts] = mockFetch.mock.calls[0];
		expect(url).toContain('/api/review/run');
		expect(opts.method).toBe('POST');
		const body = JSON.parse(opts.body);
		expect(body.url).toBe(prUrl);
		expect(body.model).toBe('gpt-4o');
	});

	it('sends body without model when model is omitted', async () => {
		mockFetch.mockResolvedValue(jsonResponse({ job_id: 'job-abc' }));

		await triggerReview(prUrl);

		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body.url).toBe(prUrl);
		expect(body.model).toBeUndefined();
	});

	it('returns job_id on success', async () => {
		mockFetch.mockResolvedValue(jsonResponse({ job_id: 'job-xyz-999' }));

		const result = await triggerReview(prUrl);

		expect(result.job_id).toBe('job-xyz-999');
	});

	it('throws on HTTP error', async () => {
		mockFetch.mockResolvedValue(jsonResponse({ detail: 'Invalid PR' }, 400));

		await expect(triggerReview(prUrl)).rejects.toThrow('Invalid PR');
	});
});

// ── getReviewResults ─────────────────────────────────────────────────────────

describe('api-client — getReviewResults', () => {
	const fakeResult = {
		suite_id: 'suite-1',
		findings: [
			{
				id: 'f1',
				severity: 'P0',
				type: 'bug',
				title: 'Null dereference',
				description: 'x can be null',
				file: 'src/app.ts',
				line_start: 10,
				line_end: 10,
				suggestion: 'Add null check',
			},
		],
		summary: 'One critical bug found.',
		verdict: 'request_changes',
	};

	it('calls the correct URL with the job ID', async () => {
		mockFetch.mockResolvedValue(jsonResponse(fakeResult));

		await getReviewResults('job-abc-123');

		const [url] = mockFetch.mock.calls[0];
		expect(url).toContain('/api/review/results/job-abc-123');
	});

	it('returns parsed ReviewResult on success', async () => {
		mockFetch.mockResolvedValue(jsonResponse(fakeResult));

		const result = await getReviewResults('job-abc-123');

		expect(result.suite_id).toBe('suite-1');
		expect(result.findings).toHaveLength(1);
		expect(result.findings[0].severity).toBe('P0');
		expect(result.verdict).toBe('request_changes');
	});

	it('throws on HTTP error with status code', async () => {
		mockFetch.mockResolvedValue({
			ok: false,
			status: 404,
			json: () => Promise.resolve({}),
		});

		await expect(getReviewResults('nonexistent')).rejects.toThrow('Backend error 404');
	});
});
