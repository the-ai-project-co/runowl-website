/**
 * CI / demo seed data.
 * Set USE_MOCK_DATA=true in .env (or CI environment) to use these instead of Supabase.
 */

export const MOCK = Boolean(process.env.USE_MOCK_DATA === 'true');

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();

// ── Reviews ────────────────────────────────────────────────────────────────────
export const mockReviews = [
	{ id: 'r1', pr_url: 'https://github.com/acme/api/pull/142', pr_number: 142, repo: 'acme/api', findings_count: 7, status: 'done', created_at: daysAgo(0) },
	{ id: 'r2', pr_url: 'https://github.com/acme/api/pull/139', pr_number: 139, repo: 'acme/api', findings_count: 2, status: 'done', created_at: daysAgo(1) },
	{ id: 'r3', pr_url: 'https://github.com/acme/web/pull/88', pr_number: 88, repo: 'acme/web', findings_count: 0, status: 'done', created_at: daysAgo(2) },
	{ id: 'r4', pr_url: 'https://github.com/acme/api/pull/135', pr_number: 135, repo: 'acme/api', findings_count: 4, status: 'done', created_at: daysAgo(3) },
	{ id: 'r5', pr_url: 'https://github.com/acme/infra/pull/21', pr_number: 21, repo: 'acme/infra', findings_count: 1, status: 'done', created_at: daysAgo(4) },
	{ id: 'r6', pr_url: 'https://github.com/acme/web/pull/85', pr_number: 85, repo: 'acme/web', findings_count: 3, status: 'done', created_at: daysAgo(5) },
	{ id: 'r7', pr_url: 'https://github.com/acme/sdk/pull/14', pr_number: 14, repo: 'acme/sdk', findings_count: 0, status: 'done', created_at: daysAgo(6) },
	{ id: 'r8', pr_url: 'https://github.com/acme/api/pull/131', pr_number: 131, repo: 'acme/api', findings_count: 5, status: 'done', created_at: daysAgo(8) },
	{ id: 'r9', pr_url: 'https://github.com/acme/web/pull/82', pr_number: 82, repo: 'acme/web', findings_count: 2, status: 'done', created_at: daysAgo(10) },
	{ id: 'r10', pr_url: 'https://github.com/acme/api/pull/128', pr_number: 128, repo: 'acme/api', findings_count: 8, status: 'done', created_at: daysAgo(13) },
];

// ── Derived chart data from mockReviews ────────────────────────────────────────
export function buildMockChartData() {
	const activity: number[] = Array(14).fill(0);
	const fourteenDaysAgo = new Date(now - 13 * 86400000);
	fourteenDaysAgo.setHours(0, 0, 0, 0);

	for (const r of mockReviews) {
		const d = new Date(r.created_at);
		const idx = Math.floor((d.getTime() - fourteenDaysAgo.getTime()) / 86400000);
		if (idx >= 0 && idx < 14) activity[idx]++;
	}

	const findingsDist = { clean: 0, low: 0, medium: 0, high: 0 };
	for (const r of mockReviews) {
		if (r.findings_count === 0) findingsDist.clean++;
		else if (r.findings_count <= 2) findingsDist.low++;
		else if (r.findings_count <= 5) findingsDist.medium++;
		else findingsDist.high++;
	}

	const repoCounts: Record<string, number> = {};
	for (const r of mockReviews) {
		repoCounts[r.repo] = (repoCounts[r.repo] ?? 0) + 1;
	}
	const topRepos = Object.entries(repoCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([repo, count]) => ({ repo, count }));

	const thisWeek = mockReviews.filter((r) => new Date(r.created_at) >= new Date(now - 7 * 86400000)).length;
	const totalFindings = mockReviews.reduce((s, r) => s + r.findings_count, 0);

	return { activity, findingsDist, topRepos, thisWeek, totalFindings };
}

// ── Team members ───────────────────────────────────────────────────────────────
export const mockMembers = [
	{ id: 'm1', email: 'you@acme.com', role: 'admin', status: 'active', joined_at: daysAgo(30), reviews_count: 18 },
	{ id: 'm2', email: 'alice@acme.com', role: 'reviewer', status: 'active', joined_at: daysAgo(12), reviews_count: 7 },
	{ id: 'm3', email: 'bob@acme.com', role: 'viewer', status: 'pending', joined_at: daysAgo(0), reviews_count: 0 },
];

// ── Test suites ────────────────────────────────────────────────────────────────
export const mockSuites = [
	{ id: 's1', name: 'Auth module tests', repo: 'acme/api', last_run: daysAgo(0), status: 'passing', tests_count: 24, pass_count: 24, fail_count: 0, version: 3 },
	{ id: 's2', name: 'Payment flow tests', repo: 'acme/api', last_run: daysAgo(0), status: 'failing', tests_count: 18, pass_count: 15, fail_count: 3, version: 2 },
	{ id: 's3', name: 'UI smoke tests', repo: 'acme/web', last_run: null, status: 'never', tests_count: 8, pass_count: 0, fail_count: 0, version: 1 },
];

