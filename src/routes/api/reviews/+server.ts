import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MOCK, mockReviews, buildMockChartData } from '$lib/server/seed';

export const GET: RequestHandler = async ({ url, locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) error(401, 'Unauthorized');

	// Range param: 7d | 30d | 90d (default 30d)
	const rangeParam = url.searchParams.get('range') ?? '30d';
	const rangeDays = rangeParam === '7d' ? 7 : rangeParam === '90d' ? 90 : 30;

	// CI / demo mode — return seed data without hitting Supabase
	if (MOCK) {
		const { activity, findingsDist, topRepos, thisWeek, totalFindings } = buildMockChartData();
		// Trim/expand activity array to match requested range
		const rangeActivity = Array(rangeDays).fill(0).map((_, i) => activity[i] ?? 0);
		return json({
			reviews: mockReviews,
			total: mockReviews.length,
			totalFindings,
			thisWeek,
			activity: rangeActivity,
			findingsDist,
			topRepos,
		});
	}

	const since = new Date(Date.now() - rangeDays * 86400000).toISOString();

	const { data, error: sbError } = await locals.supabase
		.from('reviews')
		.select('id, pr_url, pr_number, repo, findings_count, status, created_at')
		.eq('user_id', user.id)
		.gte('created_at', since)
		.order('created_at', { ascending: false })
		.limit(500);

	if (sbError) {
		return json({ reviews: [], total: 0, totalFindings: 0, thisWeek: 0, activity: Array(rangeDays).fill(0), findingsDist: { clean: 0, low: 0, medium: 0, high: 0 }, topRepos: [] });
	}

	const reviews = data ?? [];
	const now = new Date();
	const weekAgo = new Date(now.getTime() - 7 * 86400000);
	const thisWeek = reviews.filter((r) => new Date(r.created_at) >= weekAgo).length;
	const totalFindings = reviews.reduce((sum, r) => sum + (r.findings_count ?? 0), 0);

	// Activity: PRs per day for requested range (index 0 = oldest)
	const activity: number[] = Array(rangeDays).fill(0);
	const rangeStart = new Date(now.getTime() - (rangeDays - 1) * 86400000);
	rangeStart.setHours(0, 0, 0, 0);
	for (const r of reviews) {
		const d = new Date(r.created_at);
		const dayIndex = Math.floor((d.getTime() - rangeStart.getTime()) / 86400000);
		if (dayIndex >= 0 && dayIndex < rangeDays) activity[dayIndex]++;
	}

	const findingsDist = { clean: 0, low: 0, medium: 0, high: 0 };
	for (const r of reviews) {
		const n = r.findings_count ?? 0;
		if (n === 0) findingsDist.clean++;
		else if (n <= 2) findingsDist.low++;
		else if (n <= 5) findingsDist.medium++;
		else findingsDist.high++;
	}

	const repoCounts: Record<string, number> = {};
	for (const r of reviews) repoCounts[r.repo] = (repoCounts[r.repo] ?? 0) + 1;
	const topRepos = Object.entries(repoCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([repo, count]) => ({ repo, count }));

	return json({ reviews, total: reviews.length, totalFindings, thisWeek, activity, findingsDist, topRepos });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const { user } = await locals.safeGetSession();
	if (!user) error(401, 'Unauthorized');

	const body = await request.json();
	const { pr_url, pr_number, repo, findings_count, status } = body as {
		pr_url: string;
		pr_number: number;
		repo: string;
		findings_count: number;
		status: string;
	};

	const { data, error: sbError } = await locals.supabase
		.from('reviews')
		.insert({ user_id: user.id, pr_url, pr_number, repo, findings_count, status })
		.select('id')
		.single();

	if (sbError) {
		// Silently fail if table doesn't exist — don't break the review flow
		return json({ ok: false, error: sbError.message });
	}

	return json({ ok: true, id: data?.id });
};
