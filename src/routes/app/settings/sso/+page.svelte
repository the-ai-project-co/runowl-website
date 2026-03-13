<script lang="ts">
	import { ArrowLeft, Shield } from 'lucide-svelte';

	let enabled = $state(false);
	let provider = $state<'okta' | 'azure' | 'google' | 'custom'>('okta');
	let metadataUrl = $state('');
	let entityId = $state('');
	let saved = $state(false);

	function save() { saved = true; setTimeout(() => (saved = false), 2000); }
</script>

<svelte:head>
	<title>SSO / SAML — RunOwl</title>
</svelte:head>

<div class="page">
	<a href="/app/settings" class="back-link">
		<ArrowLeft size={13} /> Settings
	</a>
	<div class="page-head">
		<h1 class="page-title">SSO / SAML</h1>
		<p class="page-sub">Configure single sign-on for your organisation. Requires Business plan.</p>
	</div>

	<div class="card">
		<div class="row">
			<div class="row-info">
				<span class="row-label">Enable SSO</span>
				<span class="row-hint">Require members to sign in via your identity provider.</span>
			</div>
			<button
				class="toggle"
				class:on={enabled}
				role="switch"
				aria-checked={enabled}
				onclick={() => (enabled = !enabled)}
				aria-label="Enable SSO"
			>
				<span class="thumb"></span>
			</button>
		</div>
	</div>

	{#if enabled}
		<div class="card form-card">
			<div class="form-section">
				<span class="section-label">Identity provider</span>
				<div class="provider-grid">
					{#each (['okta', 'azure', 'google', 'custom'] as const) as p}
						<button
							class="provider-btn"
							class:selected={provider === p}
							onclick={() => (provider = p)}
						>
							{p === 'okta' ? 'Okta' : p === 'azure' ? 'Azure AD' : p === 'google' ? 'Google Workspace' : 'Custom IdP'}
						</button>
					{/each}
				</div>
			</div>

			<div class="form-section">
				<span class="section-label">SAML configuration</span>
				<div class="field">
					<label class="field-label" for="metadata-url">Metadata URL</label>
					<input
						id="metadata-url"
						class="field-input"
						type="url"
						placeholder="https://your-idp.example.com/saml/metadata"
						bind:value={metadataUrl}
					/>
					<span class="field-hint">Your IdP's SAML 2.0 metadata endpoint.</span>
				</div>
				<div class="field">
					<label class="field-label" for="entity-id">Entity ID (SP)</label>
					<input
						id="entity-id"
						class="field-input"
						type="text"
						placeholder="https://app.runowl.com/saml/metadata"
						bind:value={entityId}
					/>
					<span class="field-hint">RunOwl's entity ID to register with your IdP.</span>
				</div>
			</div>

			<div class="acs-box">
				<div class="acs-row">
					<span class="acs-label">ACS URL</span>
					<code class="acs-value">https://app.runowl.com/saml/acs</code>
				</div>
				<div class="acs-row">
					<span class="acs-label">Entity ID</span>
					<code class="acs-value">https://app.runowl.com/saml/metadata</code>
				</div>
			</div>
		</div>
	{/if}

	<div class="actions">
		{#if saved}<span class="saved-msg">Saved!</span>{/if}
		<button class="btn-primary" onclick={save}>Save configuration</button>
	</div>
</div>

<style>
	.page {
		padding: 2rem 2.5rem 3rem;
		max-width: 640px;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.78rem;
		color: var(--muted);
		text-decoration: none;
		transition: color 0.12s;
		width: fit-content;
	}
	.back-link:hover { color: var(--text); }
	.page-title { font-size: 1.45rem; font-weight: 700; letter-spacing: -0.03em; color: var(--text); margin-bottom: 0.2rem; }
	.page-sub { font-size: 0.82rem; color: var(--muted); }

	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}
	.form-card { padding: 1.1rem 1.25rem; display: flex; flex-direction: column; gap: 1.25rem; }

	.row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.1rem;
	}
	.row-info { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; }
	.row-label { font-size: 0.88rem; font-weight: 600; color: var(--text); }
	.row-hint { font-size: 0.76rem; color: var(--muted); }

	.form-section { display: flex; flex-direction: column; gap: 0.75rem; }
	.section-label {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}

	.provider-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}
	.provider-btn {
		padding: 0.6rem;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		font-size: 0.82rem;
		color: var(--muted);
		cursor: pointer;
		font-family: inherit;
		transition: border-color 0.12s, color 0.12s;
	}
	.provider-btn.selected { border-color: var(--accent); color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, transparent); }

	.field { display: flex; flex-direction: column; gap: 0.3rem; }
	.field-label { font-size: 0.75rem; font-weight: 600; color: var(--text); }
	.field-input {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 7px;
		padding: 0.55rem 0.8rem;
		font-size: 0.82rem;
		color: var(--text);
		font-family: inherit;
		outline: none;
		transition: border-color 0.15s;
	}
	.field-input:focus { border-color: var(--accent); }
	.field-hint { font-size: 0.72rem; color: var(--muted); }

	.acs-box {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.8rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.acs-row { display: flex; align-items: center; gap: 0.75rem; }
	.acs-label { font-size: 0.72rem; font-weight: 600; color: var(--muted); min-width: 70px; }
	.acs-value { font-size: 0.75rem; color: var(--text); font-family: 'SF Mono', 'Fira Code', monospace; }

	.toggle {
		width: 38px; height: 22px;
		border-radius: 11px;
		background: var(--border);
		border: none; cursor: pointer;
		position: relative;
		transition: background 0.2s;
		flex-shrink: 0; padding: 0;
	}
	.toggle.on { background: var(--accent); }
	.thumb {
		position: absolute; top: 3px; left: 3px;
		width: 16px; height: 16px;
		border-radius: 50%; background: #fff;
		transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow: 0 1px 3px rgba(0,0,0,0.3);
	}
	.toggle.on .thumb { transform: translateX(16px); }

	.actions { display: flex; align-items: center; gap: 1rem; }
	.saved-msg { font-size: 0.82rem; color: var(--green); }
	.btn-primary {
		padding: 0.55rem 1.25rem;
		background: var(--accent); color: #fff;
		border: none; border-radius: 8px;
		font-size: 0.85rem; font-weight: 600;
		cursor: pointer; font-family: inherit;
		transition: opacity 0.15s;
	}
	.btn-primary:hover { opacity: 0.9; }

	@media (max-width: 640px) { .page { padding: 1.25rem 1rem 2rem; } }
</style>
