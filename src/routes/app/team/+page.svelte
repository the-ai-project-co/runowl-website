<script lang="ts">
	import { onMount } from 'svelte';
	import { UserPlus, MoreHorizontal, Mail, Shield, Eye, X, Check, Clock } from 'lucide-svelte';

	interface Member {
		id: string;
		email: string;
		role: 'admin' | 'reviewer' | 'viewer';
		status: 'active' | 'pending';
		joined_at: string;
		reviews_count: number;
		avatar?: string;
	}

	// Demo members (replace with API call once backend has team endpoints)
	const demoMembers: Member[] = [
		{
			id: '1',
			email: 'you@example.com',
			role: 'admin',
			status: 'active',
			joined_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
			reviews_count: 18,
		},
		{
			id: '2',
			email: 'alice@example.com',
			role: 'reviewer',
			status: 'active',
			joined_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
			reviews_count: 7,
		},
		{
			id: '3',
			email: 'bob@example.com',
			role: 'viewer',
			status: 'pending',
			joined_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
			reviews_count: 0,
		},
	];

	let members = $state<Member[]>([]);
	let loading = $state(true);

	// Invite modal state
	let showInvite = $state(false);
	let inviteEmail = $state('');
	let inviteRole = $state<'reviewer' | 'viewer'>('reviewer');
	let inviteError = $state('');
	let inviteLoading = $state(false);
	let inviteSuccess = $state(false);

	// Role menu state
	let openMenuId = $state<string | null>(null);

	onMount(() => {
		// Simulate loading
		setTimeout(() => {
			members = demoMembers;
			loading = false;
		}, 400);
	});

	function formatDate(iso: string) {
		const d = new Date(iso);
		const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 30) return `${diffDays}d ago`;
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function initials(email: string) {
		return email.slice(0, 2).toUpperCase();
	}

	function avatarColor(email: string) {
		const colors = [
			'#6366f1', '#8b5cf6', '#ec4899', '#f97316',
			'#10b981', '#3b82f6', '#14b8a6', '#f59e0b',
		];
		let hash = 0;
		for (const c of email) hash = (hash * 31 + c.charCodeAt(0)) % colors.length;
		return colors[hash];
	}

	const roleOptions = [
		{ value: 'admin', label: 'Admin', hint: 'Full access' },
		{ value: 'reviewer', label: 'Reviewer', hint: 'Run reviews, view results' },
		{ value: 'viewer', label: 'Viewer', hint: 'View results only' },
	] as const;

	function changeRole(id: string, role: Member['role']) {
		members = members.map((m) => (m.id === id ? { ...m, role } : m));
		openMenuId = null;
	}

	function removeMember(id: string) {
		members = members.filter((m) => m.id !== id);
		openMenuId = null;
	}

	async function submitInvite() {
		inviteError = '';
		if (!inviteEmail.trim()) {
			inviteError = 'Please enter an email address.';
			return;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())) {
			inviteError = 'Please enter a valid email address.';
			return;
		}
		if (members.some((m) => m.email === inviteEmail.trim())) {
			inviteError = 'This person is already on your team.';
			return;
		}
		inviteLoading = true;
		// Simulate API call
		await new Promise((r) => setTimeout(r, 800));
		members = [
			...members,
			{
				id: crypto.randomUUID(),
				email: inviteEmail.trim(),
				role: inviteRole,
				status: 'pending',
				joined_at: new Date().toISOString(),
				reviews_count: 0,
			},
		];
		inviteLoading = false;
		inviteSuccess = true;
		setTimeout(() => {
			inviteSuccess = false;
			showInvite = false;
			inviteEmail = '';
			inviteRole = 'reviewer';
		}, 1500);
	}

	function closeInvite() {
		showInvite = false;
		inviteEmail = '';
		inviteError = '';
		inviteRole = 'reviewer';
		inviteSuccess = false;
	}

	function onBackdrop(e: MouseEvent) {
		if ((e.target as HTMLElement).classList.contains('modal-backdrop')) closeInvite();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			closeInvite();
			openMenuId = null;
		}
	}

	function closeMenus(e: MouseEvent) {
		if (!(e.target as HTMLElement).closest('.role-menu-wrap')) {
			openMenuId = null;
		}
	}

	const activeCount = $derived(members.filter((m) => m.status === 'active').length);
	const pendingCount = $derived(members.filter((m) => m.status === 'pending').length);
</script>

<svelte:window onkeydown={onKeydown} onclick={closeMenus} />

