/**
 * Typed client for the RunOwl Python backend.
 * The BFF routes in /api/* proxy to this.
 */

const BACKEND_URL = process.env.RUNOWL_BACKEND_URL ?? 'http://localhost:8000';

export interface PRFile {
	filename: string;
	status: 'added' | 'modified' | 'removed' | 'renamed';
	additions: number;
	deletions: number;
	patch: string | null;
	blob_url: string;
}

export interface PRMeta {
	number: number;
	title: string;
	body: string | null;
	author: string;
	head_branch: string;
	base_branch: string;
	commits: number;
	additions: number;
	deletions: number;
	changed_files: number;
	state: 'open' | 'closed' | 'merged';
	created_at: string;
	url: string;
}

export interface PRData {
	meta: PRMeta;
	files: PRFile[];
	diff: string;
}

export interface Finding {
	id: string;
	severity: 'P0' | 'P1' | 'P2' | 'P3';
	type: 'bug' | 'security' | 'style' | 'architecture';
	title: string;
	description: string;
	file: string;
	line_start: number;
	line_end: number;
	suggestion: string | null;
}

export interface ReviewResult {
	suite_id: string;
	findings: Finding[];
	summary: string;
	verdict: 'approve' | 'request_changes' | 'comment';
}

export interface TestSuiteResult {
	suite_id: string;
	total: number;
	passed: number;
	failed: number;
	errors: number;
	all_passed: boolean;
}

export async function fetchPR(prUrl: string, githubToken?: string): Promise<PRData> {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (githubToken) headers['X-GitHub-Token'] = githubToken;

	const res = await fetch(`${BACKEND_URL}/api/pr/load`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ url: prUrl }),
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({ detail: res.statusText }));
		throw new Error(err.detail ?? `Backend error ${res.status}`);
	}

	return res.json();
}

export async function triggerReview(prUrl: string, model?: string): Promise<{ job_id: string }> {
	const res = await fetch(`${BACKEND_URL}/api/review/run`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ url: prUrl, model }),
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({ detail: res.statusText }));
		throw new Error(err.detail ?? `Backend error ${res.status}`);
	}

	return res.json();
}

export async function getReviewResults(jobId: string): Promise<ReviewResult> {
	const res = await fetch(`${BACKEND_URL}/api/review/results/${jobId}`);
	if (!res.ok) throw new Error(`Backend error ${res.status}`);
	return res.json();
}
