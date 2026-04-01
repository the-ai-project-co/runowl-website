import { describe, it, expect } from 'vitest';

// ── Eval: Validation logic quality — golden datasets ─────────────────────────
//
// These tests evaluate the correctness and coverage of validation functions
// against curated golden datasets. Each dataset contains expected outcomes
// for a variety of inputs, including edge cases and adversarial inputs.

// ── Re-implement validation functions (matching src logic) ───────────────────

function validatePRUrl(url: string): string | null {
	if (!url.trim()) return 'Please enter a GitHub PR URL.';
	const match = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
	if (!match) return 'Must be a GitHub PR URL: https://github.com/owner/repo/pull/123';
	return null;
}

function validateEmail(email: string): string | null {
	if (!email.trim()) return 'Email is required.';
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email address.';
	return null;
}

function scorePassword(password: string): number {
	let s = 0;
	if (password.length >= 8) s++;
	if (password.length >= 12) s++;
	if (/[A-Z]/.test(password)) s++;
	if (/[0-9]/.test(password)) s++;
	if (/[^A-Za-z0-9]/.test(password)) s++;
	return s;
}

function sanitiseRedirectPath(path: string): string {
	if (path.startsWith('/') && !path.startsWith('//')) return path;
	return '/app';
}

// ── PR URL validation golden dataset (20+ cases) ────────────────────────────

describe('eval — PR URL validation golden dataset', () => {
	const validUrls: [string, string][] = [
		['https://github.com/owner/repo/pull/1', 'simple PR #1'],
		['https://github.com/sveltejs/kit/pull/12345', 'five-digit PR number'],
		['https://github.com/my-org/my-repo/pull/42', 'hyphenated org and repo'],
		['https://github.com/a/b/pull/1', 'single-char owner and repo'],
		['https://github.com/owner/repo/pull/1/files', 'PR URL with /files suffix'],
		['https://github.com/owner/repo/pull/1/commits', 'PR URL with /commits suffix'],
		['https://github.com/owner/repo/pull/999999', 'large PR number'],
		['https://github.com/CAPS/REPO/pull/5', 'uppercase owner and repo'],
		['https://github.com/under_score/repo_name/pull/10', 'underscored names'],
		['https://github.com/owner/repo.js/pull/3', 'repo name with dot'],
	];

	it.each(validUrls)('accepts valid URL: %s (%s)', (url) => {
		expect(validatePRUrl(url)).toBeNull();
	});

	const invalidUrls: [string, string][] = [
		['', 'empty string'],
		['   ', 'whitespace only'],
		['not-a-url', 'plain text'],
		['https://gitlab.com/owner/repo/merge_requests/1', 'GitLab URL'],
		['https://github.com/owner/repo', 'missing /pull/ segment'],
		['https://github.com/owner/repo/pull/', 'missing PR number'],
		['https://github.com/owner/repo/pull/abc', 'non-numeric PR number'],
		['https://github.com/owner/repo/issues/5', 'issue URL, not PR'],
		['http://github.com/owner/repo/pull/1', 'HTTP instead of HTTPS'],
		['https://www.github.com/owner/repo/pull/1', 'www subdomain'],
		['ftp://github.com/owner/repo/pull/1', 'FTP protocol'],
		['https://github.com//repo/pull/1', 'empty owner segment'],
		['https://github.com/owner//pull/1', 'empty repo segment'],
	];

	it.each(invalidUrls)('rejects invalid URL: %s (%s)', (url) => {
		expect(validatePRUrl(url)).toBeTruthy();
	});
});

// ── Email validation golden dataset (15+ cases) ─────────────────────────────