<svelte:head>
	<title>Team — RunOwl</title>
</svelte:head>

<div class="team-page">
	<!-- Header -->
	<div class="team-head">
		<div>
			<h1 class="team-title">Team</h1>
			<p class="team-sub">
				{#if !loading}
					{activeCount} active member{activeCount !== 1 ? 's' : ''}
					{#if pendingCount > 0}
						· {pendingCount} pending invite{pendingCount !== 1 ? 's' : ''}
					{/if}
				{:else}
					Manage team members and roles
				{/if}
			</p>
		</div>
		<button class="invite-btn" onclick={() => (showInvite = true)}>
			<UserPlus size={14} strokeWidth={2.5} />
			Invite member
		</button>
	</div>

	<!-- Role legend -->
	<div class="role-legend">
		{#each roleOptions as opt}
			<div class="legend-item">
				<span class="legend-role role-{opt.value}">{opt.label}</span>
				<span class="legend-hint">{opt.hint}</span>
			</div>
		{/each}
	</div>

	<!-- Member table -->
	<div class="member-card">
		{#if loading}
			{#each Array(3) as _, i (i)}
				<div class="skel-row"></div>
			{/each}
		{:else}
			<table class="member-table">
				<thead>
					<tr>
						<th>Member</th>
						<th>Role</th>
						<th>Reviews</th>
						<th>Joined</th>
						<th>Status</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each members as m (m.id)}
						<tr class="member-row">
							<td>
								<div class="member-info">
									<span class="avatar" style="background: {avatarColor(m.email)}">
										{initials(m.email)}
									</span>
									<span class="member-email">{m.email}</span>
								</div>
							</td>
							<td>
								<div class="role-menu-wrap">
									<button
										class="role-pill role-{m.role}"
										onclick={(e) => {
											e.stopPropagation();
											openMenuId = openMenuId === m.id ? null : m.id;
										}}
									>
										{#if m.role === 'admin'}
											<Shield size={11} />
										{/if}
										{roleOptions.find((r) => r.value === m.role)?.label}
										<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
									</button>
									{#if openMenuId === m.id}
										<div class="role-dropdown">
											{#each roleOptions as opt}
												<button
													class="role-opt"
													class:role-opt-active={m.role === opt.value}
													onclick={() => changeRole(m.id, opt.value)}
												>
													<span class="opt-label">{opt.label}</span>
													<span class="opt-hint">{opt.hint}</span>
													{#if m.role === opt.value}
														<Check size={12} color="var(--accent)" />
													{/if}
												</button>
											{/each}
											<div class="role-divider"></div>
											<button class="role-opt opt-remove" onclick={() => removeMember(m.id)}>
												<X size={12} />
												Remove from team
											</button>
										</div>
									{/if}
								</div>
							</td>
							<td class="td-num">{m.reviews_count}</td>
							<td class="td-date">{formatDate(m.joined_at)}</td>
							<td>
								{#if m.status === 'pending'}
									<span class="status-badge badge-pending">
										<Clock size={10} />
										Pending
									</span>
								{:else}
									<span class="status-badge badge-active">
										<span class="active-dot"></span>
										Active
									</span>
								{/if}
							</td>
							<td>
								<button
									class="more-btn"
									onclick={(e) => {
										e.stopPropagation();
										openMenuId = openMenuId === m.id ? null : m.id;
									}}
									aria-label="Member options"
								>
									<MoreHorizontal size={15} />
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>

<!-- Invite modal -->
{#if showInvite}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={onBackdrop} role="dialog" aria-modal="true" aria-label="Invite team member" tabindex="-1">
		<div class="modal">
			<div class="modal-head">
				<div class="modal-title-row">
					<span class="modal-icon">
						<UserPlus size={15} color="var(--accent)" />
					</span>
					<h2 class="modal-title">Invite team member</h2>
				</div>
				<button class="close-btn" onclick={closeInvite} aria-label="Close">
					<X size={15} />
				</button>
			</div>

			<div class="modal-body">
				{#if inviteSuccess}
					<div class="invite-success">
						<Check size={24} color="var(--green)" />
						<span>Invite sent!</span>
					</div>
				{:else}
					<label class="field-label" for="invite-email">Email address</label>
					<div class="input-wrap" class:input-error={!!inviteError}>
						<Mail size={14} color="var(--muted)" />
						<input
							id="invite-email"
							type="email"
							class="invite-input"
							placeholder="teammate@example.com"
							bind:value={inviteEmail}
							oninput={() => (inviteError = '')}
						/>
					</div>
					{#if inviteError}
						<p class="error-msg">{inviteError}</p>
					{/if}

					<label class="field-label" for="invite-role">Role</label>
					<div class="role-select-group">
						{#each roleOptions.filter((r) => r.value !== 'admin') as opt}
							<label class="role-radio" class:role-radio-active={inviteRole === opt.value}>
								<input
									type="radio"
									name="invite-role"
									value={opt.value}
									bind:group={inviteRole}
								/>
								<span class="radio-label">{opt.label}</span>
								<span class="radio-hint">{opt.hint}</span>
							</label>
						{/each}
					</div>
				{/if}
			</div>

			{#if !inviteSuccess}
				<div class="modal-foot">
					<button class="btn-ghost" onclick={closeInvite}>Cancel</button>
					<button class="btn-primary" onclick={submitInvite} disabled={inviteLoading}>
						{#if inviteLoading}
							<span class="spinner"></span>
							Sending…
						{:else}
							Send invite
						{/if}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.team-page {
		padding: 2rem 2.5rem 3rem;
		max-width: 900px;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	/* Header */
	.team-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}
	.team-title {
		font-size: 1.45rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		color: var(--text);
		margin-bottom: 0.2rem;
	}
	.team-sub { font-size: 0.82rem; color: var(--muted); }

	.invite-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: var(--accent);
		color: #fff;
		border: none;
		padding: 0.5rem 1.1rem;
		border-radius: 8px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		flex-shrink: 0;
		box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 28%, transparent);
		transition: opacity 0.15s, transform 0.15s;
	}
	.invite-btn:hover { opacity: 0.9; transform: translateY(-1px); }

	/* Role legend */
	.role-legend {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
	}
	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.legend-role {
		font-size: 0.7rem;
		font-weight: 700;
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.legend-hint {
		font-size: 0.75rem;
		color: var(--muted);
	}

	/* Member card / table */
	.member-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}

	.skel-row {
		height: 56px;
		border-bottom: 1px solid var(--border);
		background: linear-gradient(90deg, var(--surface) 25%, var(--surface-2) 50%, var(--surface) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}
	.skel-row:last-child { border-bottom: none; }
	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	.member-table {
		width: 100%;
		border-collapse: collapse;
	}
	.member-table th {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
		padding: 0.65rem 1rem;
		text-align: left;
		border-bottom: 1px solid var(--border);
		background: var(--surface-2);
	}
	.member-table th:last-child { width: 36px; }
	.member-row td {
		padding: 0.85rem 1rem;
		border-bottom: 1px solid var(--border);
		vertical-align: middle;
	}
	.member-row:last-child td { border-bottom: none; }

	.member-info {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}
	.avatar {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.72rem;
		font-weight: 700;
		color: #fff;
		flex-shrink: 0;
	}
	.member-email {
		font-size: 0.83rem;
		color: var(--text);
	}

	.td-num {
		font-size: 0.83rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.td-date {
		font-size: 0.78rem;
		color: var(--muted);
		white-space: nowrap;
	}

	/* Role pill + dropdown */
	.role-menu-wrap { position: relative; display: inline-block; }

	.role-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.72rem;
		font-weight: 700;
		padding: 0.2rem 0.5rem;
		border-radius: 5px;
		border: none;
		cursor: pointer;
		font-family: inherit;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		transition: opacity 0.12s;
	}
	.role-pill:hover { opacity: 0.8; }

	/* Role colours */
	.role-admin, .legend-role.role-admin {
		background: color-mix(in srgb, var(--red) 12%, transparent);
		color: var(--red);
	}
	.role-reviewer, .legend-role.role-reviewer {
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		color: var(--accent);
	}
	.role-viewer, .legend-role.role-viewer {
		background: color-mix(in srgb, var(--muted) 12%, transparent);
		color: var(--muted);
	}

	.role-dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 9px;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
		z-index: 200;
		min-width: 180px;
		padding: 0.35rem;
		animation: popIn 0.13s cubic-bezier(0.16, 1, 0.3, 1);
	}
	@keyframes popIn {
		from { opacity: 0; transform: translateY(-4px) scale(0.97); }
	}
	.role-opt {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		width: 100%;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem 0.65rem;
		border-radius: 6px;
		font-family: inherit;
		text-align: left;
		transition: background 0.1s;
	}
	.role-opt:hover { background: var(--surface-2); }
	.role-opt-active { color: var(--accent); }
	.opt-label {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text);
		flex: 1;
	}
	.opt-hint {
		font-size: 0.72rem;
		color: var(--muted);
	}
	.role-divider {
		height: 1px;
		background: var(--border);
		margin: 0.25rem 0;
	}
	.opt-remove {
		color: var(--red);
		font-size: 0.8rem;
		font-weight: 500;
		gap: 0.5rem;
	}
	.opt-remove .opt-label { color: var(--red); }

	/* Status badges */
	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.badge-active {
		background: color-mix(in srgb, var(--green) 12%, transparent);
		color: var(--green);
	}
	.active-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--green);
	}
	.badge-pending {
		background: color-mix(in srgb, var(--yellow) 12%, transparent);
		color: var(--yellow);
	}

	.more-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--muted);
		display: flex;
		align-items: center;
		padding: 0.25rem;
		border-radius: 5px;
		transition: color 0.12s, background 0.12s;
	}
	.more-btn:hover { color: var(--text); background: var(--surface-2); }

	/* Invite modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 300;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		animation: fadeIn 0.15s ease;
	}
	@keyframes fadeIn { from { opacity: 0; } }

	.modal {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		width: 100%;
		max-width: 440px;
		box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
		animation: slideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
		overflow: hidden;
	}
	@keyframes slideUp {
		from { opacity: 0; transform: translateY(12px) scale(0.98); }
	}

	.modal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.1rem 1.25rem 0;
	}
	.modal-title-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.modal-icon {
		width: 30px;
		height: 30px;
		border-radius: 8px;
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.modal-title {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text);
		letter-spacing: -0.02em;
	}
	.close-btn {
		width: 28px;
		height: 28px;
		border-radius: 7px;
		background: none;
		border: 1px solid var(--border);
		color: var(--muted);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.12s, border-color 0.12s, background 0.12s;
	}
	.close-btn:hover { color: var(--text); border-color: var(--muted); background: var(--surface-2); }

	.modal-body {
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.field-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text);
	}

	.input-wrap {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 9px;
		padding: 0 0.85rem;
		transition: border-color 0.15s;
	}
	.input-wrap:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent); }
	.input-wrap.input-error { border-color: var(--red); }

	.invite-input {
		flex: 1;
		background: none;
		border: none;
		outline: none;
		font-size: 0.85rem;
		color: var(--text);
		font-family: inherit;
		padding: 0.7rem 0;
	}
	.invite-input::placeholder { color: var(--muted); opacity: 0.6; }

	.error-msg { font-size: 0.75rem; color: var(--red); margin-top: -0.2rem; }

	.role-select-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.role-radio {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.6rem 0.75rem;
		border-radius: 8px;
		border: 1px solid var(--border);
		cursor: pointer;
		transition: border-color 0.12s, background 0.12s;
	}
	.role-radio input { display: none; }
	.role-radio:has(input:checked),
	.role-radio-active {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 6%, transparent);
	}
	.radio-label {
		font-size: 0.83rem;
		font-weight: 600;
		color: var(--text);
		flex: 0 0 auto;
		min-width: 65px;
	}
	.radio-hint { font-size: 0.75rem; color: var(--muted); }

	.invite-success {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6rem;
		padding: 2rem 1rem;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--green);
	}

	.modal-foot {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.6rem;
		padding: 0.9rem 1.25rem;
		border-top: 1px solid var(--border);
		background: var(--surface-2);
	}
	.btn-ghost {
		padding: 0.45rem 0.9rem;
		border-radius: 7px;
		border: 1px solid var(--border);
		background: none;
		font-size: 0.82rem;
		color: var(--muted);
		cursor: pointer;
		font-family: inherit;
		transition: color 0.12s, border-color 0.12s;
	}
	.btn-ghost:hover { color: var(--text); border-color: var(--muted); }
	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem 1rem;
		border-radius: 7px;
		background: var(--accent);
		color: #fff;
		font-size: 0.82rem;
		font-weight: 600;
		border: none;
		cursor: pointer;
		font-family: inherit;
		transition: opacity 0.12s;
	}
	.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
	.btn-primary:not(:disabled):hover { opacity: 0.9; }

	.spinner {
		width: 13px;
		height: 13px;
		border: 2px solid rgba(255,255,255,0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	@media (max-width: 640px) {
		.team-page { padding: 1.25rem 1rem 2rem; }
		.member-table th:nth-child(3),
		.member-table th:nth-child(4),
		.member-row td:nth-child(3),
		.member-row td:nth-child(4) { display: none; }
	}
</style>
