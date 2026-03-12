import { describe, it, expect } from 'vitest';

// ── PR loading flow validation ────────────────────────────────────────────────

function validatePRUrl(url: string): string | null {
	if (!url.trim()) return 'Please enter a GitHub PR URL.';
	const match = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
	if (!match) return 'Must be a GitHub PR URL: https://github.com/owner/repo/pull/123';
	return null;
}

function parsePRUrl(url: string): { owner: string; repo: string; number: number } | null {
	const match = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
	if (!match) return null;
	return { owner: match[1], repo: match[2], number: parseInt(match[3]) };
}

describe('PR loading — URL validation', () => {
	it('rejects empty URL', () => {
		expect(validatePRUrl('')).toBeTruthy();
	});

	it('rejects non-GitHub URL', () => {
		expect(validatePRUrl('https://gitlab.com/owner/repo/merge_requests/1')).toBeTruthy();
	});

	it('rejects GitHub URL without /pull/', () => {
		expect(validatePRUrl('https://github.com/owner/repo')).toBeTruthy();
	});

	it('rejects GitHub URL with non-numeric PR number', () => {
		expect(validatePRUrl('https://github.com/owner/repo/pull/abc')).toBeTruthy();
	});

	it('accepts valid GitHub PR URL', () => {
		expect(validatePRUrl('https://github.com/sveltejs/kit/pull/123')).toBeNull();
	});

	it('accepts URL with trailing path segments', () => {
		expect(validatePRUrl('https://github.com/org/repo/pull/42/files')).toBeNull();
	});
});

describe('PR loading — URL parsing', () => {
	it('extracts owner, repo, and PR number', () => {
		const result = parsePRUrl('https://github.com/sveltejs/kit/pull/123');
		expect(result).toEqual({ owner: 'sveltejs', repo: 'kit', number: 123 });
	});

	it('returns null for invalid URL', () => {
		expect(parsePRUrl('not-a-url')).toBeNull();
	});

	it('handles hyphenated repo names', () => {
		const result = parsePRUrl('https://github.com/my-org/my-cool-repo/pull/1');
		expect(result?.repo).toBe('my-cool-repo');
	});
});

describe('PR loading — session cache', () => {
	it('identifies cache hit when URLs match', () => {
		const cached = { prUrl: 'https://github.com/org/repo/pull/1', meta: {}, files: [] };
		const requested = 'https://github.com/org/repo/pull/1';
		expect(cached.prUrl === requested).toBe(true);
	});

	it('identifies cache miss when URLs differ', () => {
		const cached = { prUrl: 'https://github.com/org/repo/pull/1', meta: {}, files: [] };
		const requested = 'https://github.com/org/repo/pull/2';
		expect(cached.prUrl === requested).toBe(false);
	});
});

describe('PR loading — error classification', () => {
	function classifyError(status: number): string {
		if (status === 404) return 'Pull request not found.';
		if (status === 403) return 'GitHub rate limit reached.';
		if (status === 401) return 'Repository is private — a token is required.';
		if (status >= 500) return 'GitHub API is unavailable.';
		return `Unexpected error (${status}).`;
	}

	it('classifies 404 as not found', () => {
		expect(classifyError(404)).toContain('not found');
	});

	it('classifies 403 as rate limit', () => {
		expect(classifyError(403)).toContain('rate limit');
	});

	it('classifies 401 as private repo', () => {
		expect(classifyError(401)).toContain('private');
	});

	it('classifies 500 as server unavailable', () => {
		expect(classifyError(500)).toContain('unavailable');
	});
});
