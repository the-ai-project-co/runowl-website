<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { animate } from 'motion';
	import { prModal } from '$lib/stores/modal.svelte';
	import {
		GitPullRequest,
		ShieldAlert,
		TrendingUp,
		TrendingDown,
		Minus,
		Activity,
		AlertTriangle,
		CheckCircle,
		XCircle,
		Clock,
		BarChart2,
		Plus,
		ArrowRight,
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	interface ReviewRecord {
		id: string;
		pr_url: string;
		pr_number: number;
		repo: string;
		findings_count: number;
		status: string;
		created_at: string;
	}
	interface FindingsDist {
		clean: number;
		low: number;
		medium: number;
		high: number;
	}
	interface TopRepo {
		repo: string;
		count: number;
	}

	let reviews = $state<ReviewRecord[]>([]);
	let loading = $state(true);
	let stats = $state({ total: 0, findings: 0, thisWeek: 0 });
	let activity = $state<number[]>(Array(14).fill(0));
	let findingsDist = $state<FindingsDist>({ clean: 0, low: 0, medium: 0, high: 0 });
	let topRepos = $state<TopRepo[]>([]);

	// Tooltip state for activity chart
	let tooltip = $state<{ x: number; y: number; value: number; label: string } | null>(null);
	let chartEl = $state<SVGSVGElement | null>(null);

	onMount(async () => {
		try {
			const res = await fetch('/api/reviews');
			if (res.ok) {
				const json = await res.json();
				reviews = json.reviews ?? [];
				stats = {
					total: json.total ?? reviews.length,
					findings: json.total_findings ?? 0,
					thisWeek: json.this_week ?? 0,
				};
				activity = json.activity ?? Array(14).fill(0);
				findingsDist = json.findings_dist ?? { clean: 0, low: 0, medium: 0, high: 0 };
				topRepos = json.top_repos ?? [];
			}
		} finally {
			loading = false;
			// Animate stat counters
			setTimeout(() => animateCounters(), 50);
		}
	});

	// Counter animation
	let displayTotal = $state(0);
	let displayFindings = $state(0);
	let displayWeek = $state(0);

	function animateCounters() {
		if (isDemo()) return;
		animateNum(stats.total, (v) => (displayTotal = v));
		animateNum(stats.findings, (v) => (displayFindings = v));
		animateNum(stats.thisWeek, (v) => (displayWeek = v));
	}

	function animateNum(target: number, setter: (v: number) => void) {
		if (target === 0) return;
		animate(0, target, {
			duration: 0.9,
			ease: [0.16, 1, 0.3, 1],
			onUpdate: (v) => setter(Math.round(v)),
		});
	}

	// ── Demo / empty data ────────────────────────────────────────────────────────
	const isDemo = $derived(() => !loading && stats.total === 0);
	const demoActivity = [1, 0, 2, 1, 3, 2, 1, 4, 3, 2, 5, 3, 4, 2];
	const demoDist: FindingsDist = { clean: 5, low: 7, medium: 4, high: 2 };
	const demoRepos: TopRepo[] = [
		{ repo: 'acme/api', count: 7 },
		{ repo: 'acme/web', count: 5 },
		{ repo: 'acme/infra', count: 3 },
		{ repo: 'acme/sdk', count: 2 },
	];
	const demoStats = { total: 18, findings: 42, thisWeek: 5 };

	const src = $derived(() => ({
		activity: isDemo() ? demoActivity : activity,
		dist: isDemo() ? demoDist : findingsDist,
		repos: isDemo() ? demoRepos : topRepos,
		stats: isDemo() ? demoStats : stats,
		total: isDemo() ? demoStats.total : displayTotal,
		findings: isDemo() ? demoStats.findings : displayFindings,
		week: isDemo() ? demoStats.thisWeek : displayWeek,
	}));

	// ── Derived trend (compare first vs second half of activity) ────────────────
	const trend = $derived(() => {
		const a = src().activity;
		const half = Math.floor(a.length / 2);
		const first = a.slice(0, half).reduce((s, v) => s + v, 0);
		const second = a.slice(half).reduce((s, v) => s + v, 0);
		if (first === 0 && second === 0) return 0;
		if (first === 0) return 100;
		return Math.round(((second - first) / first) * 100);
	});

	// ── Health score (0-100) ────────────────────────────────────────────────────
	const healthScore = $derived(() => {
		const d = src().dist;
		const total = d.clean + d.low + d.medium + d.high || 1;
		const score = Math.round(
			((d.clean * 100 + d.low * 70 + d.medium * 40 + d.high * 10) / (total * 100)) * 100
		);
		return Math.max(0, Math.min(100, score));
	});

	function healthLabel(score: number) {
		if (score >= 80) return { text: 'Excellent', color: 'var(--green)' };
		if (score >= 60) return { text: 'Good', color: 'var(--yellow)' };
		if (score >= 40) return { text: 'Fair', color: '#f97316' };
		return { text: 'Needs work', color: 'var(--red)' };
	}

	// ── Activity chart (SVG) ────────────────────────────────────────────────────
	const W = 560;
	const H = 100;
	const PAD = { top: 8, right: 8, bottom: 24, left: 28 };
	const innerW = W - PAD.left - PAD.right;
	const innerH = H - PAD.top - PAD.bottom;

	const chartData = $derived(() => {
		const data = src().activity;
		const max = Math.max(...data, 1);
		return data.map((v, i) => ({
			x: PAD.left + (i / (data.length - 1)) * innerW,
			y: PAD.top + innerH - (v / max) * innerH,
			value: v,
		}));
	});

	const linePath = $derived(() => {
		const pts = chartData();
		return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
	});

	const areaPath = $derived(() => {
		const pts = chartData();
		const bottom = PAD.top + innerH;
		return (
			linePath() +
			` L${pts[pts.length - 1].x.toFixed(1)},${bottom} L${pts[0].x.toFixed(1)},${bottom} Z`
		);
	});

	// Y-axis ticks
	const yTicks = $derived(() => {
		const max = Math.max(...src().activity, 1);
		const step = max <= 3 ? 1 : max <= 8 ? 2 : Math.ceil(max / 4);
		const ticks = [];
		for (let v = 0; v <= max; v += step) ticks.push(v);
		return ticks.map((v) => ({
			v,
			y: PAD.top + innerH - (v / max) * innerH,
		}));
	});

	// X-axis labels (every ~3 days)
	const xLabels = $derived(() => {
		const n = src().activity.length;
		return src().activity.map((_, i) => {
			const d = new Date();
			d.setDate(d.getDate() - (n - 1 - i));
			return {
				x: PAD.left + (i / (n - 1)) * innerW,
				label: d.toLocaleDateString('en-US', { weekday: 'short' }),
				show: i % 3 === 0 || i === n - 1,
			};
		});
	});

	function onChartMove(e: MouseEvent) {
		if (!chartEl) return;
		const rect = chartEl.getBoundingClientRect();
		const scaleX = W / rect.width;
		const mx = (e.clientX - rect.left) * scaleX;
		const pts = chartData();
		// Find closest point
		let closest = pts[0];
		let minDist = Math.abs(pts[0].x - mx);
		for (const p of pts) {
			const d = Math.abs(p.x - mx);
			if (d < minDist) {
				minDist = d;
				closest = p;
			}
		}
		const dayIdx = pts.indexOf(closest);
		const n = src().activity.length;
		const d = new Date();
		d.setDate(d.getDate() - (n - 1 - dayIdx));
		const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		tooltip = {
			x: (closest.x / W) * rect.width + rect.left - rect.left,
			y: closest.y,
			value: closest.value,
			label,
		};
	}

	// ── Donut chart ────────────────────────────────────────────────────────────
	const DONUT_R = 42;
	const DONUT_STROKE = 12;
	const C = 2 * Math.PI * DONUT_R;

	interface Slice {
		label: string;
		value: number;
		color: string;
		pct: number;
		offset: number;
	}

	const slices = $derived((): Slice[] => {
		const d = src().dist;
		const entries = [
			{ label: 'Clean', value: d.clean, color: 'var(--green)' },
			{ label: 'Low', value: d.low, color: 'var(--yellow)' },
			{ label: 'Medium', value: d.medium, color: '#f97316' },
			{ label: 'High', value: d.high, color: 'var(--red)' },
		];
		const total = entries.reduce((s, e) => s + e.value, 0) || 1;
		let offset = 0;
		return entries.map((e) => {
			const pct = e.value / total;
			const s = { ...e, pct, offset };
			offset += pct;
			return s;
		});
	});

	// ── Helpers ────────────────────────────────────────────────────────────────
	function formatDate(iso: string) {
		const d = new Date(iso);
		const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays}d ago`;
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function sevClass(count: number) {
		if (count === 0) return 'sev-clean';
		if (count <= 2) return 'sev-low';
		if (count <= 5) return 'sev-med';
		return 'sev-high';
	}

	// ── Onboarding checklist ────────────────────────────────────────────────
	let onboardingDismissed = $state(false);

	$effect(() => {
		if (localStorage.getItem('runowl-onboarding-dismissed') === '1') {
			onboardingDismissed = true;
		}
	});

	function dismissOnboarding() {
		onboardingDismissed = true;
		localStorage.setItem('runowl-onboarding-dismissed', '1');
	}

	// Steps: completed when real data exists
	const onboardingSteps = $derived(() => [
		{
			id: 'github',
			label: 'Connect your GitHub account',
			hint: 'Authenticate so RunOwl can access your PRs.',
			done: true, // they're signed in so OAuth is done
			href: null,
		},
		{
			id: 'review',
			label: 'Run your first PR review',
			hint: 'Paste a GitHub PR URL and get an AI code review in seconds.',
			done: stats.total > 0,
			href: null,
			action: () => prModal.show(),
		},
		{
			id: 'team',
			label: 'Invite a teammate',
			hint: 'Collaborate with your team by sharing RunOwl access.',
			done: false,
			href: '/app/team',
		},
	]);

	const onboardingComplete = $derived(() => onboardingSteps().every((s) => s.done));
	const onboardingProgress = $derived(() => onboardingSteps().filter((s) => s.done).length);
	const showOnboarding = $derived(
		() => !loading && !onboardingDismissed && !onboardingComplete()
	);
</script>

<svelte:head>
	<title>Dashboard — RunOwl</title>
</svelte:head>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="dash" onmouseleave={() => (tooltip = null)}>
	<!-- ── Header ──────────────────────────────────────────────────────────── -->
	<div class="dash-head">
		<div>
			<div class="dash-title-row">
				<h1 class="dash-title">Dashboard</h1>
				{#if isDemo()}
					<span class="demo-pill">Demo</span>
				{/if}
			</div>
			<p class="dash-sub">
				{data.user?.email ? `Signed in as ${data.user.email}` : 'Your code quality command centre'}
			</p>
		</div>
		<button class="cta-btn" onclick={() => prModal.show()}>
			<Plus size={14} strokeWidth={2.5} />
			New Review
		</button>
	</div>

	<!-- ── Stat cards ─────────────────────────────────────────────────────── -->
	<div class="stat-grid">
		<!-- Total PRs -->
		<div class="stat-card">
			<div
				class="stat-icon-wrap"
				style="background: color-mix(in srgb, var(--accent) 12%, transparent);"
			>
				<GitPullRequest size={16} color="var(--accent)" />
			</div>
			<div class="stat-body">
				<span class="stat-label">Total Reviews</span>
				<span class="stat-value">
					{loading ? '—' : src().total}
				</span>
			</div>
			<div class="stat-trend" class:trend-up={trend() > 0} class:trend-down={trend() < 0}>
				{#if trend() > 0}
					<TrendingUp size={13} />
					+{trend()}%
				{:else if trend() < 0}
					<TrendingDown size={13} />
					{trend()}%
				{:else}
					<Minus size={13} />
					Flat
				{/if}
				<span class="trend-label">vs prev week</span>
			</div>
		</div>

		<!-- Findings -->
		<div class="stat-card">
			<div
				class="stat-icon-wrap"
				style="background: color-mix(in srgb, var(--red) 12%, transparent);"
			>
				<ShieldAlert size={16} color="var(--red)" />
			</div>
			<div class="stat-body">
				<span class="stat-label">Findings Caught</span>
				<span class="stat-value">{loading ? '—' : src().findings}</span>
			</div>
			<div class="stat-meta">
				{#if !loading}
					<span class="meta-chip chip-red">{src().dist.high} high</span>
					<span class="meta-chip chip-orange">{src().dist.medium} medium</span>
				{/if}
			</div>
		</div>

		<!-- This week -->
		<div class="stat-card">
			<div
				class="stat-icon-wrap"
				style="background: color-mix(in srgb, var(--green) 12%, transparent);"
			>
				<Activity size={16} color="var(--green)" />
			</div>
			<div class="stat-body">
				<span class="stat-label">This Week</span>
				<span class="stat-value">{loading ? '—' : src().week}</span>
			</div>
			<div class="stat-meta">
				<span class="meta-sub">reviews in last 7 days</span>
			</div>
		</div>

		<!-- Health score -->
		<div class="stat-card stat-card-health">
			<div class="stat-body">
				<span class="stat-label">Code Health</span>
				<span class="stat-value" style="color: {healthLabel(healthScore()).color}">
					{loading ? '—' : healthScore()}
					{#if !loading}<span class="stat-unit">/100</span>{/if}
				</span>
			</div>
			<!-- Gauge arc -->
			{#if !loading}
				{@const score = healthScore()}
				{@const r = 30}
				{@const circ = Math.PI * r}
				{@const filled = (score / 100) * circ}
				<svg class="gauge-svg" viewBox="0 0 80 44" width="80" height="44">
					<!-- Background arc (semicircle) -->
					<path
						d="M 8 40 A {r} {r} 0 0 1 72 40"
						fill="none"
						stroke="var(--border)"
						stroke-width="7"
						stroke-linecap="round"
					/>
					<!-- Filled arc -->
					<path
						d="M 8 40 A {r} {r} 0 0 1 72 40"
						fill="none"
						stroke={healthLabel(score).color}
						stroke-width="7"
						stroke-linecap="round"
						stroke-dasharray="{filled} {circ}"
					/>
					<text x="40" y="38" text-anchor="middle" class="gauge-label">
						{healthLabel(score).text}
					</text>
				</svg>
			{/if}
		</div>
	</div>

	<!-- ── Onboarding checklist ──────────────────────────────────────────── -->
	{#if showOnboarding()}
		<div class="onboard-card">
			<div class="onboard-head">
				<div class="onboard-title-row">
					<span class="onboard-title">Get started with RunOwl</span>
					<div class="onboard-progress">
						<div class="onboard-progress-track">
							<div
								class="onboard-progress-fill"
								style="width: {(onboardingProgress() / onboardingSteps().length) * 100}%"
							></div>
						</div>
						<span class="onboard-progress-label">
							{onboardingProgress()}/{onboardingSteps().length} done
						</span>
					</div>
				</div>
				<button class="onboard-dismiss" onclick={dismissOnboarding} aria-label="Dismiss checklist">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				</button>
			</div>
			<div class="onboard-steps">
				{#each onboardingSteps() as step (step.id)}
					<div class="onboard-step" class:step-done={step.done}>
						<span class="step-check" class:check-done={step.done}>
							{#if step.done}
								<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
									<polyline points="20 6 9 17 4 12"/>
								</svg>
							{:else}
								<span class="step-num"></span>
							{/if}
						</span>
						<div class="step-content">
							<span class="step-label">{step.label}</span>
							<span class="step-hint">{step.hint}</span>
						</div>
						{#if !step.done}
							{#if step.action}
								<button class="step-cta" onclick={step.action}>Start</button>
							{:else if step.href}
								<a href={step.href} class="step-cta">Go</a>
							{/if}
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- ── Main content: activity chart + donut ─────────────────────────── -->
	<div class="mid-grid">
		<!-- Activity chart -->
		<div class="chart-card chart-activity">
			<div class="chart-head">
				<div>
					<span class="chart-title">Review Activity</span>
					<span class="chart-sub">PRs reviewed per day · last 14 days</span>
				</div>
				{#if !loading}
					<div
						class="trend-chip"
						class:trend-chip-up={trend() > 0}
						class:trend-chip-down={trend() < 0}
					>
						{#if trend() > 0}
							<TrendingUp size={12} />+{trend()}%
						{:else if trend() < 0}
							<TrendingDown size={12} />{trend()}%
						{:else}
							<Minus size={12} />Flat
						{/if}
					</div>
				{/if}
			</div>

			{#if loading}
				<div class="skel" style="height: 130px; margin: 0.5rem 0;"></div>
			{:else}
				<div class="chart-wrap" style="position: relative;">
					<svg
						bind:this={chartEl}
						viewBox="0 0 {W} {H}"
						class="activity-svg"
						onmousemove={onChartMove}
						onmouseleave={() => (tooltip = null)}
						role="img"
						aria-label="Review activity chart"
					>
						<defs>
							<linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stop-color="var(--accent)" stop-opacity="0.22" />
								<stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
							</linearGradient>
							<filter id="glow">
								<feGaussianBlur stdDeviation="2" result="blur" />
								<feMerge>
									<feMergeNode in="blur" />
									<feMergeNode in="SourceGraphic" />
								</feMerge>
							</filter>
						</defs>

						<!-- Grid lines -->
						{#each yTicks() as tick (tick.v)}
							<line
								x1={PAD.left}
								y1={tick.y}
								x2={W - PAD.right}
								y2={tick.y}
								stroke="var(--border)"
								stroke-width="0.5"
								stroke-dasharray="3 3"
							/>
							<text x={PAD.left - 4} y={tick.y + 3} text-anchor="end" class="axis-label">
								{tick.v}
							</text>
						{/each}

						<!-- X labels -->
						{#each xLabels() as item (item.x)}
							{#if item.show}
								<text x={item.x} y={H - 2} text-anchor="middle" class="axis-label"
									>{item.label}</text
								>
							{/if}
						{/each}

						<!-- Area -->
						<path d={areaPath()} fill="url(#areaGrad)" />

						<!-- Line -->
						<path
							d={linePath()}
							fill="none"
							stroke="var(--accent)"
							stroke-width="2"
							stroke-linejoin="round"
							stroke-linecap="round"
							filter="url(#glow)"
						/>

						<!-- Dots -->
						{#each chartData() as pt, i (i)}
							{#if src().activity[i] > 0}
								<circle cx={pt.x} cy={pt.y} r="3.5" fill="var(--accent)" />
								<circle cx={pt.x} cy={pt.y} r="6" fill="var(--accent)" opacity="0.12" />
							{/if}
						{/each}

						<!-- Hover vertical line -->
						{#if tooltip}
							{@const pt = chartData().find(
								(p) => Math.abs(p.value - tooltip!.value) === 0 || true
							)}
							{#if pt}
								<!-- just show the nearest point indicator via tooltip state -->
							{/if}
						{/if}
					</svg>

					<!-- Tooltip -->
					{#if tooltip}
						<div
							class="chart-tooltip"
							style="left: calc({((chartData().find((p) => p.value === tooltip!.value)?.x ?? 0) /
								W) *
								100}% - 40px)"
						>
							<span class="tt-date">{tooltip.label}</span>
							<span class="tt-val">{tooltip.value} review{tooltip.value !== 1 ? 's' : ''}</span>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Donut + legend -->
		<div class="chart-card chart-donut">
			<div class="chart-head">
				<div>
					<span class="chart-title">Findings Breakdown</span>
					<span class="chart-sub">by severity level</span>
				</div>
			</div>

			{#if loading}
				<div class="skel" style="height: 160px;"></div>
			{:else}
				<div class="donut-body">
					<div class="donut-svg-wrap">
						<svg viewBox="0 0 108 108" width="108" height="108">
							<!-- BG ring -->
							<circle
								cx="54"
								cy="54"
								r={DONUT_R}
								fill="none"
								stroke="var(--border)"
								stroke-width={DONUT_STROKE}
							/>
							{#each slices() as slice, i (i)}
								{#if slice.value > 0}
									<circle
										cx="54"
										cy="54"
										r={DONUT_R}
										fill="none"
										stroke={slice.color}
										stroke-width={DONUT_STROKE}
										stroke-dasharray="{(slice.pct * C).toFixed(2)} {C.toFixed(2)}"
										stroke-dashoffset={(-slice.offset * C).toFixed(2)}
										transform="rotate(-90 54 54)"
										stroke-linecap="butt"
									/>
								{/if}
							{/each}
							<!-- Center -->
							<text x="54" y="50" text-anchor="middle" class="donut-center-num">
								{slices().reduce((s, d) => s + d.value, 0)}
							</text>
							<text x="54" y="63" text-anchor="middle" class="donut-center-sub">reviews</text>
						</svg>
					</div>

					<div class="donut-legend">
						{#each slices() as slice (slice.label)}
							<div class="legend-row">
								<span class="legend-swatch" style="background: {slice.color}"></span>
								<span class="legend-lbl">{slice.label}</span>
								<div class="legend-bar-track">
									<div
										class="legend-bar-fill"
										style="width: {(slice.pct * 100).toFixed(1)}%; background: {slice.color};"
									></div>
								</div>
								<span class="legend-count">{slice.value}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- ── Bottom grid: top repos + recent reviews ───────────────────────── -->
	<div class="bot-grid">
		<!-- Top repos -->
		<div class="chart-card">
			<div class="chart-head">
				<div>
					<span class="chart-title">Top Repositories</span>
					<span class="chart-sub">by review count</span>
				</div>
				<BarChart2 size={15} color="var(--muted)" />
			</div>

			{#if loading}
				<div class="skel" style="height: 120px;"></div>
			{:else if src().repos.length === 0}
				<div class="chart-empty">No repositories reviewed yet</div>
			{:else}
				{@const max = Math.max(...src().repos.map((r) => r.count), 1)}
				<div class="repo-list">
					{#each src().repos as repo, i (repo.repo)}
						<div class="repo-row">
							<span class="repo-rank">#{i + 1}</span>
							<span class="repo-name" title={repo.repo}>{repo.repo}</span>
							<div class="repo-bar-track">
								<div
									class="repo-bar-fill"
									style="width: {((repo.count / max) * 100).toFixed(1)}%; animation-delay: {i *
										80}ms"
								></div>
							</div>
							<span class="repo-count">{repo.count}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Recent reviews -->
		<div class="chart-card">
			<div class="chart-head">
				<div>
					<span class="chart-title">Recent Reviews</span>
					<span class="chart-sub">latest activity</span>
				</div>
				<a href="/app/library" class="see-all">
					View all <ArrowRight size={11} />
				</a>
			</div>

			{#if loading}
				<div class="skel" style="height: 160px;"></div>
			{:else if reviews.length === 0}
				<div class="chart-empty">
					<Clock size={28} strokeWidth={1.25} opacity={0.3} />
					<span>No reviews yet</span>
					<button class="start-link" onclick={() => prModal.show()}>Run your first review →</button>
				</div>
			{:else}
				<div class="review-list">
					{#each reviews.slice(0, 6) as r (r.id)}
						<a href="/app/review?pr={encodeURIComponent(r.pr_url)}" class="review-row">
							<div class="rr-icon">
								{#if r.findings_count === 0}
									<CheckCircle size={14} color="var(--green)" />
								{:else if r.findings_count >= 6}
									<XCircle size={14} color="var(--red)" />
								{:else}
									<AlertTriangle size={14} color="var(--yellow)" />
								{/if}
							</div>
							<div class="rr-info">
								<span class="rr-repo">{r.repo}</span>
								<span class="rr-pr">#{r.pr_number}</span>
							</div>
							<span class="rr-badge {sevClass(r.findings_count)}">
								{r.findings_count} finding{r.findings_count !== 1 ? 's' : ''}
							</span>
							<span class="rr-date">{formatDate(r.created_at)}</span>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	/* ── Layout ─────────────────────────────────────────────────────────────── */
	.dash {
		padding: 2rem 2.5rem 3rem;
		max-width: 1120px;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	/* ── Onboarding card ────────────────────────────────────────────────────── */
	.onboard-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.onboard-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	.onboard-title-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.onboard-title {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--text);
		letter-spacing: -0.01em;
	}
	.onboard-progress {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.onboard-progress-track {
		width: 80px;
		height: 4px;
		background: var(--border);
		border-radius: 2px;
		overflow: hidden;
	}
	.onboard-progress-fill {
		height: 100%;
		background: var(--accent);
		border-radius: 2px;
		transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.onboard-progress-label {
		font-size: 0.72rem;
		color: var(--muted);
	}
	.onboard-dismiss {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--muted);
		display: flex;
		align-items: center;
		padding: 0.2rem;
		border-radius: 4px;
		transition: color 0.12s, background 0.12s;
		flex-shrink: 0;
	}
	.onboard-dismiss:hover {
		color: var(--text);
		background: var(--surface-2);
	}
	.onboard-steps {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.onboard-step {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.65rem 0.75rem;
		border-radius: 8px;
		background: var(--surface-2);
		transition: background 0.12s;
	}
	.onboard-step.step-done {
		opacity: 0.5;
	}
	.step-check {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 2px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-top: 1px;
		transition: background 0.2s, border-color 0.2s;
	}
	.step-check.check-done {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}
	.step-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.step-label {
		font-size: 0.83rem;
		font-weight: 600;
		color: var(--text);
	}
	.step-hint {
		font-size: 0.75rem;
		color: var(--muted);
	}
	.step-cta {
		display: inline-flex;
		align-items: center;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 6px;
		padding: 0.3rem 0.75rem;
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		text-decoration: none;
		flex-shrink: 0;
		transition: opacity 0.12s;
	}
	.step-cta:hover { opacity: 0.85; }

	/* ── Header ─────────────────────────────────────────────────────────────── */
	.dash-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}
	.dash-title-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.2rem;
	}
	.dash-title {
		font-size: 1.45rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		color: var(--text);
	}
	.dash-sub {
		font-size: 0.82rem;
		color: var(--muted);
	}
	.demo-pill {
		font-size: 0.65rem;
		font-weight: 700;
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
		background: color-mix(in srgb, var(--accent) 15%, transparent);
		color: var(--accent);
		border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.cta-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: var(--accent);
		color: #fff;
		text-decoration: none;
		border: none;
		cursor: pointer;
		font-family: inherit;
		padding: 0.5rem 1.1rem;
		border-radius: 8px;
		font-size: 0.85rem;
		font-weight: 600;
		flex-shrink: 0;
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.08) inset,
			0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent);
		transition:
			opacity 0.15s,
			transform 0.15s;
	}
	.cta-btn:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	/* ── Stat grid ──────────────────────────────────────────────────────────── */
	.stat-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
	}
	.stat-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		position: relative;
		overflow: hidden;
		transition: border-color 0.2s;
	}
	.stat-card::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.025), transparent 60%);
		pointer-events: none;
	}
	.stat-card:hover {
		border-color: color-mix(in srgb, var(--accent) 30%, transparent);
	}
	.stat-card-health {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}
	.stat-icon-wrap {
		width: 34px;
		height: 34px;
		border-radius: 9px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.stat-body {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.stat-label {
		font-size: 0.72rem;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		letter-spacing: -0.04em;
		color: var(--text);
		line-height: 1;
	}
	.stat-unit {
		font-size: 1rem;
		font-weight: 400;
		color: var(--muted);
	}
	.stat-trend {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.72rem;
		color: var(--muted);
	}
	.stat-trend.trend-up {
		color: var(--green);
	}
	.stat-trend.trend-down {
		color: var(--red);
	}
	.trend-label {
		color: var(--muted);
		margin-left: 0.15rem;
	}
	.stat-meta {
		display: flex;
		gap: 0.4rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.meta-chip {
		font-size: 0.67rem;
		font-weight: 600;
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
	}
	.chip-red {
		background: color-mix(in srgb, var(--red) 12%, transparent);
		color: var(--red);
	}
	.chip-orange {
		background: color-mix(in srgb, #f97316 12%, transparent);
		color: #f97316;
	}
	.meta-sub {
		font-size: 0.72rem;
		color: var(--muted);
	}

	/* Gauge */
	.gauge-svg {
		flex-shrink: 0;
	}
	.gauge-label {
		font-size: 7px;
		fill: var(--muted);
		font-family: inherit;
	}

	/* ── Chart cards ────────────────────────────────────────────────────────── */
	.chart-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.1rem 1.25rem 1.25rem;
	}
	.chart-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 1rem;
		gap: 0.5rem;
	}
	.chart-title {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text);
		margin-bottom: 0.1rem;
	}
	.chart-sub {
		display: block;
		font-size: 0.71rem;
		color: var(--muted);
	}
	.chart-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 2rem 0;
		font-size: 0.82rem;
		color: var(--muted);
		text-align: center;
	}
	.start-link {
		font-size: 0.8rem;
		color: var(--accent);
		background: none;
		border: none;
		cursor: pointer;
		font-family: inherit;
		text-decoration: none;
		padding: 0;
	}
	.start-link:hover {
		text-decoration: underline;
	}

	/* Skeleton */
	.skel {
		border-radius: 8px;
		background: linear-gradient(
			90deg,
			var(--surface-2) 25%,
			var(--border) 50%,
			var(--surface-2) 75%
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

	/* ── Mid grid ───────────────────────────────────────────────────────────── */
	.mid-grid {
		display: grid;
		grid-template-columns: 1fr 280px;
		gap: 1rem;
	}
	/* Activity SVG */
	.activity-svg {
		width: 100%;
		height: auto;
		display: block;
		cursor: crosshair;
		overflow: visible;
	}
	.axis-label {
		font-size: 7px;
		fill: var(--muted);
		font-family: inherit;
	}

	/* Trend chip */
	.trend-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.72rem;
		font-weight: 600;
		padding: 0.2rem 0.5rem;
		border-radius: 6px;
		background: var(--surface-2);
		color: var(--muted);
		flex-shrink: 0;
	}
	.trend-chip-up {
		background: color-mix(in srgb, var(--green) 12%, transparent);
		color: var(--green);
	}
	.trend-chip-down {
		background: color-mix(in srgb, var(--red) 12%, transparent);
		color: var(--red);
	}

	/* Tooltip */
	.chart-tooltip {
		position: absolute;
		top: 0;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.35rem 0.65rem;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		pointer-events: none;
		z-index: 10;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
		min-width: 80px;
		transform: translateY(-110%);
	}
	.tt-date {
		font-size: 0.67rem;
		color: var(--muted);
	}
	.tt-val {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text);
	}

	/* ── Donut ──────────────────────────────────────────────────────────────── */
	.donut-body {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}
	.donut-svg-wrap {
		flex-shrink: 0;
	}
	.donut-center-num {
		font-size: 14px;
		font-weight: 700;
		fill: var(--text);
		font-family: inherit;
	}
	.donut-center-sub {
		font-size: 7px;
		fill: var(--muted);
		font-family: inherit;
	}
	.donut-legend {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}
	.legend-row {
		display: grid;
		grid-template-columns: 8px 1fr auto auto;
		align-items: center;
		gap: 0.5rem;
	}
	.legend-swatch {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.legend-lbl {
		font-size: 0.75rem;
		color: var(--muted);
	}
	.legend-bar-track {
		width: 60px;
		height: 4px;
		background: var(--border);
		border-radius: 2px;
		overflow: hidden;
	}
	.legend-bar-fill {
		height: 100%;
		border-radius: 2px;
		transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.legend-count {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text);
		width: 20px;
		text-align: right;
	}

	/* ── Bottom grid ────────────────────────────────────────────────────────── */
	.bot-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	/* Top repos */
	.repo-list {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}
	.repo-row {
		display: grid;
		grid-template-columns: 20px 1fr auto auto;
		align-items: center;
		gap: 0.6rem;
	}
	.repo-rank {
		font-size: 0.68rem;
		color: var(--muted);
		font-weight: 600;
	}
	.repo-name {
		font-size: 0.78rem;
		color: var(--text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.repo-bar-track {
		width: 80px;
		height: 5px;
		background: var(--border);
		border-radius: 3px;
		overflow: hidden;
	}
	.repo-bar-fill {
		height: 100%;
		background: var(--accent);
		border-radius: 3px;
		animation: barGrow 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
	@keyframes barGrow {
		from {
			width: 0% !important;
		}
	}
	.repo-count {
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--accent);
		width: 16px;
		text-align: right;
	}

	/* Recent reviews list */
	.review-list {
		display: flex;
		flex-direction: column;
	}
	.review-row {
		display: grid;
		grid-template-columns: 20px 1fr auto auto;
		align-items: center;
		gap: 0.6rem;
		padding: 0.6rem 0;
		border-bottom: 1px solid var(--border);
		text-decoration: none;
		transition: background 0.12s;
		border-radius: 6px;
		padding-left: 0.25rem;
		padding-right: 0.25rem;
	}
	.review-row:last-child {
		border-bottom: none;
	}
	.review-row:hover {
		background: var(--surface-2);
	}
	.rr-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}
	.rr-info {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		min-width: 0;
	}
	.rr-repo {
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.rr-pr {
		font-size: 0.72rem;
		color: var(--muted);
		flex-shrink: 0;
	}
	.rr-badge {
		font-size: 0.67rem;
		font-weight: 600;
		padding: 0.12rem 0.4rem;
		border-radius: 4px;
		flex-shrink: 0;
	}
	.sev-clean {
		background: color-mix(in srgb, var(--green) 10%, transparent);
		color: var(--green);
	}
	.sev-low {
		background: color-mix(in srgb, var(--yellow) 10%, transparent);
		color: var(--yellow);
	}
	.sev-med {
		background: color-mix(in srgb, #f97316 10%, transparent);
		color: #f97316;
	}
	.sev-high {
		background: color-mix(in srgb, var(--red) 10%, transparent);
		color: var(--red);
	}
	.rr-date {
		font-size: 0.68rem;
		color: var(--muted);
		flex-shrink: 0;
	}

	/* See all link */
	.see-all {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		font-size: 0.75rem;
		color: var(--accent);
		text-decoration: none;
		flex-shrink: 0;
	}
	.see-all:hover {
		text-decoration: underline;
	}

	/* ── Responsive ─────────────────────────────────────────────────────────── */
	@media (max-width: 1024px) {
		.stat-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		.mid-grid {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 700px) {
		.dash {
			padding: 1.25rem 1rem 2rem;
		}
		.stat-grid {
			grid-template-columns: 1fr 1fr;
		}
		.bot-grid {
			grid-template-columns: 1fr;
		}
		.dash-head {
			flex-direction: column;
		}
	}
	@media (max-width: 440px) {
		.stat-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
