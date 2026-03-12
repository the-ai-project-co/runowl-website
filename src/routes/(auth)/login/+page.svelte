<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let loading = $state(false);
	let showPassword = $state(false);
</script>

<svelte:head>
	<title>Sign in — RunOwl</title>
</svelte:head>

<div class="auth-header">
	<h1>Welcome back</h1>
	<p>Sign in to your RunOwl account</p>
</div>

{#if form?.error}
	<div class="error-banner" role="alert">
		{form.error}
	</div>
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

	<div class="field">
		<label for="password">
			Password
			<a href="/forgot-password" class="label-link">Forgot password?</a>
		</label>
		<div class="input-wrap">
			<input
				id="password"
				name="password"
				type={showPassword ? 'text' : 'password'}
				autocomplete="current-password"
				placeholder="••••••••"
				required
				disabled={loading}
			/>
			<button
				type="button"
				class="eye-toggle"
				aria-label={showPassword ? 'Hide password' : 'Show password'}
				onclick={() => (showPassword = !showPassword)}
			>
				{#if showPassword}
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
						/>
						<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
						<line x1="1" y1="1" x2="23" y2="23" />
					</svg>
				{:else}
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
						<circle cx="12" cy="12" r="3" />
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<button type="submit" class="btn-primary" disabled={loading}>
		{#if loading}
			<span class="spinner"></span>
			Signing in…
		{:else}
			Sign in
		{/if}
	</button>
</form>

<p class="switch-link">
	Don't have an account? <a href="/signup">Create one</a>
</p>

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

	.field {
		margin-bottom: 1.1rem;
	}
	label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text);
		margin-bottom: 0.4rem;
		letter-spacing: 0.01em;
	}
	.label-link {
		font-weight: 400;
		font-size: 0.78rem;
		color: var(--muted);
		text-decoration: none;
	}
	.label-link:hover {
		color: var(--accent);
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
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
		font-family: inherit;
	}
	input::placeholder {
		color: var(--muted);
		opacity: 0.6;
	}
	input:focus {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-glow);
	}
	input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.input-wrap {
		position: relative;
	}
	.input-wrap input {
		padding-right: 2.5rem;
	}
	.eye-toggle {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		cursor: pointer;
		color: var(--muted);
		display: flex;
		align-items: center;
		padding: 0;
		transition: color 0.15s;
	}
	.eye-toggle:hover {
		color: var(--text);
	}

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
		transition:
			opacity 0.15s,
			transform 0.1s;
		font-family: inherit;
	}
	.btn-primary:hover:not(:disabled) {
		opacity: 0.9;
		transform: translateY(-1px);
	}
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.spinner {
		width: 14px;
		height: 14px;
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

	.switch-link {
		margin-top: 1.25rem;
		text-align: center;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.switch-link a {
		color: var(--accent);
		font-weight: 500;
	}
</style>
