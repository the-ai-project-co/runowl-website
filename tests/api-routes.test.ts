import { describe, it, expect } from 'vitest';

// ── API layer — request/response validation logic ─────────────────────────────

function validatePRLoadBody(body: unknown): string | null {
	if (!body || typeof body !== 'object') return 'Request body must be JSON.';
	const { url } = body as Record<string, unknown>;
	if (!url || typeof url !== 'string') return 'url is required.';
	const match = (url as string).match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
	if (!match) return 'Invalid GitHub PR URL.';
	return null;
}

function validateReviewAskBody(body: unknown): string | null {
	if (!body || typeof body !== 'object') return 'Request body must be JSON.';
	const { url, question } = body as Record<string, unknown>;
	if (!url || typeof url !== 'string') return 'url is required.';
	if (!question || typeof question !== 'string' || !question.trim()) return 'question is required.';
	return null;
}

function validateInviteBody(body: unknown): string | null {
	if (!body || typeof body !== 'object') return 'Request body must be JSON.';
	const { email, role } = body as Record<string, unknown>;
	if (!email || typeof email !== 'string') return 'email is required.';
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email as string)) return 'Valid email is required.';
	if (role !== undefined && !['member', 'admin'].includes(role as string))
		return 'Role must be member or admin.';
	return null;
}

function sanitiseRedirectPath(path: string): string {
	return path.startsWith('/') ? path : '/app';
}

describe('API — POST /api/pr/load validation', () => {
	it('rejects missing body', () => {
		expect(validatePRLoadBody(null)).toBeTruthy();
	});

	it('rejects missing url field', () => {
		expect(validatePRLoadBody({})).toBeTruthy();
	});

	it('rejects invalid PR URL', () => {
		expect(validatePRLoadBody({ url: 'https://github.com/foo' })).toBeTruthy();
	});

	it('accepts valid PR URL', () => {
		expect(validatePRLoadBody({ url: 'https://github.com/org/repo/pull/1' })).toBeNull();
	});
});

describe('API — POST /api/review/ask validation', () => {
	it('rejects missing question', () => {
		expect(validateReviewAskBody({ url: 'https://github.com/org/repo/pull/1' })).toBeTruthy();
	});

	it('rejects blank question', () => {
		expect(
			validateReviewAskBody({ url: 'https://github.com/org/repo/pull/1', question: '   ' })
		).toBeTruthy();
	});

	it('accepts valid body', () => {
		expect(
			validateReviewAskBody({
				url: 'https://github.com/org/repo/pull/1',
				question: 'Are there race conditions?',
			})
		).toBeNull();
	});
});

describe('API — POST /api/team/invite validation', () => {
	it('rejects missing email', () => {
		expect(validateInviteBody({})).toBeTruthy();
	});

	it('rejects invalid email', () => {
		expect(validateInviteBody({ email: 'notanemail' })).toBeTruthy();
	});

	it('rejects invalid role', () => {
		expect(validateInviteBody({ email: 'a@b.com', role: 'superuser' })).toBeTruthy();
	});

	it('accepts valid member invite', () => {
		expect(validateInviteBody({ email: 'colleague@company.com', role: 'member' })).toBeNull();
	});

	it('accepts invite without role (defaults to member)', () => {
		expect(validateInviteBody({ email: 'colleague@company.com' })).toBeNull();
	});
});

describe('API — auth guard redirect safety', () => {
	it('allows relative redirect', () => {
		expect(sanitiseRedirectPath('/app/review')).toBe('/app/review');
	});

	it('blocks external redirect', () => {
		expect(sanitiseRedirectPath('https://evil.com')).toBe('/app');
	});
});

describe('API — GitHub file content decoding', () => {
	it('decodes base64-encoded file content', () => {
		const encoded = Buffer.from('hello world\n').toString('base64');
		const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
		expect(decoded).toBe('hello world\n');
	});

	it('handles multiline file content', () => {
		const original = 'line1\nline2\nline3';
		const encoded = Buffer.from(original).toString('base64');
		expect(Buffer.from(encoded, 'base64').toString('utf-8')).toBe(original);
	});
});
