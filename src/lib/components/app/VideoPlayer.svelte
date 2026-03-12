<script lang="ts">
	/**
	 * Video player for test failure recordings.
	 * Accepts a video URL (webm/mp4) and an optional list of timeline markers.
	 */

	interface TimelineMarker {
		offset_ms: number;
		label: string;
	}

	let {
		src,
		markers = [],
		linkedAssertionMs = null,
	}: {
		src: string;
		markers?: TimelineMarker[];
		linkedAssertionMs?: number | null;
	} = $props();

	let videoEl = $state<HTMLVideoElement | null>(null);
	let playing = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let playbackRate = $state(1);
	let loading = $state(true);
	let error = $state(false);

	const rates = [0.25, 0.5, 1, 1.5, 2];

	const progress = $derived(duration > 0 ? (currentTime / duration) * 100 : 0);

	function formatTime(s: number): string {
		const m = Math.floor(s / 60);
		const sec = Math.floor(s % 60);
		return `${m}:${sec.toString().padStart(2, '0')}`;
	}

	function togglePlay() {
		if (!videoEl) return;
		if (playing) {
			videoEl.pause();
		} else {
			videoEl.play();
		}
	}

	function seek(e: MouseEvent) {
		if (!videoEl || !duration) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const pct = (e.clientX - rect.left) / rect.width;
		videoEl.currentTime = pct * duration;
	}

	function seekToMarker(ms: number) {
		if (!videoEl) return;
		videoEl.currentTime = ms / 1000;
		if (!playing) videoEl.play();
	}

	function cycleRate() {
		const idx = rates.indexOf(playbackRate);
		const next = rates[(idx + 1) % rates.length];
		playbackRate = next;
		if (videoEl) videoEl.playbackRate = next;
	}

	$effect(() => {
		// Reset transient state when src changes so a previous error/position doesn't leak
		src;
		error = false;
		loading = true;
		playing = false;
		currentTime = 0;
		duration = 0;
		if (videoEl) videoEl.load();
	});

	$effect(() => {
		// Jump to linked assertion offset when provided
		if (linkedAssertionMs !== null && videoEl && duration > 0) {
			videoEl.currentTime = linkedAssertionMs / 1000;
		}
	});
</script>

