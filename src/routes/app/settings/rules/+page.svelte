<script lang="ts">
	import { ArrowLeft, Plus, Trash2 } from 'lucide-svelte';

	interface Rule {
		id: string;
		name: string;
		pattern: string;
		severity: 'P0' | 'P1' | 'P2';
		enabled: boolean;
	}

	let rules = $state<Rule[]>([
		{ id: 'r1', name: 'No console.log in production', pattern: 'console\\.log', severity: 'P2', enabled: true },
		{ id: 'r2', name: 'Disallow eval()', pattern: '\\beval\\s*\\(', severity: 'P0', enabled: true },
		{ id: 'r3', name: 'TODO comments must reference issue', pattern: 'TODO(?!.*#\\d)', severity: 'P2', enabled: false },
	]);

	let showAdd = $state(false);
	let newName = $state('');
	let newPattern = $state('');
	let newSeverity = $state<'P0' | 'P1' | 'P2'>('P2');
	let saved = $state(false);

	function addRule() {
		if (!newName.trim() || !newPattern.trim()) return;
		rules = [...rules, { id: crypto.randomUUID(), name: newName.trim(), pattern: newPattern.trim(), severity: newSeverity, enabled: true }];
		newName = ''; newPattern = ''; newSeverity = 'P2'; showAdd = false;
	}
	function removeRule(id: string) { rules = rules.filter((r) => r.id !== id); }
	function save() { saved = true; setTimeout(() => (saved = false), 2000); }

	const severityColors: Record<string, string> = { P0: 'var(--red)', P1: '#f97316', P2: 'var(--yellow)' };
</script>

<svelte:head>
	<title>Custom Rules — RunOwl</title>
</svelte:head>

