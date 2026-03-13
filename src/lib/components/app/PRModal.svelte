<script lang="ts">
	import { prModal } from '$lib/stores/modal.svelte';
	import { goto } from '$app/navigation';
	import { GitPullRequest, X, ArrowRight, ExternalLink } from 'lucide-svelte';

	let url = $state('');
	let error = $state('');
	let loading = $state(false);

	// Sync prefill whenever modal opens
	$effect(() => {
		if (prModal.open) {
			url = prModal.prefill;
			error = '';
			loading = false;
		}
	});

	const PR_RE = /https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;

	function validate(val: string) {
		if (!val.trim()) return 'Please enter a GitHub PR URL.';
		if (!PR_RE.test(val.trim()))
			return 'Must be a valid GitHub PR URL — e.g. https://github.com/owner/repo/pull/123';
		return '';
	}

	async function submit() {
		error = validate(url);
		if (error) return;
		loading = true;
		prModal.hide();
		await goto(`/app/review?pr=${encodeURIComponent(url.trim())}`);
		loading = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') prModal.hide();
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			submit();
		}
	}

	function onBackdropClick(e: MouseEvent) {
		if ((e.target as HTMLElement).classList.contains('modal-backdrop')) prModal.hide();
	}
</script>

{#if prModal.open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="modal-backdrop"
		onkeydown={onKeydown}
		onclick={onBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-label="Load Pull Request"
		tabindex="-1"
	>
		<div class="modal">
			<!-- Header -->
			<div class="modal-header">
				<div class="modal-title-row">
					<span class="modal-icon">
						<GitPullRequest size={16} color="var(--accent)" />
					</span>
					<h2 class="modal-title">Load Pull Request</h2>
				</div>
				<button class="close-btn" onclick={() => prModal.hide()} aria-label="Close">
					<X size={16} />
				</button>
			</div>

			<!-- Body -->
			<div class="modal-body">
				<p class="modal-hint">
					Paste any public GitHub PR URL and RunOwl will load the diff, files, and run an AI review.
				</p>

				<label class="field-label" for="pr-url">GitHub PR URL</label>
				<div class="input-wrap" class:input-error={!!error}>
					<span class="input-icon"><ExternalLink size={14} color="var(--muted)" /></span>
					<input
						id="pr-url"
						type="url"
						class="pr-input"
						placeholder="https://github.com/owner/repo/pull/123"
						bind:value={url}
						oninput={() => (error = '')}
						spellcheck={false}
					/>
				</div>
				{#if error}
					<p class="error-msg">{error}</p>
				{/if}

				<!-- Example links -->
				<div class="examples">
					<span class="examples-label">Try an example:</span>
					<button
						class="example-chip"
						onclick={() => (url = 'https://github.com/sveltejs/svelte/pull/1')}
					>
						sveltejs/svelte #1
					</button>
				</div>
			</div>

			<!-- Footer -->
			<div class="modal-footer">
				<button class="btn-ghost" onclick={() => prModal.hide()}>Cancel</button>
				<button class="btn-primary" onclick={submit} disabled={loading}>
					{#if loading}
						<span class="spinner"></span>
						Loading…
					{:else}
						Load PR
						<ArrowRight size={14} />
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 200;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		animation: fadeIn 0.15s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
	}

	.modal {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		width: 100%;
		max-width: 480px;
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.04) inset,
			0 24px 64px rgba(0, 0, 0, 0.5);
		animation: slideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
		overflow: hidden;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.98);
		}
	}

	/* Header */
	.modal-header {
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
		flex-shrink: 0;
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
		transition:
			color 0.12s,
			border-color 0.12s,
			background 0.12s;
	}
	.close-btn:hover {
		color: var(--text);
		border-color: var(--muted);
		background: var(--surface-2);
	}

	/* Body */
	.modal-body {
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.modal-hint {
		font-size: 0.8rem;
		color: var(--muted);
		line-height: 1.6;
		margin-bottom: 0.25rem;
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
	.input-wrap:focus-within {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent);
	}
	.input-wrap.input-error {
		border-color: var(--red);
	}
	.input-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.pr-input {
		flex: 1;
		background: none;
		border: none;
		outline: none;
		font-size: 0.85rem;
		color: var(--text);
		font-family: inherit;
		padding: 0.7rem 0;
	}
	.pr-input::placeholder {
		color: var(--muted);
		opacity: 0.6;
	}

	.error-msg {
		font-size: 0.75rem;
		color: var(--red);
		margin-top: -0.2rem;
	}

	/* Examples */
	.examples {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-top: 0.1rem;
	}
	.examples-label {
		font-size: 0.72rem;
		color: var(--muted);
	}
	.example-chip {
		font-size: 0.72rem;
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 8%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 18%, transparent);
		border-radius: 5px;
		padding: 0.15rem 0.5rem;
		cursor: pointer;
		font-family: monospace;
		transition: background 0.12s;
	}
	.example-chip:hover {
		background: color-mix(in srgb, var(--accent) 15%, transparent);
	}

	/* Footer */
	.modal-footer {
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
		transition:
			color 0.12s,
			border-color 0.12s;
	}
	.btn-ghost:hover {
		color: var(--text);
		border-color: var(--muted);
	}

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
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.btn-primary:not(:disabled):hover {
		opacity: 0.9;
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
</style>