<div class="video-player">
	{#if error}
		<div class="video-error">
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line
					x1="12"
					y1="16"
					x2="12.01"
					y2="16"
				/>
			</svg>
			<p>Unable to load recording.</p>
		</div>
	{:else}
		<div class="video-wrap">
			<!-- svelte-ignore a11y_media_has_caption -->
			<video
				bind:this={videoEl}
				{src}
				onplay={() => (playing = true)}
				onpause={() => (playing = false)}
				ontimeupdate={() => {
					if (videoEl) currentTime = videoEl.currentTime;
				}}
				onloadedmetadata={() => {
					if (videoEl) {
						duration = videoEl.duration;
						loading = false;
					}
				}}
				onerror={() => {
					error = true;
					loading = false;
				}}
				onwaiting={() => (loading = true)}
				oncanplay={() => (loading = false)}
				preload="metadata"
				playsinline
			></video>

			{#if loading}
				<div class="video-overlay">
					<div class="spinner-large"></div>
				</div>
			{/if}

			<!-- Click overlay for play/pause -->
			<button class="play-overlay" onclick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
				{#if !playing}
					<span class="play-icon">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
							<polygon points="5 3 19 12 5 21 5 3" />
						</svg>
					</span>
				{/if}
			</button>
		</div>

		<!-- Controls -->
		<div class="controls">
			<!-- Progress bar with markers -->
			<div class="progress-wrap">
				<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_no_noninteractive_element_interactions a11y_role_has_required_aria_props a11y_interactive_supports_focus -->
				<div class="progress-track" onclick={seek} title="Seek">
					<div class="progress-fill" style="width: {progress}%;"></div>
					<!-- Timeline markers -->
					{#each markers as marker}
						{@const pct = duration > 0 ? (marker.offset_ms / 1000 / duration) * 100 : 0}
						<button
							class="marker"
							style="left: {pct}%;"
							onclick={(e) => {
								e.stopPropagation();
								seekToMarker(marker.offset_ms);
							}}
							title={marker.label}
						></button>
					{/each}
					{#if linkedAssertionMs !== null && duration > 0}
						{@const pct = (linkedAssertionMs / 1000 / duration) * 100}
						<div
							class="marker assertion-marker"
							style="left: {pct}%;"
							title="Failing assertion"
						></div>
					{/if}
				</div>
				<div class="time-labels">
					<span>{formatTime(currentTime)}</span>
					<span>{formatTime(duration)}</span>
				</div>
			</div>

			<!-- Buttons row -->
			<div class="btn-row">
				<button class="ctrl-btn" onclick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
					{#if playing}
						<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
							<rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
						</svg>
					{:else}
						<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
							<polygon points="5 3 19 12 5 21 5 3" />
						</svg>
					{/if}
				</button>

				<!-- Seek back 5s -->
				<button
					class="ctrl-btn"
					onclick={() => {
						if (videoEl) videoEl.currentTime = Math.max(0, currentTime - 5);
					}}
					aria-label="-5s"
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.7" />
					</svg>
				</button>

				<!-- Seek forward 5s -->
				<button
					class="ctrl-btn"
					onclick={() => {
						if (videoEl) videoEl.currentTime = Math.min(duration, currentTime + 5);
					}}
					aria-label="+5s"
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						style="transform: scaleX(-1)"
					>
						<polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.7" />
					</svg>
				</button>

				<button class="ctrl-btn rate-btn" onclick={cycleRate} title="Playback speed">
					{playbackRate}×
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.video-player {
		display: flex;
		flex-direction: column;
		background: #000;
		border-radius: 10px;
		overflow: hidden;
		border: 1px solid var(--border);
	}

	.video-wrap {
		position: relative;
		background: #000;
		aspect-ratio: 16/9;
		overflow: hidden;
	}

	video {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}

	.video-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.4);
	}

	.play-overlay {
		position: absolute;
		inset: 0;
		background: none;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.play-icon {
		display: flex;
		width: 52px;
		height: 52px;
		background: rgba(0, 0, 0, 0.6);
		border-radius: 50%;
		align-items: center;
		justify-content: center;
		color: #fff;
		opacity: 0;
		transition: opacity 0.15s;
	}
	.video-wrap:hover .play-icon {
		opacity: 1;
	}

	.spinner-large {
		width: 32px;
		height: 32px;
		border: 3px solid rgba(255, 255, 255, 0.2);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.controls {
		padding: 0.625rem 0.875rem;
		background: var(--surface);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.progress-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.progress-track {
		height: 5px;
		background: var(--border);
		border-radius: 99px;
		cursor: pointer;
		position: relative;
	}

	.progress-fill {
		height: 100%;
		background: var(--accent);
		border-radius: 99px;
		pointer-events: none;
		transition: width 0.1s linear;
	}

	.marker {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--yellow);
		border: none;
		cursor: pointer;
		padding: 0;
	}
	.marker:hover {
		background: #fff;
	}

	.assertion-marker {
		background: var(--red);
		width: 10px;
		height: 10px;
	}

	.time-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.7rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}

	.btn-row {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.ctrl-btn {
		background: none;
		border: none;
		color: var(--muted);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.3rem 0.4rem;
		border-radius: 5px;
		transition:
			color 0.15s,
			background 0.15s;
	}
	.ctrl-btn:hover {
		color: var(--text);
		background: var(--surface-2);
	}

	.rate-btn {
		font-size: 0.72rem;
		font-weight: 700;
		font-family: monospace;
		min-width: 28px;
	}

	.video-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 3rem;
		color: var(--muted);
		aspect-ratio: 16/9;
	}
	.video-error p {
		font-size: 0.85rem;
	}
</style>
