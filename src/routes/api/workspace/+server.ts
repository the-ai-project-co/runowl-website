import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MOCK } from '$lib/server/seed';

/** GET /api/workspace — list workspaces for the authenticated user */
export const GET: RequestHandler = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) error(401, 'Unauthorized');

	if (MOCK) {
		return json({
			workspaces: [
				{ id: 'ws-1', name: 'Acme Corp', slug: 'acme', role: 'owner', member_count: 3, created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
			],
			current: 'ws-1',
		});
	}

	const { data: memberships } = await locals.supabase
		.from('workspace_members')
		.select('workspace_id, role, workspaces(id, name, slug, created_at)')
		.eq('user_id', user.id);

	// Also fetch workspaces the user owns
	const { data: owned } = await locals.supabase
		.from('workspaces')
		.select('id, name, slug, created_at')
		.eq('owner_id', user.id);

	const workspaces = [
		...(owned ?? []).map((w) => ({ ...w, role: 'owner' })),
		...(memberships ?? []).map((m) => {
			const ws = (m.workspaces as unknown) as { id: string; name: string; slug: string; created_at: string } | null;
			return { id: ws?.id, name: ws?.name, slug: ws?.slug, created_at: ws?.created_at, role: m.role };
		}),
	];

	return json({ workspaces, current: workspaces[0]?.id ?? null });
};

/** POST /api/workspace — create a new workspace */
export const POST: RequestHandler = async ({ request, locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) error(401, 'Unauthorized');

	const body = await request.json().catch(() => null);
	const name: string = (body?.name ?? '').trim();
	const slug: string = (body?.slug ?? name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')).trim();

	if (!name) error(400, 'Workspace name is required');
	if (!slug || !/^[a-z0-9-]+$/.test(slug)) error(400, 'Slug must be lowercase letters, numbers, and hyphens');

	if (MOCK) {
		return json({ ok: true, workspace: { id: crypto.randomUUID(), name, slug, role: 'owner' } }, { status: 201 });
	}

	const { data, error: dbError } = await locals.supabase
		.from('workspaces')
		.insert({ name, slug, owner_id: user.id })
		.select('id, name, slug')
		.single();

	if (dbError) {
		if (dbError.code === '23505') error(409, 'A workspace with this slug already exists');
		console.error('workspace create error:', dbError);
		error(500, 'Failed to create workspace');
	}

	return json({ ok: true, workspace: { ...data, role: 'owner' } }, { status: 201 });
};
