import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MOCK, mockReviews, buildMockChartData } from '$lib/server/seed';

export const GET: RequestHandler = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) error(401, 'Unauthorized');

	// CI / demo mode — return seed data without hitting Supabase
	if (MOCK) {
		const { activity, findingsDist, topRepos, thisWeek, totalFindings } = buildMockChartData();
		return json({
			reviews: mockReviews,
			total: mockReviews.length,
			total_findings: totalFindings,
			this_week: thisWeek,
			activity,
			findings_dist: findingsDist,
			top_repos: topRepos,
		});
	}

	const { data, error: sbError } = await locals.supabase
		.from('reviews')
		.select('id, pr_url, pr_number, repo, findings_count, status, created_at')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })
		.limit(50);

	if (sbError) {
		// Table may not exist yet — return empty list gracefully
		return json({ reviews: [], total: 0, total_findings: 0, this_week: 0 });
	}

	const reviews = data ?? [];
	const now = new Date();
	const weekAgo = new Date(now.getTime() - 7 * 86400000);
	const thisWeek = reviews.filter((r) => new Date(r.created_at) >= weekAgo).length;
	const totalFindings = reviews.reduce((sum, r) => sum + (r.findings_count ?? 0), 0);

	// --- Chart data ---

	// Activity: PRs per day for last 14 days (index 0 = oldest)
	const activity: number[] = Array(14).fill(0);
	const fourteenDaysAgo = new Date(now.getTime() - 13 * 86400000);
	fourteenDaysAgo.setHours(0, 0, 0, 0);
	for (const r of reviews) {
		const d = new Date(r.created_at);
		const dayIndex = Math.floor((d.getTime() - fourteenDaysAgo.getTime()) / 86400000);
		if (dayIndex >= 0 && dayIndex < 14) activity[dayIndex]++;
	}

	// Findings distribution: clean (0), low (1-2), medium (3-5), high (6+)
	const findingsDist = { clean: 0, low: 0, medium: 0, high: 0 };
	for (const r of reviews) {
		const n = r.findings_count ?? 0;
		if (n === 0) findingsDist.clean++;
		else if (n <= 2) findingsDist.low++;
		else if (n <= 5) findingsDist.medium++;
		else findingsDist.high++;
	}

	// Top repos: by review count (top 5)
	const repoCounts: Record<string, number> = {};
	for (const r of reviews) {
		repoCounts[r.repo] = (repoCounts[r.repo] ?? 0) + 1;
	}
	const topRepos = Object.entries(repoCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([repo, count]) => ({ repo, count }));

	return json({
		reviews,
		total: reviews.length,
		total_findings: totalFindings,
		this_week: thisWeek,
		activity,
		findings_dist: findingsDist,
		top_repos: topRepos,
	});
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
