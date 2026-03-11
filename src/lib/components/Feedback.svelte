<script lang="ts">
	import { ThumbsUp, Bug, Lightbulb, Send, CheckCircle, AlertCircle } from 'lucide-svelte';
	import type { FeedbackType } from '$lib/supabase';

	type Tab = { id: FeedbackType; label: string; Icon: typeof ThumbsUp; placeholder: string };

	const tabs: Tab[] = [
		{
			id: 'general',
			label: 'General',
			Icon: ThumbsUp,
			placeholder: "What's working well, or what could we do better?",
		},
		{
			id: 'bug',
			label: 'Bug Report',
			Icon: Bug,
			placeholder: 'Describe what happened and how to reproduce it…',
		},
		{
			id: 'feature',
			label: 'Feature Request',
			Icon: Lightbulb,
			placeholder: 'What would make RunOwl better for you?',
		},
	];

	let activeType: FeedbackType = $state('general');
	let message = $state('');
	let email = $state('');
	let status: 'idle' | 'submitting' | 'success' | 'error' = $state('idle');
	let errorMsg = $state('');

	const activePlaceholder = $derived(tabs.find((t) => t.id === activeType)?.placeholder ?? '');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (status === 'submitting') return;

		status = 'submitting';
		errorMsg = '';

		try {
			const res = await fetch('/api/feedback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: activeType,
					message: message.trim(),
					email: email.trim() || null,
					page: window.location.pathname,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				status = 'error';
				errorMsg = data.error ?? 'Something went wrong. Please try again.';
			} else {
				status = 'success';
				message = '';
				email = '';
			}
		} catch {
			status = 'error';
			errorMsg = 'Network error. Please try again.';
		}
	}

	function reset() {
		status = 'idle';
		errorMsg = '';
	}
</script>

<section class="feedback-section">
	<div class="section-wrap">
		<div class="feedback-header">
			<span class="label">Feedback</span>
			<h2>Help us build something you love</h2>
			<p class="subtitle">
				RunOwl is built in the open. Your feedback shapes every release.
			</p>
		</div>

		<div class="feedback-card">
			{#if status === 'success'}
				<div class="success-state">
					<CheckCircle size={40} class="success-icon" />
					<h3>Thanks for the feedback!</h3>
					<p>We read every submission and use it to improve RunOwl.</p>
					<button class="reset-btn" onclick={reset}>Send more feedback</button>
				</div>
			{:else}
				<div class="tabs" role="tablist">
					{#each tabs as tab}
						<button
							role="tab"
							aria-selected={activeType === tab.id}
							class="tab"
							class:active={activeType === tab.id}
							onclick={() => { activeType = tab.id; reset(); }}
						>
							<tab.Icon size={14} />
							{tab.label}
						</button>
					{/each}
				</div>

				<form onsubmit={handleSubmit} class="feedback-form">
					<textarea
						bind:value={message}
						placeholder={activePlaceholder}
						rows={5}
						required
						minlength={10}
						maxlength={2000}
						class="textarea"
						disabled={status === 'submitting'}
					></textarea>

					<div class="form-footer">
						<input
							type="email"
							bind:value={email}
							placeholder="Email (optional — for follow-up)"
							class="email-input"
							disabled={status === 'submitting'}
						/>

						<button type="submit" class="submit-btn" disabled={status === 'submitting' || message.trim().length < 10}>
							{#if status === 'submitting'}
								<span class="spinner" aria-hidden="true"></span>
								Sending…
							{:else}
								<Send size={14} />
								Send feedback
							{/if}
						</button>
					</div>

					{#if status === 'error'}
						<div class="error-banner" role="alert">
							<AlertCircle size={14} />
							{errorMsg}
						</div>
					{/if}
				</form>
			{/if}
		</div>
	</div>
</section>

<style>
	.feedback-section {
		padding: 6rem 0;
		border-top: 1px solid var(--border);
	}

	.feedback-header {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	.label {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: 0.75rem;
	}

	h2 {
		font-size: clamp(1.75rem, 3.5vw, 2.5rem);
		font-weight: 800;
		letter-spacing: -0.03em;
		color: var(--text);
		margin-bottom: 0.75rem;
	}

	.subtitle {
		font-size: 1rem;
		color: var(--muted);
		line-height: 1.7;
	}

	/* Card */
	.feedback-card {
		max-width: 42rem;
		margin: 0 auto;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 16px;
		overflow: hidden;
	}

	/* Tabs */
	.tabs {
		display: flex;
		border-bottom: 1px solid var(--border);
	}

	.tab {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 0.9rem 1rem;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--muted);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s;
		margin-bottom: -1px;
	}
	.tab:hover { color: var(--text); }
	.tab.active {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}

	/* Form */
	.feedback-form {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.textarea {
		width: 100%;
		resize: vertical;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.85rem 1rem;
		font-size: 0.9rem;
		color: var(--text);
		font-family: inherit;
		line-height: 1.6;
		transition: border-color 0.15s;
		box-sizing: border-box;
	}
	.textarea::placeholder { color: var(--muted); }
	.textarea:focus { outline: none; border-color: var(--accent); }
	.textarea:disabled { opacity: 0.5; }

	.form-footer {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	@media (max-width: 540px) {
		.form-footer { flex-direction: column; }
	}

	.email-input {
		flex: 1;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.65rem 0.9rem;
		font-size: 0.875rem;
		color: var(--text);
		font-family: inherit;
		transition: border-color 0.15s;
		min-width: 0;
	}
	.email-input::placeholder { color: var(--muted); }
	.email-input:focus { outline: none; border-color: var(--accent); }
	.email-input:disabled { opacity: 0.5; }

	.submit-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.65rem 1.25rem;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
		transition: opacity 0.15s, transform 0.15s;
	}
	.submit-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
	.submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }

	/* Spinner */
	.spinner {
		width: 13px;
		height: 13px;
		border: 2px solid rgba(255,255,255,0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	/* Error */
	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem 0.9rem;
		background: rgba(var(--red-rgb, 255,60,60), 0.08);
		border: 1px solid rgba(var(--red-rgb, 255,60,60), 0.2);
		border-radius: 8px;
		font-size: 0.85rem;
		color: var(--red, #e53e3e);
	}

	/* Success */
	.success-state {
		padding: 3rem 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.75rem;
	}

	:global(.success-icon) { color: var(--green); }

	.success-state h3 {
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--text);
	}

	.success-state p {
		font-size: 0.9rem;
		color: var(--muted);
	}

	.reset-btn {
		margin-top: 0.5rem;
		padding: 0.55rem 1.25rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: none;
		color: var(--muted);
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s;
	}
	.reset-btn:hover { color: var(--text); border-color: var(--muted); }
</style>
