<script lang="ts">
	import { onMount } from 'svelte';
	import { upgradeStore } from '$lib/stores/upgrade.svelte';
	import UpgradeGate from '$lib/components/app/UpgradeGate.svelte';
	import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-svelte';

	const hasAccess = $derived(upgradeStore.hasAccess('team'));

	// ── Date range ─────────────────────────────────────────────────────────────
	type Range = '7d' | '30d' | '90d';
	let range = $state<Range>('30d');

	const rangeDays: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 };

	// ── Demo data seeded from range ────────────────────────────────────────────
	function seededRand(seed: number) {
		let s = seed;
		return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
	}

	const chartData = $derived(() => {
		const days = rangeDays[range];
		const rand = seededRand(days * 7);
		return Array.from({ length: days }, (_, i) => {
			const d = new Date();
			d.setDate(d.getDate() - (days - 1 - i));
			return {
				date: d,
				reviews: Math.floor(rand() * 5),
				findings: Math.floor(rand() * 8),
			};
		});
	});

	// ── Summary stats ──────────────────────────────────────────────────────────
	const totalReviews = $derived(() => chartData().reduce((s, d) => s + d.reviews, 0));
	const totalFindings = $derived(() => chartData().reduce((s, d) => s + d.findings, 0));
	const avgFindings = $derived(() =>
		totalReviews() > 0 ? (totalFindings() / totalReviews()).toFixed(1) : '—'
	);

	// week-over-week trend
	const trend = $derived(() => {
		const data = chartData();
		const half = Math.floor(data.length / 2);
		const first = data.slice(0, half).reduce((s, d) => s + d.reviews, 0);
		const second = data.slice(half).reduce((s, d) => s + d.reviews, 0);
		if (first === 0 && second === 0) return 0;
		if (first === 0) return 100;
		return Math.round(((second - first) / first) * 100);
	});

	// ── Findings distribution ──────────────────────────────────────────────────
	const dist = $derived(() => {
		const rand = seededRand(rangeDays[range] * 3);
		return [
			{ label: 'Clean', color: 'var(--green)', value: Math.floor(rand() * 20 + 5) },
			{ label: 'Low', color: 'var(--yellow)', value: Math.floor(rand() * 12 + 3) },
			{ label: 'Medium', color: '#f97316', value: Math.floor(rand() * 8 + 1) },
			{ label: 'High', color: 'var(--red)', value: Math.floor(rand() * 4) },
		];
	});
	const distTotal = $derived(() => dist().reduce((s, d) => s + d.value, 0) || 1);

	// ── Top repos ──────────────────────────────────────────────────────────────
	const topRepos = $derived(() => {
		const rand = seededRand(rangeDays[range] * 11);
		return [
			{ repo: 'acme/api', count: Math.floor(rand() * 20 + 8) },
			{ repo: 'acme/web', count: Math.floor(rand() * 14 + 4) },
			{ repo: 'acme/infra', count: Math.floor(rand() * 8 + 2) },
			{ repo: 'acme/sdk', count: Math.floor(rand() * 5 + 1) },
		].sort((a, b) => b.count - a.count);
	});
	const maxRepoCount = $derived(() => Math.max(...topRepos().map((r) => r.count), 1));

	// ── SVG activity chart ─────────────────────────────────────────────────────
	const W = 560, H = 110;
	const PAD = { top: 8, right: 8, bottom: 22, left: 28 };
	const innerW = W - PAD.left - PAD.right;
	const innerH = H - PAD.top - PAD.bottom;

	const chartPts = $derived(() => {
		const data = chartData();
		const max = Math.max(...data.map((d) => d.reviews), 1);
		return data.map((d, i) => ({
			x: PAD.left + (i / (data.length - 1)) * innerW,
			y: PAD.top + innerH - (d.reviews / max) * innerH,
			value: d.reviews,
			date: d.date,
		}));
	});

	const linePath = $derived(() =>
		chartPts().map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
	);
	const areaPath = $derived(() => {
		const pts = chartPts();
		const bottom = PAD.top + innerH;
		return linePath() + ` L${pts[pts.length - 1].x.toFixed(1)},${bottom} L${pts[0].x.toFixed(1)},${bottom} Z`;
	});

	const yMax = $derived(() => Math.max(...chartData().map((d) => d.reviews), 1));
	const yTicks = $derived(() => {
		const m = yMax();
		const step = m <= 3 ? 1 : m <= 8 ? 2 : Math.ceil(m / 4);
		const ticks = [];
		for (let v = 0; v <= m; v += step) ticks.push({ v, y: PAD.top + innerH - (v / m) * innerH });
		return ticks;
	});

	// X labels: show every Nth depending on range
	const xLabels = $derived(() => {
		const data = chartData();
		const n = data.length;
		const step = n <= 7 ? 1 : n <= 30 ? 5 : 10;
		return data.map((d, i) => ({
			x: PAD.left + (i / (n - 1)) * innerW,
			label: d.date.toLocaleDateString('en-US', n <= 7 ? { weekday: 'short' } : { month: 'short', day: 'numeric' }),
			show: i % step === 0 || i === n - 1,
		}));
	});

	// Tooltip
	let tooltip = $state<{ x: number; y: number; value: number; label: string } | null>(null);
	let chartEl = $state<SVGSVGElement | null>(null);

	function onChartMove(e: MouseEvent) {
		if (!chartEl) return;
		const rect = chartEl.getBoundingClientRect();
		const scaleX = W / rect.width;
		const mx = (e.clientX - rect.left) * scaleX;
		const pts = chartPts();
		let closest = pts[0];
		let minDist = Math.abs(pts[0].x - mx);
		for (const p of pts) {
			const d = Math.abs(p.x - mx);
			if (d < minDist) { minDist = d; closest = p; }
		}
		const label = closest.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		tooltip = { x: (closest.x / W) * rect.width, y: closest.y, value: closest.value, label };
	}

	// ── Regression badges ──────────────────────────────────────────────────────
	// Compare first vs second half; if second half has more high-sev findings → regression
	const regressionBadge = $derived(() => {
		const t = trend();
		if (t >= 15) return { label: 'Regressing', color: 'var(--red)' };
		if (t >= 5) return { label: 'Slight uptick', color: '#f97316' };
		if (t <= -10) return { label: 'Improving', color: 'var(--green)' };
		return null;
	});
