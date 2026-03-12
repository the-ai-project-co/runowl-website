<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let loading = $state(false);
	let showPassword = $state(false);
	let showConfirm = $state(false);

	// Password strength
	let password = $state('');
	const strength = $derived((() => {
		if (!password) return 0;
		let score = 0;
		if (password.length >= 8) score++;
		if (password.length >= 12) score++;
		if (/[A-Z]/.test(password)) score++;
		if (/[0-9]/.test(password)) score++;
		if (/[^A-Za-z0-9]/.test(password)) score++;
		return score;
	})());
	const strengthLabel = $derived(
		strength <= 1 ? 'Weak' : strength <= 3 ? 'Fair' : strength <= 4 ? 'Good' : 'Strong'
	);
	const strengthColor = $derived(
		strength <= 1 ? 'var(--red)' : strength <= 3 ? 'var(--yellow)' : 'var(--green)'
	);
</script>

<svelte:head>
	<title>Create account — RunOwl</title>
</svelte:head>

{#if form?.success}
	<div class="success-state">
		<div class="success-icon">
			<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.67 12a19.79 19.79 0 0 1-3-8.59A2 2 0 0 1 3.59 1.5h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.29 6.29l.84-.84a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
			</svg>
		</div>
		<h2>Check your email</h2>
		<p>We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account.</p>
		<a href="/login" class="btn-secondary">Back to sign in</a>
	</div>
{:else}
	<div class="auth-header">
		<h1>Create your account</h1>
		<p>Start reviewing PRs with AI in minutes</p>
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
			<label for="password">Password</label>
			<div class="input-wrap">
				<input
					id="password"
					name="password"
					type={showPassword ? 'text' : 'password'}
					autocomplete="new-password"
					placeholder="Min. 8 characters"
					required
					disabled={loading}
					bind:value={password}
				/>
				<button
					type="button"
					class="eye-toggle"
					aria-label={showPassword ? 'Hide password' : 'Show password'}
					onclick={() => (showPassword = !showPassword)}
				>
					{#if showPassword}
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
							<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
							<line x1="1" y1="1" x2="23" y2="23"/>
						</svg>
					{:else}
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
							<circle cx="12" cy="12" r="3"/>
						</svg>
					{/if}
				</button>
			</div>
			{#if password}
				<div class="strength-bar">
					<div class="strength-track">
						<div
							class="strength-fill"
							style="width: {(strength / 5) * 100}%; background: {strengthColor};"
						></div>
					</div>
					<span class="strength-label" style="color: {strengthColor};">{strengthLabel}</span>
				</div>
			{/if}
		</div>

		<div class="field">
			<label for="confirmPassword">Confirm password</label>
			<div class="input-wrap">
				<input
					id="confirmPassword"
					name="confirmPassword"
					type={showConfirm ? 'text' : 'password'}
					autocomplete="new-password"
					placeholder="Re-enter password"
					required
					disabled={loading}
				/>
				<button
					type="button"
					class="eye-toggle"
					aria-label={showConfirm ? 'Hide password' : 'Show password'}
					onclick={() => (showConfirm = !showConfirm)}
				>
					{#if showConfirm}
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
							<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
							<line x1="1" y1="1" x2="23" y2="23"/>
						</svg>
					{:else}
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
							<circle cx="12" cy="12" r="3"/>
						</svg>
					{/if}
				</button>
			</div>
		</div>

		<button type="submit" class="btn-primary" disabled={loading}>
			{#if loading}
				<span class="spinner"></span>
				Creating account…
			{:else}
				Create account
			{/if}
		</button>
	</form>

	<p class="switch-link">
		Already have an account? <a href="/login">Sign in</a>
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

	.field {
		margin-bottom: 1.1rem;
	}
	label {
		display: flex;
		align-items: center;
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

	.input-wrap { position: relative; }
	.input-wrap input { padding-right: 2.5rem; }
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
	.eye-toggle:hover { color: var(--text); }

	.strength-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.4rem;
	}
	.strength-track {
		flex: 1;
		height: 3px;
		background: var(--border);
		border-radius: 99px;
		overflow: hidden;
	}
	.strength-fill {
		height: 100%;
		border-radius: 99px;
		transition: width 0.3s ease, background 0.3s ease;
	}
	.strength-label {
		font-size: 0.72rem;
		font-weight: 600;
		min-width: 3rem;
		text-align: right;
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
		color: var(--muted);
	}
	.switch-link a { color: var(--accent); font-weight: 500; }

	/* Success state */
	.success-state {
		text-align: center;
		padding: 0.5rem 0;
	}
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
