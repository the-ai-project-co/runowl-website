<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loadingPwd = $state(false);
	let showPassword = $state(false);
	let showConfirm = $state(false);
	let showDeleteConfirm = $state(false);
</script>

<svelte:head>
	<title>Profile — RunOwl</title>
</svelte:head>

<div class="profile-page">
	<div class="profile-inner">
		<a href="/app/settings" class="back-link">
			<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
			Settings
		</a>
		<h1>Account settings</h1>

		<!-- Account info (read-only) -->
		<section class="card">
			<h2>Account</h2>
			<div class="field-row">
				<span class="field-label">Email</span>
				<div class="value">{data.user?.email ?? '—'}</div>
			</div>
			<div class="field-row">
				<span class="field-label">User ID</span>
				<div class="value mono">{data.user?.id ?? '—'}</div>
			</div>
			<div class="field-row">
				<span class="field-label">Last sign in</span>
				<div class="value">
					{data.user?.last_sign_in_at ? new Date(data.user.last_sign_in_at).toLocaleString() : '—'}
				</div>
			</div>
		</section>

		<!-- Change password -->
		<section class="card">
			<h2>Change password</h2>

			{#if form?.passwordUpdated}
				<div class="success-banner">Password updated successfully.</div>
			{/if}
			{#if form?.error && !form?.accountDeleted}
				<div class="error-banner">{form.error}</div>
			{/if}

			<form
				method="POST"
				action="?/updatePassword"
				use:enhance={() => {
					loadingPwd = true;
					return async ({ update }) => {
						await update();
						loadingPwd = false;
					};
				}}
			>
				<div class="field">
					<label for="password">New password</label>
					<div class="input-wrap">
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							placeholder="Min. 8 characters"
							autocomplete="new-password"
							required
							disabled={loadingPwd}
						/>
						<button
							type="button"
							class="eye"
							onclick={() => (showPassword = !showPassword)}
							aria-label="Toggle"
						>
							{#if showPassword}
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									><path
										d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
									/><path
										d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
									/><line x1="1" y1="1" x2="23" y2="23" /></svg
								>
							{:else}
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle
										cx="12"
										cy="12"
										r="3"
									/></svg
								>
							{/if}
						</button>
					</div>
				</div>

				<div class="field">
					<label for="confirmPassword">Confirm new password</label>
					<div class="input-wrap">
						<input
							id="confirmPassword"
							name="confirmPassword"
							type={showConfirm ? 'text' : 'password'}
							placeholder="Re-enter password"
							autocomplete="new-password"
							required
							disabled={loadingPwd}
						/>
						<button
							type="button"
							class="eye"
							onclick={() => (showConfirm = !showConfirm)}
							aria-label="Toggle"
						>
							{#if showConfirm}
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									><path
										d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
									/><path
										d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
									/><line x1="1" y1="1" x2="23" y2="23" /></svg
								>
							{:else}
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle
										cx="12"
										cy="12"
										r="3"
									/></svg
								>
							{/if}
						</button>
					</div>
				</div>

				<button type="submit" class="btn-primary" disabled={loadingPwd}>
					{#if loadingPwd}<span class="spinner"></span>{/if}
					Update password
				</button>
			</form>
		</section>

		<!-- Danger zone -->
		<section class="card danger-zone">
			<h2>Danger zone</h2>
			<p>
				Deleting your account will sign you out. Contact support to permanently remove your data.
			</p>

			{#if !showDeleteConfirm}
				<button class="btn-danger-outline" onclick={() => (showDeleteConfirm = true)}>
					Delete account
				</button>
			{:else}
				<div class="confirm-box">
					<p>Are you sure? This action cannot be undone.</p>
					<div class="confirm-actions">
						<button class="btn-ghost" onclick={() => (showDeleteConfirm = false)}>Cancel</button>
						<form method="POST" action="?/deleteAccount" use:enhance>
							<button type="submit" class="btn-danger">Yes, delete my account</button>
						</form>
					</div>
				</div>
			{/if}
		</section>
	</div>
</div>

<style>
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.78rem;
		color: var(--muted);
		text-decoration: none;
		transition: color 0.12s;
	}
	.back-link:hover { color: var(--text); }

	.profile-page {
		flex: 1;
		overflow-y: auto;
		padding: 2rem 1.5rem;
	}
	.profile-inner {
		max-width: 560px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	h1 {
		font-size: 1.3rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--text);
	}

	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.25rem 1.5rem;
	}
	h2 {
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
		margin-bottom: 1rem;
	}

	.field-row {
		display: flex;
		align-items: baseline;
		gap: 1rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border);
	}
	.field-row:last-child {
		border-bottom: none;
	}
	.field-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--muted);
		min-width: 100px;
	}
	.value {
		font-size: 0.85rem;
		color: var(--text);
	}
	.mono {
		font-family: monospace;
		font-size: 0.78rem;
	}

	.field {
		margin-bottom: 1rem;
	}
	.field label {
		display: block;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text);
		margin-bottom: 0.35rem;
	}
	.input-wrap {
		position: relative;
	}
	input {
		width: 100%;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.6rem 2.25rem 0.6rem 0.875rem;
		font-size: 0.875rem;
		color: var(--text);
		outline: none;
		font-family: inherit;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}
	input:focus {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-glow);
	}
	input:disabled {
		opacity: 0.5;
	}
	.eye {
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
	}
	.eye:hover {
		color: var(--text);
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 1.25rem;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		transition: opacity 0.15s;
	}
	.btn-primary:hover:not(:disabled) {
		opacity: 0.88;
	}
	.btn-primary:disabled {
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

	.success-banner {
		background: rgba(74, 222, 128, 0.08);
		border: 1px solid rgba(74, 222, 128, 0.2);
		color: var(--green);
		border-radius: 8px;
		padding: 0.65rem 0.875rem;
		font-size: 0.85rem;
		margin-bottom: 1rem;
	}
	.error-banner {
		background: rgba(248, 113, 113, 0.08);
		border: 1px solid rgba(248, 113, 113, 0.2);
		color: var(--red);
		border-radius: 8px;
		padding: 0.65rem 0.875rem;
		font-size: 0.85rem;
		margin-bottom: 1rem;
	}

	.danger-zone {
		border-color: rgba(248, 113, 113, 0.2);
	}
	.danger-zone p {
		font-size: 0.85rem;
		color: var(--muted);
		margin-bottom: 1rem;
		line-height: 1.6;
	}

	.btn-danger-outline {
		padding: 0.55rem 1rem;
		background: none;
		border: 1px solid var(--red);
		border-radius: 8px;
		color: var(--red);
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		transition: background 0.15s;
	}
	.btn-danger-outline:hover {
		background: rgba(248, 113, 113, 0.08);
	}

	.confirm-box {
		background: rgba(248, 113, 113, 0.06);
		border: 1px solid rgba(248, 113, 113, 0.15);
		border-radius: 8px;
		padding: 0.875rem 1rem;
	}
	.confirm-box p {
		font-size: 0.85rem;
		color: var(--text);
		margin-bottom: 0.75rem;
	}
	.confirm-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-ghost {
		padding: 0.5rem 1rem;
		background: none;
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--muted);
		font-size: 0.85rem;
		cursor: pointer;
		font-family: inherit;
		transition:
			border-color 0.15s,
			color 0.15s;
	}
	.btn-ghost:hover {
		border-color: var(--text);
		color: var(--text);
	}

	.btn-danger {
		padding: 0.5rem 1rem;
		background: var(--red);
		border: none;
		border-radius: 8px;
		color: #fff;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
	}
</style>
