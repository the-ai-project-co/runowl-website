import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MOCK, mockPRMeta, mockFiles } from '$lib/server/seed';

/** POST /api/pr/load — validate PR URL and proxy to backend (or parse via GitHub API) */
export const POST: RequestHandler = async ({ request, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) error(401, 'Unauthorized');

	const body = await request.json().catch(() => null);
	const prUrl: string = body?.url ?? '';

	// CI / demo mode
	if (MOCK) {
		return json({ meta: mockPRMeta, files: mockFiles });
	}

	// Validate GitHub PR URL format
	const match = prUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
	if (!match) {
		error(400, 'Invalid GitHub PR URL. Expected: https://github.com/owner/repo/pull/123');
	}

	const [, owner, repo, pullNumber] = match;

	// Fetch PR metadata from GitHub API (public repos don't need a token)
	const githubToken = process.env.GITHUB_TOKEN;
	const headers: Record<string, string> = {
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28',
	};
	if (githubToken) headers['Authorization'] = `Bearer ${githubToken}`;

	const [metaRes, filesRes] = await Promise.all([
		fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`, { headers }),
		fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=100`, {
			headers,
		}),
	]);

	if (metaRes.status === 404)
		error(404, 'Pull request not found. Check the URL or make sure the repo is public.');
	if (metaRes.status === 403) error(403, 'GitHub rate limit reached. Try again in a minute.');
	if (!metaRes.ok) error(502, `GitHub API error: ${metaRes.status}`);
	if (!filesRes.ok) error(502, `GitHub API error (files): ${filesRes.status}`);

	const [meta, files] = await Promise.all([metaRes.json(), filesRes.json()]);

	return json({
		meta: {
			number: meta.number,
			title: meta.title,
			body: meta.body,
			author: meta.user?.login ?? 'unknown',
			repo: `${owner}/${repo}`,
			head_branch: meta.head?.ref ?? '',
			base_branch: meta.base?.ref ?? '',
			commits: meta.commits,
			additions: meta.additions,
			deletions: meta.deletions,
			changed_files: meta.changed_files,
			state: meta.merged ? 'merged' : meta.state,
			created_at: meta.created_at,
			url: meta.html_url,
		},
		files: (Array.isArray(files) ? files : []).map((f: Record<string, unknown>) => ({
			filename: f.filename,
			status: f.status,
			additions: f.additions,
			deletions: f.deletions,
			patch: f.patch ?? null,
			blob_url: f.blob_url ?? '',
		})),
	});
};