// ── PR meta (used by /api/pr/load in mock mode) ────────────────────────────────
export const mockPRMeta = {
	number: 142,
	title: 'feat: add rate limiting middleware to auth routes',
	body: 'This PR adds token bucket rate limiting to all `/auth/*` endpoints to prevent brute-force attacks.\n\n## Changes\n- Added `RateLimiter` class\n- Applied middleware to login, register, and reset-password routes\n- Tests in `auth.test.ts`',
	author: 'alice',
	repo: 'acme/api',
	head_branch: 'feat/rate-limiting',
	base_branch: 'main',
	commits: 4,
	additions: 187,
	deletions: 12,
	changed_files: 6,
	state: 'open' as const,
	created_at: daysAgo(1),
	url: 'https://github.com/acme/api/pull/142',
};

export const mockFiles = [
	{ filename: 'src/middleware/rateLimiter.ts', status: 'added', additions: 89, deletions: 0, patch: `@@ -0,0 +1,89 @@\n+export class RateLimiter {\n+  private counts = new Map<string, number>();\n+  constructor(private limit: number, private windowMs: number) {}\n+  check(key: string): boolean {\n+    const count = this.counts.get(key) ?? 0;\n+    if (count >= this.limit) return false;\n+    this.counts.set(key, count + 1);\n+    setTimeout(() => this.counts.delete(key), this.windowMs);\n+    return true;\n+  }\n+}`, blob_url: '' },
	{ filename: 'src/routes/auth/login.ts', status: 'modified', additions: 12, deletions: 3, patch: `@@ -1,10 +1,19 @@\n+import { RateLimiter } from '../middleware/rateLimiter';\n+const limiter = new RateLimiter(5, 60000);\n export async function login(req, res) {\n+  if (!limiter.check(req.ip)) {\n+    return res.status(429).json({ error: 'Too many requests' });\n+  }\n   // existing login logic\n }`, blob_url: '' },
	{ filename: 'src/routes/auth/register.ts', status: 'modified', additions: 8, deletions: 2, patch: `@@ -1,8 +1,14 @@\n+import { RateLimiter } from '../middleware/rateLimiter';\n+const limiter = new RateLimiter(3, 300000);\n export async function register(req, res) {\n+  if (!limiter.check(req.ip)) return res.status(429).send();\n   // existing register logic\n }`, blob_url: '' },
	{ filename: 'src/routes/auth/resetPassword.ts', status: 'modified', additions: 8, deletions: 2, patch: `@@ -1,6 +1,12 @@\n+import { RateLimiter } from '../middleware/rateLimiter';\n+const limiter = new RateLimiter(2, 600000);\n export async function resetPassword(req, res) {\n+  if (!limiter.check(req.ip)) return res.status(429).send();\n   // existing logic\n }`, blob_url: '' },
	{ filename: 'tests/auth.test.ts', status: 'modified', additions: 45, deletions: 5, patch: `@@ -20,0 +21,45 @@\n+describe('rate limiting', () => {\n+  it('should block after limit exceeded', async () => {\n+    for (let i = 0; i < 5; i++) await loginRequest();\n+    const res = await loginRequest();\n+    expect(res.status).toBe(429);\n+  });\n+});`, blob_url: '' },
	{ filename: 'README.md', status: 'modified', additions: 25, deletions: 0, patch: `@@ -10,0 +11,25 @@\n+## Rate Limiting\n+All auth routes are protected by token bucket rate limiting.\n+- Login: 5 req/min\n+- Register: 3 req/5min\n+- Reset password: 2 req/10min`, blob_url: '' },
];

