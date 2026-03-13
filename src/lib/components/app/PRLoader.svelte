<script lang="ts">
	import { reviewStore } from '$lib/stores/review.svelte';
	import { githubIntegration } from '$lib/stores/github-integration.svelte';
	import { privateRepoModal } from '$lib/stores/private-repo-modal.svelte';
	import { Lock } from 'lucide-svelte';

	let inputUrl = $state('');
	let inputError = $state('');

	function validate(url: string): string {
		if (!url.trim()) return 'Please enter a GitHub PR URL.';
		if (!/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(url)) {
			return 'Must be a GitHub PR URL: https://github.com/owner/repo/pull/123';
		}
		return '';
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		inputError = validate(inputUrl);
		if (inputError) return;
		await reviewStore.loadPR(inputUrl.trim());
	}

	const isLoading = $derived(reviewStore.status === 'loading_pr');

	const isPrivateRepoError = $derived(
		reviewStore.status === 'error' &&
		(reviewStore.errorMsg?.includes('403') ||
		 reviewStore.errorMsg?.includes('404') ||
		 reviewStore.errorMsg?.toLowerCase().includes('not found') ||
		 reviewStore.errorMsg?.toLowerCase().includes('private'))
	);

	$effect(() => {
		if (!isPrivateRepoError || githubIntegration.connected) return;
		const match = /github\.com\/([^/]+\/[^/]+)\/pull/.exec(inputUrl);
		const repoName = match ? match[1] : '';
		const url = inputUrl;
		privateRepoModal.show(repoName, () => {
			reviewStore.loadPR(url.trim());
		});
	});

	function openConnectModal() {
		const match = /github\.com\/([^/]+\/[^/]+)\/pull/.exec(inputUrl);
		privateRepoModal.show(match ? match[1] : '', () => {
			reviewStore.loadPR(inputUrl.trim());
		});
	}
</script>

<div class="pr-loader">
	<div class="loader-inner">
		<h1 class="loader-title">Review a Pull Request</h1>
		<p class="loader-sub">Paste a GitHub PR URL to load the diff and start an AI review.</p>

		<form onsubmit={handleSubmit} class="loader-form">
			<div class="input-row">
				<div class="input-wrap" class:has-error={!!inputError}>
					<svg
						class="input-icon"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
						/>
					</svg>
					<input
						type="url"
						placeholder="https://github.com/owner/repo/pull/42"
						bind:value={inputUrl}
						disabled={isLoading}
						oninput={() => (inputError = '')}
						autocomplete="url"
						spellcheck="false"
					/>
				</div>
				<button type="submit" class="btn-review" disabled={isLoading}>
					{#if isLoading}
						<span class="spinner"></span>
						Loading…
					{:else}
						Load PR
					{/if}
				</button>
			</div>

			{#if inputError}
				<p class="field-error">{inputError}</p>
			{/if}

			{#if reviewStore.status === 'error'}
				{#if isPrivateRepoError && !githubIntegration.connected}
					<div class="private-repo-banner" role="alert">
						<Lock size={14} />
						<span>This looks like a private repository.</span>
						<button class="inline-connect-btn" onclick={openConnectModal}>
							Connect GitHub to continue →
						</button>
					</div>
				{:else}
					<div class="api-error" role="alert">
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line
								x1="12"
								y1="16"
								x2="12.01"
								y2="16"
							/>
						</svg>
						{reviewStore.errorMsg}
					</div>
				{/if}
			{/if}
		</form>

		{#if isLoading}
			<div class="loading-skeleton">
				<div class="skel skel-wide"></div>
				<div class="skel skel-med"></div>
				<div class="skel skel-short"></div>
			</div>
		{/if}

		<div class="examples">
			<span class="examples-label">Try an example:</span>
			<button
				class="example-pill"
				onclick={() => {
					inputUrl = 'https://github.com/sveltejs/kit/pull/1';
					inputError = '';
				}}
			>
				sveltejs/kit#1
			</button>
		</div>
	</div>
</div>

<style>
	.pr-loader {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 3rem 1.5rem;
	}

	.loader-inner {
		width: 100%;
		max-width: 560px;
	}

	.loader-title {
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.025em;
		color: var(--text);
		margin-bottom: 0.4rem;
	}

	.loader-sub {
		font-size: 0.875rem;
		color: var(--muted);
		margin-bottom: 1.75rem;
	}

	.loader-form {
		margin-bottom: 1.25rem;
	}

	.input-row {
		display: flex;
		gap: 0.5rem;
	}

	.input-wrap {
		flex: 1;
		position: relative;
	}

	.input-icon {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--muted);
		pointer-events: none;
	}

	input {
		width: 100%;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.65rem 0.875rem 0.65rem 2.25rem;
		font-size: 0.875rem;
		color: var(--text);
		outline: none;
		font-family: 'SF Mono', 'Fira Code', monospace;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}
	input::placeholder {
		color: var(--muted);
		opacity: 0.5;
	}
	input:focus {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-glow);
	}
	input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.has-error input {
		border-color: var(--red);
	}

	.btn-review {
		padding: 0 1.25rem;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		white-space: nowrap;
		font-family: inherit;
		transition: opacity 0.15s;
	}
	.btn-review:hover:not(:disabled) {
		opacity: 0.88;
	}
	.btn-review:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.spinner {
		width: 13px;
		height: 13px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.field-error {
		margin-top: 0.4rem;
		font-size: 0.8rem;
		color: var(--red);
	}

	.private-repo-banner {
		margin-top: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: color-mix(in srgb, var(--yellow) 8%, transparent);
		border: 1px solid color-mix(in srgb, var(--yellow) 25%, transparent);
		border-left: 3px solid var(--yellow);
		border-radius: 8px;
		padding: 0.65rem 0.875rem;
		font-size: 0.83rem;
		color: var(--text);
		flex-wrap: wrap;
	}
	.inline-connect-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.83rem;
		font-weight: 600;
		color: var(--accent);
		font-family: inherit;
		padding: 0;
		transition: opacity 0.12s;
		white-space: nowrap;
	}
	.inline-connect-btn:hover { opacity: 0.8; text-decoration: underline; }

	.api-error {
		margin-top: 0.75rem;
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		background: rgba(248, 113, 113, 0.08);
		border: 1px solid rgba(248, 113, 113, 0.2);
		border-radius: 8px;
		padding: 0.65rem 0.875rem;
		font-size: 0.83rem;
		color: var(--red);
		line-height: 1.5;
	}
	.api-error svg {
		flex-shrink: 0;
		margin-top: 1px;
	}

	/* Skeleton loaders */
	.loading-skeleton {
		margin-top: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.skel {
		height: 14px;
		background: var(--surface);
		border-radius: 6px;
		animation: shimmer 1.4s ease infinite;
		background: linear-gradient(
			90deg,
			var(--surface) 25%,
			var(--surface-2) 50%,
			var(--surface) 75%
		);
		background-size: 200% 100%;
	}
	.skel-wide {
		width: 100%;
	}
	.skel-med {
		width: 72%;
	}
	.skel-short {
		width: 48%;
	}
	@keyframes shimmer {
		to {
			background-position: -200% 0;
		}
	}

	.examples {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
	}
	.examples-label {
		font-size: 0.78rem;
		color: var(--muted);
	}
	.example-pill {
		font-size: 0.78rem;
		padding: 0.2rem 0.6rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 99px;
		color: var(--muted);
		cursor: pointer;
		font-family: monospace;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.example-pill:hover {
		color: var(--accent);
		border-color: var(--accent);
	}
</style>
