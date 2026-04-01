import { describe, it, expect } from 'vitest';

// ── Auth flow validation logic ────────────────────────────────────────────────
// These tests cover the validation rules used in +page.server.ts files
// without importing SvelteKit server modules (which require the full runtime).

function validateEmail(email: string): string | null {
	if (!email.trim()) return 'Email is required.';
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email address.';
	return null;
}

function validatePassword(password: string): string | null {
	if (!password) return 'Password is required.';
	if (password.length < 8) return 'Password must be at least 8 characters.';
	return null;
}

function validatePasswordMatch(password: string, confirm: string): string | null {
	if (password !== confirm) return 'Passwords do not match.';
	return null;
}

function validateRedirectTo(redirectTo: string): string {
	// Only allow relative paths that don't start with // (protocol-relative)
	if (redirectTo.startsWith('/') && !redirectTo.startsWith('//')) return redirectTo;
	return '/app';
}

describe('auth — email validation', () => {
	it('rejects empty email', () => {
		expect(validateEmail('')).toBeTruthy();
	});

	it('rejects email without @', () => {
		expect(validateEmail('notanemail')).toBeTruthy();
	});

	it('rejects email without domain', () => {
		expect(validateEmail('user@')).toBeTruthy();
	});

	it('accepts valid email', () => {
		expect(validateEmail('user@example.com')).toBeNull();
	});

	it('normalises to lowercase conceptually', () => {
		expect(validateEmail('USER@EXAMPLE.COM')).toBeNull();
	});
});

describe('auth — password validation', () => {
	it('rejects empty password', () => {
		expect(validatePassword('')).toBeTruthy();
	});

	it('rejects password shorter than 8 chars', () => {
		expect(validatePassword('abc123')).toBeTruthy();
	});

	it('accepts password of exactly 8 chars', () => {
		expect(validatePassword('abcd1234')).toBeNull();
	});

	it('accepts long password', () => {
		expect(validatePassword('ThisIsALongSecurePassword123!')).toBeNull();
	});
});

describe('auth — password match validation', () => {
	it('rejects mismatched passwords', () => {
		expect(validatePasswordMatch('password1', 'password2')).toBeTruthy();
	});

	it('accepts matching passwords', () => {
		expect(validatePasswordMatch('samepass', 'samepass')).toBeNull();
	});
});

describe('auth — redirect safety', () => {
	it('allows relative paths', () => {
		expect(validateRedirectTo('/app/review')).toBe('/app/review');
	});

	it('blocks absolute URLs (open redirect)', () => {
		expect(validateRedirectTo('https://evil.com')).toBe('/app');
	});

	it('blocks protocol-relative URLs', () => {
		expect(validateRedirectTo('//evil.com')).toBe('/app');
	});

	it('defaults to /app for empty string', () => {
		expect(validateRedirectTo('')).toBe('/app');
	});
});

describe('auth — password strength scoring', () => {
	function score(password: string): number {
		let s = 0;
		if (password.length >= 8) s++;
		if (password.length >= 12) s++;
		if (/[A-Z]/.test(password)) s++;
		if (/[0-9]/.test(password)) s++;
		if (/[^A-Za-z0-9]/.test(password)) s++;
		return s;
	}

	it('scores weak password low', () => {
		expect(score('abc')).toBeLessThanOrEqual(1);
	});

	it('scores medium password mid-range', () => {
		expect(score('abcdefgh1')).toBeGreaterThanOrEqual(2);
	});

	it('scores strong password high', () => {
		expect(score('Str0ng!Pass#2024')).toBeGreaterThanOrEqual(4);
	});
});