describe('eval — email validation golden dataset', () => {
	const validEmails: [string, string][] = [
		['user@example.com', 'standard email'],
		['alice@company.co.uk', 'multi-segment TLD'],
		['name+tag@gmail.com', 'plus addressing'],
		['user.name@domain.com', 'dotted local part'],
		['a@b.co', 'minimal email'],
		['user@123.123.123.123', 'IP-style domain (passes regex)'],
		['user@sub.domain.org', 'subdomain'],
		['ALL_CAPS@DOMAIN.COM', 'uppercase email'],
	];

	it.each(validEmails)('accepts valid email: %s (%s)', (email) => {
		expect(validateEmail(email)).toBeNull();
	});

	const invalidEmails: [string, string][] = [
		['', 'empty string'],
		['   ', 'whitespace only'],
		['notanemail', 'no @ sign'],
		['user@', 'missing domain'],
		['@domain.com', 'missing local part'],
		['user@domain', 'missing TLD'],
		['user name@domain.com', 'space in local part'],
		['user@@domain.com', 'double @'],
	];

	it.each(invalidEmails)('rejects invalid email: %s (%s)', (email) => {
		expect(validateEmail(email)).toBeTruthy();
	});
});

// ── Password strength scoring golden dataset (10+ cases) ────────────────────

describe('eval — password strength scoring golden dataset', () => {
	const cases: [string, string, number, number][] = [
		// [password, label, minExpectedScore, maxExpectedScore]
		['', 'empty password', 0, 0],
		['abc', 'very short, lowercase only', 0, 0],
		['abcdefg', '7 chars, lowercase only', 0, 0],
		['abcdefgh', '8 chars, lowercase only', 1, 1],
		['abcdefgh1', '8 chars + digit', 2, 2],
		['Abcdefgh', '8 chars + uppercase', 2, 2],
		['Abcdefgh1', '8 chars + upper + digit', 3, 3],
		['abcdefghijkl', '12 chars, lowercase only', 2, 2],
		['Abcdefghijkl1', '12+ chars + upper + digit', 4, 4],
		['Str0ng!Pass#2024', '16 chars, all categories', 5, 5],
		['!!!!!!!!', '8 special chars only', 2, 2],
		['AAAAAAAAAAAA', '12 uppercase only', 3, 3],
	];

	it.each(cases)(
		'password "%s" (%s) scores between %d and %d',
		(password, _label, minScore, maxScore) => {
			const s = scorePassword(password);
			expect(s).toBeGreaterThanOrEqual(minScore);
			expect(s).toBeLessThanOrEqual(maxScore);
		}
	);
});

// ── Redirect path sanitisation golden dataset (10+ cases) ────────────────────

describe('eval — redirect path sanitisation golden dataset', () => {
	const safePaths: [string, string, string][] = [
		// [input, label, expected]
		['/app', 'app root', '/app'],
		['/app/review', 'nested app path', '/app/review'],
		['/app/pr/42', 'PR detail path', '/app/pr/42'],
		['/', 'root slash', '/'],
		['/settings', 'settings page', '/settings'],
		['/app?tab=findings', 'path with query string', '/app?tab=findings'],
		['/app#section', 'path with fragment', '/app#section'],
	];

	it.each(safePaths)('allows safe path: %s (%s) -> %s', (input, _label, expected) => {
		expect(sanitiseRedirectPath(input)).toBe(expected);
	});

	const dangerousPaths: [string, string][] = [
		['https://evil.com', 'absolute URL to external site'],
		['http://attacker.com/steal', 'HTTP external URL'],
		['//evil.com', 'protocol-relative URL'],
		['//evil.com/path', 'protocol-relative with path'],
		['', 'empty string'],
		['javascript:alert(1)', 'JavaScript URI XSS'],
		['data:text/html,<script>alert(1)</script>', 'data URI XSS'],
		['ftp://files.evil.com', 'FTP protocol injection'],
		['\\\\evil.com\\share', 'UNC path injection'],
		['evil.com/phish', 'relative URL without leading slash'],
	];

	it.each(dangerousPaths)('blocks dangerous redirect: %s (%s)', (input) => {
		expect(sanitiseRedirectPath(input)).toBe('/app');
	});
});