</script>

<svelte:head>
	<title>Analytics — RunOwl</title>
</svelte:head>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="analytics-page" onmouseleave={() => (tooltip = null)}>
	<div class="page-head">
		<div>
			<h1 class="page-title">Analytics</h1>
			<p class="page-sub">Code quality trends, finding distributions, and repo health.</p>
		</div>

		{#if hasAccess}
			<!-- Date range selector -->
			<div class="range-group">
				<Calendar size={13} color="var(--muted)" />
				{#each (['7d', '30d', '90d'] as Range[]) as r}
					<button class="range-btn" class:active={range === r} onclick={() => (range = r)}>
						{r}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	{#if !hasAccess}
		<UpgradeGate feature="Analytics" requiredPlan="team" />
	{:else}
		<!-- ── Summary stat cards ──────────────────────────────────────────────── -->
		<div class="stat-row">
			<div class="stat-card">
				<span class="stat-label">Total Reviews</span>
				<span class="stat-value">{totalReviews()}</span>
				<div class="stat-trend" class:trend-up={trend() > 0} class:trend-down={trend() < 0}>
					{#if trend() > 0}
						<TrendingUp size={12} />+{trend()}%
					{:else if trend() < 0}
						<TrendingDown size={12} />{trend()}%
					{:else}
						<Minus size={12} />Flat
					{/if}
					<span class="trend-label">vs prior period</span>
				</div>
			</div>
			<div class="stat-card">
				<span class="stat-label">Findings Caught</span>
				<span class="stat-value">{totalFindings()}</span>
				{#if regressionBadge()}
					<span class="regression-badge" style="color: {regressionBadge()!.color}; border-color: {regressionBadge()!.color}">
						{regressionBadge()!.label}
					</span>
				{/if}
			</div>
			<div class="stat-card">
				<span class="stat-label">Avg Findings / PR</span>
				<span class="stat-value">{avgFindings()}</span>
			</div>
			<div class="stat-card">
				<span class="stat-label">High Severity</span>
				<span class="stat-value" style="color: var(--red);">{dist().find((d) => d.label === 'High')?.value ?? 0}</span>
			</div>
		</div>

		<!-- ── Activity chart ─────────────────────────────────────────────────── -->
		<div class="chart-card">
			<div class="chart-head">
				<div>
					<span class="chart-title">Review Activity</span>
					<span class="chart-sub">PRs reviewed per day · last {rangeDays[range]} days</span>
				</div>
			</div>

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
						<linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color="var(--accent)" stop-opacity="0.22" />
							<stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
						</linearGradient>
						<filter id="glow">
							<feGaussianBlur stdDeviation="2" result="blur" />
							<feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
						</filter>
					</defs>

					{#each yTicks() as tick (tick.v)}
						<line x1={PAD.left} y1={tick.y} x2={W - PAD.right} y2={tick.y} stroke="var(--border)" stroke-width="0.5" stroke-dasharray="3 3" />
						<text x={PAD.left - 4} y={tick.y + 3} text-anchor="end" class="axis-label">{tick.v}</text>
					{/each}

					<path d={areaPath()} fill="url(#aGrad)" />
					<path d={linePath()} fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)" />

					{#each chartPts() as p, i}
						{#if chartData()[i].reviews > 0}
							<circle cx={p.x} cy={p.y} r="3" fill="var(--accent)" />
						{/if}
					{/each}

					{#each xLabels() as lbl}
						{#if lbl.show}
							<text x={lbl.x} y={H - 4} text-anchor="middle" class="axis-label">{lbl.label}</text>
						{/if}
					{/each}
				</svg>

				{#if tooltip}
					<div
						class="tooltip"
						style="left: {tooltip.x}px; top: 0;"
					>
						<span class="tooltip-label">{tooltip.label}</span>
						<span class="tooltip-val">{tooltip.value} PR{tooltip.value !== 1 ? 's' : ''}</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- ── Bottom: donut + repos ──────────────────────────────────────────── -->
		<div class="bot-grid">
			<!-- Findings distribution -->
			<div class="chart-card">
				<div class="chart-head">
					<span class="chart-title">Finding Distribution</span>
					<span class="chart-sub">{rangeDays[range]}-day window</span>
				</div>
				<div class="donut-wrap">
					<svg viewBox="0 0 110 110" class="donut-svg" role="img" aria-label="Findings distribution">
						{#each dist() as slice, i}
							{@const r = 42}
							{@const C = 2 * Math.PI * r}
							{@const pct = slice.value / distTotal()}
							{@const offset = dist().slice(0, i).reduce((s, d) => s + d.value / distTotal(), 0)}
							<circle
								cx="55" cy="55" r={r}
								fill="none"
								stroke={slice.color}
								stroke-width="14"
								stroke-dasharray="{(pct * C).toFixed(2)} {C}"
								stroke-dashoffset="{(-offset * C).toFixed(2)}"
								transform="rotate(-90 55 55)"
								opacity="0.9"
							/>
						{/each}
						<text x="55" y="52" text-anchor="middle" class="donut-center-num">{distTotal()}</text>
						<text x="55" y="63" text-anchor="middle" class="donut-center-label">reviews</text>
					</svg>
					<div class="donut-legend">
						{#each dist() as slice}
							<div class="legend-row">
								<span class="legend-dot" style="background: {slice.color};"></span>
								<span class="legend-label">{slice.label}</span>
								<div class="legend-track">
									<div class="legend-fill" style="width: {(slice.value / distTotal() * 100).toFixed(1)}%; background: {slice.color};"></div>
								</div>
								<span class="legend-count">{slice.value}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Top repos -->
			<div class="chart-card">
				<div class="chart-head">
					<span class="chart-title">Top Repositories</span>
					<span class="chart-sub">by review count</span>
				</div>
				<div class="repo-list">
					{#each topRepos() as repo, i}
						<div class="repo-row">
							<span class="repo-rank">#{i + 1}</span>
							<span class="repo-name" title={repo.repo}>{repo.repo}</span>
							<div class="repo-bar-track">
								<div class="repo-bar-fill" style="width: {((repo.count / maxRepoCount()) * 100).toFixed(1)}%; animation-delay: {i * 80}ms"></div>
							</div>
							<span class="repo-count">{repo.count}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.analytics-page {
		padding: 2rem 2.5rem 3rem;
		max-width: 1100px;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.page-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}
	.page-title { font-size: 1.45rem; font-weight: 700; letter-spacing: -0.03em; color: var(--text); margin-bottom: 0.2rem; }
	.page-sub { font-size: 0.82rem; color: var(--muted); }

	/* Date range */
	.range-group {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.3rem 0.5rem;
		flex-shrink: 0;
	}
	.range-btn {
		background: none;
		border: none;
		border-radius: 5px;
		padding: 0.2rem 0.55rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--muted);
		cursor: pointer;
		font-family: inherit;
		transition: background 0.12s, color 0.12s;
	}
	.range-btn.active { background: var(--surface-2); color: var(--text); }
	.range-btn:hover:not(.active) { color: var(--text); }

	/* Stat row */
	.stat-row {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.85rem;
	}
	.stat-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1rem 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.stat-label { font-size: 0.72rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
	.stat-value { font-size: 1.6rem; font-weight: 800; color: var(--text); letter-spacing: -0.04em; line-height: 1; }
	.stat-trend {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.72rem;
		color: var(--muted);
		margin-top: 0.1rem;
	}
	.trend-up { color: var(--green); }
	.trend-down { color: var(--red); }
	.trend-label { color: var(--muted); font-size: 0.68rem; }
	.regression-badge {
		display: inline-flex;
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		border: 1px solid;
		border-radius: 4px;
		padding: 0.15rem 0.4rem;
		align-self: flex-start;
	}

	/* Chart card */
	.chart-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.chart-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}
	.chart-title { font-size: 0.85rem; font-weight: 700; color: var(--text); display: block; }
	.chart-sub { font-size: 0.72rem; color: var(--muted); display: block; margin-top: 0.1rem; }

	/* Activity SVG */
	.chart-wrap { position: relative; }
	.activity-svg { width: 100%; height: auto; display: block; cursor: crosshair; overflow: visible; }
	.axis-label { font-size: 8px; fill: var(--muted); font-family: inherit; }

	.tooltip {
		position: absolute;
		transform: translateX(-50%);
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.3rem 0.6rem;
		font-size: 0.72rem;
		color: var(--text);
		pointer-events: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.1rem;
		white-space: nowrap;
		box-shadow: 0 4px 12px rgba(0,0,0,0.2);
		z-index: 10;
	}
	.tooltip-label { color: var(--muted); }
	.tooltip-val { font-weight: 700; }

	/* Bottom grid */
	.bot-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	/* Donut */
	.donut-wrap { display: flex; align-items: center; gap: 1rem; }
	.donut-svg { width: 110px; height: 110px; flex-shrink: 0; }
	.donut-center-num { font-size: 14px; font-weight: 800; fill: var(--text); }
	.donut-center-label { font-size: 7px; fill: var(--muted); }
	.donut-legend { flex: 1; display: flex; flex-direction: column; gap: 0.45rem; }
	.legend-row { display: flex; align-items: center; gap: 0.4rem; }
	.legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
	.legend-label { font-size: 0.75rem; color: var(--text); min-width: 52px; }
	.legend-track { flex: 1; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
	.legend-fill { height: 100%; border-radius: 2px; transition: width 0.5s cubic-bezier(0.16,1,0.3,1); }
	.legend-count { font-size: 0.72rem; color: var(--muted); min-width: 20px; text-align: right; }

	/* Repos */
	.repo-list { display: flex; flex-direction: column; gap: 0.6rem; }
	.repo-row { display: flex; align-items: center; gap: 0.6rem; }
	.repo-rank { font-size: 0.7rem; color: var(--muted); min-width: 20px; }
	.repo-name { font-size: 0.8rem; color: var(--text); min-width: 80px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.repo-bar-track { flex: 1; height: 5px; background: var(--border); border-radius: 3px; overflow: hidden; }
	.repo-bar-fill {
		height: 100%;
		background: var(--accent);
		border-radius: 3px;
		animation: growBar 0.6s cubic-bezier(0.16,1,0.3,1) both;
	}
	@keyframes growBar { from { width: 0 !important; } }
	.repo-count { font-size: 0.75rem; color: var(--muted); min-width: 20px; text-align: right; }

	@media (max-width: 900px) {
		.stat-row { grid-template-columns: repeat(2, 1fr); }
		.bot-grid { grid-template-columns: 1fr; }
	}
	@media (max-width: 640px) {
		.analytics-page { padding: 1.25rem 1rem 2rem; }
		.stat-row { grid-template-columns: 1fr 1fr; }
		.page-head { flex-direction: column; }
	}
</style>
