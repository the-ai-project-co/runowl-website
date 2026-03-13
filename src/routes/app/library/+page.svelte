<script lang="ts">
	import { onMount } from 'svelte';
	import { prModal } from '$lib/stores/modal.svelte';
	import {
		Plus,
		GitPullRequest,
		CheckCircle,
		AlertTriangle,
		XCircle,
		Clock,
		ArrowRight,
		Search,
	} from 'lucide-svelte';

	interface ReviewRecord {
		id: string;
		pr_url: string;
		pr_number: number;
		repo: string;
		findings_count: number;
		status: string;
		created_at: string;
	}

	let reviews = $state<ReviewRecord[]>([]);
	let loading = $state(true);
	let search = $state('');

	onMount(async () => {
		try {
			const res = await fetch('/api/reviews');
			if (res.ok) {
				const json = await res.json();
				reviews = json.reviews ?? [];
			}
		} finally {
			loading = false;
		}
	});

	const filtered = $derived(
		search.trim()
			? reviews.filter(
					(r) =>
						r.repo.toLowerCase().includes(search.toLowerCase()) ||
						String(r.pr_number).includes(search)
				)
			: reviews
	);

	function sevIcon(count: number) {
		if (count === 0) return 'clean';
		if (count <= 2) return 'low';
		if (count <= 5) return 'med';
		return 'high';
	}

	function sevLabel(count: number) {
		if (count === 0) return 'Clean';
		if (count <= 2) return 'Low';
		if (count <= 5) return 'Medium';
		return 'High';
	}

	function formatDate(iso: string) {
		const d = new Date(iso);
		const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays}d ago`;
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	// Group by repo for a nicer card structure
	const grouped = $derived(() => {
		const map = new Map<string, ReviewRecord[]>();
		for (const r of filtered) {
			const existing = map.get(r.repo) ?? [];
			map.set(r.repo, [...existing, r]);
		}
		return Array.from(map.entries()).map(([repo, prs]) => ({ repo, prs }));
	});
</script>

<svelte:head>
	<title>PR Library — RunOwl</title>
</svelte:head>

<div class="library">
	<!-- Header -->
	<div class="lib-head">
		<div>
			<h1 class="lib-title">PR Library</h1>
			<p class="lib-sub">All pull requests you've reviewed with RunOwl.</p>
		</div>
		<button class="cta-btn" onclick={() => prModal.show()}>
			<Plus size={14} strokeWidth={2.5} />
			New Review
		</button>
	</div>

	<!-- Search + count -->
	<div class="lib-controls">
		<div class="search-wrap">
			<Search size={14} color="var(--muted)" />
			<input
				class="search-input"
				type="search"
				placeholder="Filter by repo or PR number…"
				bind:value={search}
			/>
		</div>
		{#if !loading}
			<span class="count-badge">{filtered.length} PR{filtered.length !== 1 ? 's' : ''}</span>
		{/if}
	</div>

	<!-- Content -->
	{#if loading}
		<div class="grid">
			{#each Array(6) as _, i (i)}
				<div class="skel-card"></div>
			{/each}
		</div>
	{:else if filtered.length === 0}
		<div class="empty">
			<Clock size={40} strokeWidth={1.25} opacity={0.25} />
			{#if search}
				<p>No PRs match <strong>"{search}"</strong></p>
				<button class="link-btn" onclick={() => (search = '')}>Clear filter</button>
			{:else}
				<p>No reviews yet.</p>
				<p class="empty-hint">Click <strong>New Review</strong> above to load your first PR.</p>
			{/if}
		</div>
	{:else}
		<!-- Cards grid -->
		<div class="grid">
			{#each filtered as review (review.id)}
				{@const sev = sevIcon(review.findings_count)}
				<a href="/app/review?pr={encodeURIComponent(review.pr_url)}" class="pr-card sev-{sev}">
					<!-- Card header -->
					<div class="card-head">
						<div class="card-repo-row">
							<span class="card-repo">{review.repo}</span>
							<span class="card-pr">#{review.pr_number}</span>
						</div>
						<span class="sev-badge badge-{sev}">
							{#if sev === 'clean'}
								<CheckCircle size={11} />
							{:else if sev === 'high'}
								<XCircle size={11} />
							{:else}
								<AlertTriangle size={11} />
							{/if}
							{sevLabel(review.findings_count)}
						</span>
					</div>

					<!-- Findings bar -->
					<div class="findings-bar-wrap">
						<div
							class="findings-bar bar-{sev}"
							style="width: {Math.min(review.findings_count * 10, 100)}%"
						></div>
					</div>

					<!-- Card footer -->
					<div class="card-foot">
						<div class="card-meta">
							<GitPullRequest size={12} color="var(--muted)" />
							<span class="findings-label">
								{review.findings_count} finding{review.findings_count !== 1 ? 's' : ''}
							</span>
						</div>
						<div class="card-date-row">
							<span class="card-date">{formatDate(review.created_at)}</span>
							<ArrowRight size={12} color="var(--muted)" />
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.library {
		padding: 2rem 2.5rem 3rem;
		max-width: 1100px;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Header */
	.lib-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}
	.lib-title {
		font-size: 1.45rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		color: var(--text);
		margin-bottom: 0.2rem;
	}
	.lib-sub {
		font-size: 0.82rem;
		color: var(--muted);
	}
	.cta-btn {
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
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.08) inset,
			0 4px 12px color-mix(in srgb, var(--accent) 28%, transparent);
		transition:
			opacity 0.15s,
			transform 0.15s;
	}
	.cta-btn:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}
	.empty-hint {
		font-size: 0.78rem;
		color: var(--muted);
	}
	.empty-hint strong {
		color: var(--text);
	}

	/* Controls */
	.lib-controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.search-wrap {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0 0.75rem;
		flex: 1;
		max-width: 360px;
		transition: border-color 0.15s;
	}
	.search-wrap:focus-within {
		border-color: var(--accent);
	}
	.search-input {
		background: none;
		border: none;
		outline: none;
		font-size: 0.82rem;
		color: var(--text);
		font-family: inherit;
		padding: 0.55rem 0;
		width: 100%;
	}
	.search-input::placeholder {
		color: var(--muted);
		opacity: 0.6;
	}
	.count-badge {
		font-size: 0.72rem;
		color: var(--muted);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.25rem 0.6rem;
		flex-shrink: 0;
	}

	/* Grid */
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1rem;
	}

	/* Skeleton cards */
	.skel-card {
		height: 120px;
		border-radius: 12px;
		background: linear-gradient(
			90deg,
			var(--surface) 25%,
			var(--surface-2) 50%,
			var(--surface) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}
	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	/* PR card */
	.pr-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1rem 1.15rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		text-decoration: none;
		transition:
			border-color 0.15s,
			box-shadow 0.15s,
			transform 0.15s;
		position: relative;
		overflow: hidden;
	}
	.pr-card::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.02), transparent 55%);
		pointer-events: none;
	}
	.pr-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	}
	.pr-card.sev-clean:hover {
		border-color: color-mix(in srgb, var(--green) 35%, transparent);
	}
	.pr-card.sev-low:hover {
		border-color: color-mix(in srgb, var(--yellow) 35%, transparent);
	}
	.pr-card.sev-med:hover {
		border-color: color-mix(in srgb, #f97316 35%, transparent);
	}
	.pr-card.sev-high:hover {
		border-color: color-mix(in srgb, var(--red) 35%, transparent);
	}

	/* Card header */
	.card-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.card-repo-row {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}
	.card-repo {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.card-pr {
		font-size: 0.72rem;
		color: var(--muted);
	}

	/* Severity badge */
	.sev-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.67rem;
		font-weight: 700;
		padding: 0.2rem 0.5rem;
		border-radius: 5px;
		flex-shrink: 0;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.badge-clean {
		background: color-mix(in srgb, var(--green) 12%, transparent);
		color: var(--green);
	}
	.badge-low {
		background: color-mix(in srgb, var(--yellow) 12%, transparent);
		color: var(--yellow);
	}
	.badge-med {
		background: color-mix(in srgb, #f97316 12%, transparent);
		color: #f97316;
	}
	.badge-high {
		background: color-mix(in srgb, var(--red) 12%, transparent);
		color: var(--red);
	}

	/* Findings progress bar */
	.findings-bar-wrap {
		height: 3px;
		background: var(--border);
		border-radius: 2px;
		overflow: hidden;
	}
	.findings-bar {
		height: 100%;
		border-radius: 2px;
		transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
		min-width: 4px;
	}
	.bar-clean {
		background: var(--green);
	}
	.bar-low {
		background: var(--yellow);
	}
	.bar-med {
		background: #f97316;
	}
	.bar-high {
		background: var(--red);
	}

	/* Card footer */
	.card-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.card-meta {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	.findings-label {
		font-size: 0.75rem;
		color: var(--muted);
	}
	.card-date-row {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	.card-date {
		font-size: 0.72rem;
		color: var(--muted);
	}

	/* Empty state */
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 5rem 2rem;
		color: var(--muted);
		text-align: center;
	}
	.empty p {
		font-size: 0.9rem;
		color: var(--muted);
	}
	.empty strong {
		color: var(--text);
	}
	.link-btn {
		background: none;
		border: none;
		color: var(--accent);
		font-size: 0.82rem;
		cursor: pointer;
		font-family: inherit;
		text-decoration: underline;
	}

	@media (max-width: 640px) {
		.library {
			padding: 1.25rem 1rem 2rem;
		}
		.lib-head {
			flex-direction: column;
		}
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
