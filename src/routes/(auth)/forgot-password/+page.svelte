<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Reset password — RunOwl</title>
</svelte:head>

{#if form?.success}
	<div class="success-state">
		<div class="success-icon">
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
				<polyline points="22,6 12,13 2,6"/>
			</svg>
		</div>
		<h2>Check your email</h2>
		<p>If an account exists for <strong>{form.email}</strong>, we've sent a password reset link.</p>
		<a href="/login" class="btn-secondary">Back to sign in</a>
	</div>
{:else}
	<div class="auth-header">
		<h1>Reset your password</h1>
		<p>Enter your email and we'll send you a reset link</p>
	</div>

	{#if form?.error}
		<div class="error-banner" role="alert">{form.error}</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				await update();
				loading = false;
			};
		}}
	>
		<div class="field">
			<label for="email">Email</label>
			<input
				id="email"
				name="email"
				type="email"
				autocomplete="email"
				placeholder="you@company.com"
				value={form?.email ?? ''}
				required
				disabled={loading}
			/>
		</div>

		<button type="submit" class="btn-primary" disabled={loading}>
			{#if loading}
				<span class="spinner"></span>
				Sending…
			{:else}
				Send reset link
			{/if}
		</button>
	</form>

	<p class="switch-link">
		<a href="/login">← Back to sign in</a>
	</p>
{/if}

<style>
	.auth-header {
		margin-bottom: 1.75rem;
	}
	.auth-header h1 {
		font-size: 1.35rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--text);
		margin-bottom: 0.25rem;
	}
	.auth-header p {
		font-size: 0.875rem;
		color: var(--muted);
	}

	.error-banner {
		background: rgba(248, 113, 113, 0.1);
		border: 1px solid rgba(248, 113, 113, 0.25);
		color: var(--red);
		border-radius: 8px;
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		margin-bottom: 1.25rem;
	}

	.field { margin-bottom: 1.1rem; }
	label {
		display: block;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text);
		margin-bottom: 0.4rem;
		letter-spacing: 0.01em;
	}
	input {
		width: 100%;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.625rem 0.875rem;
		font-size: 0.9rem;
		color: var(--text);
		outline: none;
		transition: border-color 0.15s, box-shadow 0.15s;
		font-family: inherit;
	}
	input::placeholder { color: var(--muted); opacity: 0.6; }
	input:focus {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-glow);
	}
	input:disabled { opacity: 0.5; cursor: not-allowed; }

	.btn-primary {
		width: 100%;
		margin-top: 0.5rem;
		padding: 0.7rem 1rem;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition: opacity 0.15s, transform 0.1s;
		font-family: inherit;
	}
	.btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
	.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

	.spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	.switch-link {
		margin-top: 1.25rem;
		text-align: center;
		font-size: 0.85rem;
	}
	.switch-link a { color: var(--muted); }
	.switch-link a:hover { color: var(--accent); }

	.success-state { text-align: center; padding: 0.5rem 0; }
	.success-icon {
		width: 56px;
		height: 56px;
		background: rgba(74, 222, 128, 0.1);
		border: 1px solid rgba(74, 222, 128, 0.2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1.25rem;
		color: var(--green);
	}
	.success-state h2 {
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--text);
		margin-bottom: 0.5rem;
	}
	.success-state p {
		font-size: 0.875rem;
		color: var(--muted);
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}
	.success-state strong { color: var(--text); }
	.btn-secondary {
		display: inline-flex;
		align-items: center;
		padding: 0.6rem 1.25rem;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text);
		text-decoration: none;
		transition: border-color 0.15s;
	}
	.btn-secondary:hover { border-color: var(--accent); }
</style>