<div class="page">
	<a href="/app/settings" class="back-link">
		<ArrowLeft size={13} /> Settings
	</a>
	<div class="page-head">
		<div>
			<h1 class="page-title">Custom Rules</h1>
			<p class="page-sub">Define your own review rules and severity thresholds.</p>
		</div>
		<button class="btn-primary" onclick={() => (showAdd = !showAdd)}>
			<Plus size={13} /> Add rule
		</button>
	</div>

	{#if showAdd}
		<div class="add-card">
			<div class="add-fields">
				<div class="field">
					<label class="field-label" for="rule-name">Rule name</label>
					<input id="rule-name" class="field-input" type="text" placeholder="e.g. No eval()" bind:value={newName} />
				</div>
				<div class="field">
					<label class="field-label" for="rule-pattern">Regex pattern</label>
					<input id="rule-pattern" class="field-input mono" type="text" placeholder="e.g. \beval\s*\(" bind:value={newPattern} />
				</div>
				<div class="field">
					<label class="field-label" for="rule-sev">Severity</label>
					<select id="rule-sev" class="field-input" bind:value={newSeverity}>
						<option value="P0">P0 — Critical</option>
						<option value="P1">P1 — High</option>
						<option value="P2">P2 — Medium</option>
					</select>
				</div>
			</div>
			<div class="add-actions">
				<button class="btn-ghost" onclick={() => (showAdd = false)}>Cancel</button>
				<button class="btn-primary" onclick={addRule}>Add</button>
			</div>
		</div>
	{/if}

	<div class="card">
		{#if rules.length === 0}
			<p class="empty">No custom rules yet.</p>
		{:else}
			{#each rules as rule (rule.id)}
				<div class="rule-row">
					<button
						class="toggle"
						class:on={rule.enabled}
						role="switch"
						aria-checked={rule.enabled}
						onclick={() => (rule.enabled = !rule.enabled)}
						aria-label="Enable {rule.name}"
					>
						<span class="thumb"></span>
					</button>
					<div class="rule-info">
						<span class="rule-name">{rule.name}</span>
						<code class="rule-pattern">{rule.pattern}</code>
					</div>
					<span class="sev-chip" style="color: {severityColors[rule.severity]}; border-color: {severityColors[rule.severity]}20; background: {severityColors[rule.severity]}10">{rule.severity}</span>
					<button class="del-btn" onclick={() => removeRule(rule.id)} aria-label="Delete rule">
						<Trash2 size={13} />
					</button>
				</div>
			{/each}
		{/if}
	</div>

	<div class="actions">
		{#if saved}<span class="saved-msg">Saved!</span>{/if}
		<button class="btn-primary" onclick={save}>Save rules</button>
	</div>
</div>

<style>
	.page {
		padding: 2rem 2.5rem 3rem;
		max-width: 700px;
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
	.page-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}
	.page-title { font-size: 1.45rem; font-weight: 700; letter-spacing: -0.03em; color: var(--text); margin-bottom: 0.2rem; }
	.page-sub { font-size: 0.82rem; color: var(--muted); }

	.add-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.add-fields { display: flex; gap: 0.75rem; flex-wrap: wrap; }
	.field { display: flex; flex-direction: column; gap: 0.35rem; flex: 1; min-width: 160px; }
	.field-label { font-size: 0.75rem; font-weight: 600; color: var(--text); }
	.field-input {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 7px;
		padding: 0.5rem 0.75rem;
		font-size: 0.82rem;
		color: var(--text);
		font-family: inherit;
		outline: none;
	}
	.field-input:focus { border-color: var(--accent); }
	.mono { font-family: 'SF Mono', 'Fira Code', monospace; }
	.add-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }

	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}
	.empty { padding: 2rem; font-size: 0.85rem; color: var(--muted); text-align: center; }
	.rule-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.85rem 1.1rem;
		border-bottom: 1px solid var(--border);
	}
	.rule-row:last-child { border-bottom: none; }
	.rule-info { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
	.rule-name { font-size: 0.85rem; font-weight: 600; color: var(--text); }
	.rule-pattern { font-size: 0.72rem; color: var(--muted); font-family: 'SF Mono', 'Fira Code', monospace; }
	.sev-chip {
		font-size: 0.65rem;
		font-weight: 700;
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
		border: 1px solid;
		flex-shrink: 0;
	}
	.del-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--muted);
		display: flex;
		align-items: center;
		padding: 0.25rem;
		border-radius: 4px;
		transition: color 0.12s;
		flex-shrink: 0;
	}
	.del-btn:hover { color: var(--red); }

	.toggle {
		width: 34px; height: 20px;
		border-radius: 10px;
		background: var(--border);
		border: none;
		cursor: pointer;
		position: relative;
		transition: background 0.2s;
		flex-shrink: 0;
		padding: 0;
	}
	.toggle.on { background: var(--accent); }
	.thumb {
		position: absolute; top: 2px; left: 2px;
		width: 16px; height: 16px;
		border-radius: 50%; background: #fff;
		transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow: 0 1px 3px rgba(0,0,0,0.3);
	}
	.toggle.on .thumb { transform: translateX(14px); }

	.actions { display: flex; align-items: center; gap: 1rem; }
	.saved-msg { font-size: 0.82rem; color: var(--green); }
	.btn-primary {
		display: inline-flex; align-items: center; gap: 0.35rem;
		padding: 0.5rem 1.1rem;
		background: var(--accent); color: #fff;
		border: none; border-radius: 8px;
		font-size: 0.85rem; font-weight: 600;
		cursor: pointer; font-family: inherit;
		transition: opacity 0.15s;
		flex-shrink: 0;
	}
	.btn-primary:hover { opacity: 0.9; }
	.btn-ghost {
		padding: 0.5rem 1rem;
		background: none; border: 1px solid var(--border);
		border-radius: 8px; color: var(--muted);
		font-size: 0.85rem; cursor: pointer; font-family: inherit;
	}
	.btn-ghost:hover { color: var(--text); }

	@media (max-width: 640px) { .page { padding: 1.25rem 1rem 2rem; } }
</style>