// ── Test case results (keyed by suite_id) ─────────────────────────────────────
export const mockTestCases: Record<string, object[]> = {
	s1: [
		{ id: 'tc1', name: 'login() returns 200 with valid credentials', status: 'pass', type: 'unit', duration_ms: 42, framework: 'pytest' },
		{ id: 'tc2', name: 'login() returns 401 with invalid password', status: 'pass', type: 'unit', duration_ms: 38, framework: 'pytest' },
		{ id: 'tc3', name: 'login() returns 429 after rate limit exceeded', status: 'pass', type: 'unit', duration_ms: 55, framework: 'pytest' },
		{ id: 'tc4', name: 'register() creates user and returns 201', status: 'pass', type: 'unit', duration_ms: 91, framework: 'pytest' },
		{ id: 'tc5', name: 'register() returns 409 for duplicate email', status: 'pass', type: 'unit', duration_ms: 47, framework: 'pytest' },
		{ id: 'tc6', name: 'register() enforces rate limit (3 req/5min)', status: 'pass', type: 'integration', duration_ms: 61, framework: 'pytest' },
		{ id: 'tc7', name: 'resetPassword() sends email for known user', status: 'pass', type: 'unit', duration_ms: 84, framework: 'pytest' },
		{ id: 'tc8', name: 'resetPassword() returns 429 after 2 attempts', status: 'pass', type: 'integration', duration_ms: 53, framework: 'pytest' },
	],
	s2: [
		{ id: 'tc1', name: 'checkout() creates order with valid cart', status: 'pass', type: 'integration', duration_ms: 120, framework: 'jest' },
		{ id: 'tc2', name: 'checkout() applies discount code correctly', status: 'pass', type: 'unit', duration_ms: 88, framework: 'jest' },
		{ id: 'tc3', name: 'checkout() fails gracefully on payment timeout', status: 'fail', type: 'integration', duration_ms: 5012, framework: 'jest', error: 'Expected status 504, received 500. Payment gateway mock not properly configured.' },
		{ id: 'tc4', name: 'refund() reverses charge within 24h window', status: 'pass', type: 'unit', duration_ms: 77, framework: 'jest' },
		{ id: 'tc5', name: 'refund() rejects request outside window', status: 'pass', type: 'unit', duration_ms: 64, framework: 'jest' },
		{ id: 'tc6', name: 'webhook() verifies Stripe signature', status: 'fail', type: 'unit', duration_ms: 19, framework: 'jest', error: 'TypeError: Cannot read properties of undefined (reading "signature"). Missing STRIPE_WEBHOOK_SECRET in test env.' },
		{ id: 'tc7', name: 'webhook() idempotent on duplicate events', status: 'pass', type: 'unit', duration_ms: 45, framework: 'jest' },
		{ id: 'tc8', name: 'invoice() generates PDF for completed order', status: 'fail', type: 'unit', duration_ms: 203, framework: 'jest', error: 'PDFKit dependency missing in sandbox environment.' },
	],
	s3: [],
};

export const mockSuiteResults: Record<string, object> = {
	s1: {
		suite_id: 's1',
		pr_ref: 'acme/api#142',
		status: 'done',
		passed: 8,
		failed: 0,
		errors: 0,
		skipped: 0,
		total: 8,
		duration_ms: 471,
		cases: mockTestCases['s1'],
		video_url: null,
		replay_url: null,
	},
	s2: {
		suite_id: 's2',
		pr_ref: 'acme/api#139',
		status: 'done',
		passed: 5,
		failed: 3,
		errors: 0,
		skipped: 0,
		total: 8,
		duration_ms: 5628,
		cases: mockTestCases['s2'],
		video_url: null,
		replay_url: null,
	},
	s3: {
		suite_id: 's3',
		pr_ref: null,
		status: 'never',
		passed: 0,
		failed: 0,
		errors: 0,
		skipped: 0,
		total: 0,
		duration_ms: 0,
		cases: [],
		video_url: null,
		replay_url: null,
	},
};

export const mockFindings = [
	{ id: 'f1', severity: 'P0' as const, type: 'security' as const, title: 'Memory not cleared — Map grows unbounded', description: 'RateLimiter uses an in-memory Map with setTimeout cleanup. Under high load, the cleanup may not fire before OOM.', file: 'src/middleware/rateLimiter.ts', line_start: 3, line_end: 8, suggestion: 'Use a circular buffer or an external store (Redis) for rate limit counters.' },
	{ id: 'f2', severity: 'P1' as const, type: 'security' as const, title: 'IP spoofing via X-Forwarded-For', description: 'req.ip may read a spoofed X-Forwarded-For header if behind a load balancer without trust-proxy set.', file: 'src/routes/auth/login.ts', line_start: 4, line_end: 4, suggestion: "Set `app.set('trust proxy', 1)` and validate the proxy chain." },
	{ id: 'f3', severity: 'P1' as const, type: 'bug' as const, title: 'Race condition in count increment', description: 'Non-atomic read-modify-write on counts Map is unsafe in async contexts.', file: 'src/middleware/rateLimiter.ts', line_start: 5, line_end: 7, suggestion: 'Use an atomic counter or mutex.' },
	{ id: 'f4', severity: 'P2' as const, type: 'architecture' as const, title: 'Separate limiter instance per route leaks memory', description: 'Three separate RateLimiter instances are created — one per route file. A shared singleton is more efficient.', file: 'src/routes/auth/register.ts', line_start: 2, line_end: 2, suggestion: 'Export a shared limiter factory from the middleware module.' },
	{ id: 'f5', severity: 'P2' as const, type: 'security' as const, title: 'No rate limit on password reset verification step', description: 'The token verification endpoint is not covered by the new rate limiter.', file: 'src/routes/auth/resetPassword.ts', line_start: 1, line_end: 12, suggestion: 'Apply limiter to the verification route as well.' },
];
