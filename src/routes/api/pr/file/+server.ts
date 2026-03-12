import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * GET /api/pr/file?owner=&repo=&ref=&path=
 * Fetches raw file contents from GitHub for the given ref.
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) error(401, 'Unauthorized');

	const owner = url.searchParams.get('owner') ?? '';
	const repo = url.searchParams.get('repo') ?? '';
	const ref = url.searchParams.get('ref') ?? 'HEAD';
	const path = url.searchParams.get('path') ?? '';

	if (!owner || !repo || !path) {
		error(400, 'owner, repo, and path are required');
	}

	const githubToken = process.env.GITHUB_TOKEN;
	const headers: Record<string, string> = {
		Accept: 'application/vnd.github.raw+json',
		'X-GitHub-Api-Version': '2022-11-28',
	};
	if (githubToken) headers['Authorization'] = `Bearer ${githubToken}`;

	const encodedPath = path.split('/').map(encodeURIComponent).join('/');
	const res = await fetch(
		`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`,
		{ headers }
	);

	if (res.status === 404) error(404, 'File not found');
	if (res.status === 403) error(403, 'GitHub rate limit or access denied');
	if (!res.ok) error(502, `GitHub API error: ${res.status}`);

	// GitHub returns base64-encoded content for files
	const data = await res.json();
	const content =
		data.encoding === 'base64'
			? Buffer.from(data.content, 'base64').toString('utf-8')
			: (data.content ?? '');

	return json({ path, ref, content, size: data.size ?? 0 });
};
