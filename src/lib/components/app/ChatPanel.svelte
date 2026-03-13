<script lang="ts">
	import { tick } from 'svelte';
	import { reviewStore } from '$lib/stores/review.svelte';
	import { RefreshCw, FlaskConical, Play } from 'lucide-svelte';

	let input = $state('');
	let messagesEl = $state<HTMLDivElement | null>(null);
	let suggestionsVisible = $state(true);

	const bugs = $derived(reviewStore.bugs);
	const flags = $derived(reviewStore.flags);
	const messages = $derived(reviewStore.chatMessages);
	const streaming = $derived(reviewStore.streaming);
	const activeTab = $derived(reviewStore.activeTab);
	const isDone = $derived(reviewStore.status === 'done');

	// ── AI follow-up suggestion chips ──────────────────────────────────────────
	type Suggestion = { id: string; label: string; prompt: string };

	const BASE_SUGGESTIONS: Suggestion[] = [
		{ id: 's1', label: 'Race conditions?', prompt: 'Are there any race conditions or concurrency issues in this PR?' },
		{ id: 's2', label: 'Explain caching logic', prompt: 'Explain the caching logic in this PR.' },
		{ id: 's3', label: 'Security risks', prompt: 'What are the main security risks in this diff?' },
		{ id: 's4', label: 'Missing tests?', prompt: 'What test cases are missing from this PR?' },
		{ id: 's5', label: 'Performance impact', prompt: 'What performance impact could this PR have?' },
		{ id: 's6', label: 'Breaking changes?', prompt: 'Does this PR introduce any breaking changes?' },
	];

	// Derived: show contextual suggestions based on findings
	const contextualSuggestions = $derived((): Suggestion[] => {
		if (!isDone) return BASE_SUGGESTIONS.slice(0, 3);
		const extra: Suggestion[] = [];
		if (bugs.length > 0) extra.push({ id: 'ctx-bug', label: `Fix ${bugs.length} bug${bugs.length > 1 ? 's' : ''}`, prompt: 'How should I fix the bugs found in this PR?' });
		if (flags.length > 0) extra.push({ id: 'ctx-flag', label: 'Explain flags', prompt: 'Explain each flag found and how critical they are.' });
		return [...extra, ...BASE_SUGGESTIONS].slice(0, 4);
	});

	let shownSuggestions = $state<Suggestion[]>([]);

	$effect(() => {
		shownSuggestions = contextualSuggestions();
	});

	function refreshSuggestions() {
		// Rotate through BASE_SUGGESTIONS
		const all = BASE_SUGGESTIONS;
		const first = shownSuggestions[0];
		const idx = all.findIndex((s) => s.id === first?.id);
		const next = (idx + 4) % all.length;
		shownSuggestions = [...all.slice(next, next + 4), ...all.slice(0, Math.max(0, next + 4 - all.length))].slice(0, 4);
	}

	async function useSuggestion(s: Suggestion) {
		input = s.prompt;
		suggestionsVisible = false;
		await tick();
		await sendNow(s.prompt);
		input = '';
	}

	async function sendNow(text: string) {
		if (!text.trim() || streaming) return;
		await reviewStore.sendMessage(text.trim());
		await tick();
		if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
	}

	async function handleSend(e?: SubmitEvent) {
		e?.preventDefault();
		const q = input.trim();
		if (!q || streaming) return;
		input = '';
		suggestionsVisible = false;
		await sendNow(q);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	// ── Test suite simulation ──────────────────────────────────────────────────
	let testRunning = $state(false);
	let testResult = $state<{ pass: number; fail: number; total: number; output: string } | null>(null);

	async function generateAndRunTests() {
		testRunning = true;
		testResult = null;
		await new Promise((r) => setTimeout(r, 2200));
		testResult = {
			pass: 7,
			fail: 1,
			total: 8,
			output: `✓ should validate input correctly (12ms)
✓ should handle empty payload (3ms)
✓ should return 401 on missing auth (5ms)
✓ should parse response JSON (2ms)
✓ should retry on 5xx errors (18ms)
✓ should respect rate limits (8ms)
✓ should sanitize SQL inputs (11ms)
✗ should handle concurrent requests — AssertionError: expected 200 but got 429`,
		};
		testRunning = false;
	}

	const sevColor: Record<string, string> = {
		P0: 'var(--red)',
		P1: 'var(--yellow)',
		P2: 'var(--muted)',
		P3: 'var(--border)',
	};
</script>

<div class="chat-panel">
	<!-- Tab bar -->
	<div class="tab-bar" role="tablist">
		<button
			role="tab"
			aria-selected={activeTab === 'review'}
			class:active={activeTab === 'review'}
			onclick={() => (reviewStore.activeTab = 'review')}
		>
			Review
		</button>
		<button
			role="tab"
			aria-selected={activeTab === 'flags'}
			class:active={activeTab === 'flags'}
			onclick={() => (reviewStore.activeTab = 'flags')}
		>
			Flags
			{#if flags.length}
				<span class="tab-badge flag">{flags.length}</span>
			{/if}
		</button>
		<button
			role="tab"
			aria-selected={activeTab === 'bugs'}
			class:active={activeTab === 'bugs'}
			onclick={() => (reviewStore.activeTab = 'bugs')}
		>
			Bugs
			{#if bugs.length}
				<span class="tab-badge bug">{bugs.length}</span>
			{/if}
		</button>
		<button
			role="tab"
			aria-selected={activeTab === 'tests'}
			class:active={activeTab === 'tests'}
			onclick={() => (reviewStore.activeTab = 'tests')}
		>
			Tests
		</button>
	</div>

	<!-- ── Review tab ─────────────────────────────────────────────────────────── -->
	{#if activeTab === 'review'}
		<div class="messages" bind:this={messagesEl} role="log" aria-live="polite">
			{#if messages.length === 0}
				<div class="empty-chat">
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
					</svg>
					<p>Ask anything about this PR</p>
					<p class="empty-hint">e.g. "Are there race conditions?" or "Explain the caching logic"</p>
				</div>
			{:else}
				{#each messages as msg (msg.id)}
					<div class="message {msg.role}">
						{#if msg.role === 'assistant'}
							<div class="msg-avatar">
								<svg width="14" height="14" viewBox="0 0 28 28" fill="none">
									<path d="M9 10 Q14 6 19 10 Q21 14 19 18 Q14 22 9 18 Q7 14 9 10Z" fill="var(--accent)" opacity="0.7" />
									<circle cx="11.5" cy="13" r="1.5" fill="var(--accent)" />
									<circle cx="16.5" cy="13" r="1.5" fill="var(--accent)" />
								</svg>
							</div>
						{/if}
						<div class="msg-bubble">
							{#if msg.role === 'assistant' && streaming && msg === messages[messages.length - 1] && !msg.content}
								<span class="typing-dots"><span></span><span></span><span></span></span>
							{:else}
								<p class="msg-content">{msg.content}</p>
							{/if}
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Suggestion chips -->
		{#if suggestionsVisible && !streaming}
			<div class="suggestions-row">
				<div class="suggestions-chips">
					{#each shownSuggestions as s (s.id)}
						<button class="suggestion-chip" onclick={() => useSuggestion(s)}>
							{s.label}
						</button>
					{/each}
				</div>
				<button class="refresh-btn" onclick={refreshSuggestions} title="Refresh suggestions" aria-label="Refresh suggestions">
					<RefreshCw size={12} />
				</button>
			</div>
		{/if}

		<!-- Input -->
		<form class="chat-input-row" onsubmit={handleSend}>
			<textarea
				placeholder="Ask about this PR…"
				bind:value={input}
				onkeydown={handleKeydown}
				onfocus={() => (suggestionsVisible = true)}
				disabled={streaming}
				rows="1"
			></textarea>
			<button type="submit" class="send-btn" disabled={!input.trim() || streaming} aria-label="Send">
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<line x1="22" y1="2" x2="11" y2="13" />
					<polygon points="22 2 15 22 11 13 2 9 22 2" />
				</svg>
			</button>
		</form>

	<!-- ── Flags tab ──────────────────────────────────────────────────────────── -->
	{:else if activeTab === 'flags'}
		<div class="findings-list">
			{#if flags.length === 0}
				<div class="empty-findings">
					{#if reviewStore.status !== 'done'}
						<p>Run a review to see flags.</p>
					{:else}
						<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="1.5">
							<polyline points="20 6 9 17 4 12" />
						</svg>
						<p>No flags found</p>
					{/if}
				</div>
			{:else}
				{#each flags as f (f.id)}
					<button class="finding-card" onclick={() => reviewStore.highlightFinding(f)}>
						<div class="finding-header">
							<span class="sev-pill" style="color: {sevColor[f.severity] ?? 'var(--muted)'}; border-color: {sevColor[f.severity] ?? 'var(--border)'};">
								{f.severity}
							</span>
							<span class="finding-type">{f.type}</span>
						</div>
						<p class="finding-title">{f.title}</p>
						<p class="finding-file">{f.file}:{f.line_start}</p>
					</button>
				{/each}
			{/if}
		</div>

	<!-- ── Bugs tab ───────────────────────────────────────────────────────────── -->
	{:else if activeTab === 'bugs'}
		<div class="findings-list">
			{#if bugs.length === 0}
				<div class="empty-findings">
					{#if reviewStore.status !== 'done'}
						<p>Run a review to see bugs.</p>
					{:else}
						<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="1.5">
							<polyline points="20 6 9 17 4 12" />
						</svg>
						<p>No bugs found</p>
					{/if}
				</div>
			{:else}
				{#each bugs as f (f.id)}
					<button class="finding-card bug" onclick={() => reviewStore.highlightFinding(f)}>
						<div class="finding-header">
							<span class="sev-pill" style="color: {sevColor[f.severity] ?? 'var(--red)'}; border-color: {sevColor[f.severity] ?? 'var(--red)'};">
								{f.severity}
							</span>
							<span class="finding-type">{f.type}</span>
						</div>
						<p class="finding-title">{f.title}</p>
						<p class="finding-file">{f.file}:{f.line_start}</p>
						{#if f.suggestion}
							<p class="finding-suggestion">{f.suggestion}</p>
						{/if}
					</button>
				{/each}
			{/if}
		</div>

	<!-- ── Tests tab ─────────────────────────────────────────────────────────── -->
	{:else}
		<div class="tests-panel">
			{#if !testResult && !testRunning}
				<div class="tests-empty">
					<FlaskConical size={32} strokeWidth={1.25} opacity={0.3} />
					<p class="tests-empty-title">No tests generated yet</p>
					<p class="tests-empty-hint">
						RunOwl will analyse this PR's diff and generate targeted unit tests, then run them in a secure Deno sandbox.
					</p>
					<button class="run-tests-btn" onclick={generateAndRunTests} disabled={!isDone}>
						<Play size={13} />
						Generate & run tests
					</button>
					{#if !isDone}
						<span class="tests-wait">Complete the review first</span>
					{/if}
				</div>
			{:else if testRunning}
				<div class="tests-running">
					<div class="run-spinner"></div>
					<p>Generating tests and running in sandbox…</p>
				</div>
			{:else if testResult}
				<div class="test-results">
					<!-- Summary bar -->
					<div class="test-summary">
						<div class="test-counts">
							<span class="count-pass">{testResult.pass} passed</span>
							<span class="count-sep">·</span>
							<span class="count-fail">{testResult.fail} failed</span>
							<span class="count-sep">·</span>
							<span class="count-total">{testResult.total} total</span>
						</div>
						<div class="test-bar-track">
							<div class="test-bar-fill" style="width: {(testResult.pass / testResult.total) * 100}%"></div>
						</div>
					</div>

					<!-- Output -->
					<div class="test-output">
						<pre>{testResult.output}</pre>
					</div>

					<!-- Re-run -->
					<button class="rerun-btn" onclick={generateAndRunTests}>
						<RefreshCw size={12} />
						Re-run
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.chat-panel {
		width: 340px;
		min-width: 280px;
		border-left: 1px solid var(--border);
		background: var(--surface);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* Tab bar */
	.tab-bar {
		display: flex;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}
	.tab-bar button {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		padding: 0.6rem 0.35rem;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--muted);
		cursor: pointer;
		font-family: inherit;
		transition: color 0.15s, border-color 0.15s;
	}
	.tab-bar button.active {
		color: var(--text);
		border-bottom-color: var(--accent);
	}
	.tab-bar button:hover:not(.active) { color: var(--text); }

	.tab-badge {
		font-size: 0.62rem;
		font-weight: 700;
		padding: 0.05rem 0.32rem;
		border-radius: 99px;
	}
	.tab-badge.bug { background: rgba(248,113,113,0.15); color: var(--red); }
	.tab-badge.flag { background: rgba(251,191,36,0.12); color: var(--yellow); }

	/* Messages */
	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 0.875rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.empty-chat {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 0.5rem;
		padding: 2rem 0;
	}
	.empty-chat p { font-size: 0.83rem; color: var(--muted); }
	.empty-hint { font-size: 0.75rem; opacity: 0.6; }

	.message { display: flex; gap: 0.5rem; align-items: flex-start; }
	.message.user { flex-direction: row-reverse; }

	.msg-avatar {
		width: 26px; height: 26px;
		background: var(--accent-glow);
		border: 1px solid rgba(124,106,247,0.2);
		border-radius: 50%;
		display: flex; align-items: center; justify-content: center;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.msg-bubble {
		max-width: 85%;
		padding: 0.55rem 0.75rem;
		border-radius: 12px;
		font-size: 0.83rem;
		line-height: 1.55;
	}
	.message.user .msg-bubble {
		background: var(--accent);
		color: #fff;
		border-radius: 12px 12px 2px 12px;
	}
	.message.assistant .msg-bubble {
		background: var(--surface-2);
		border: 1px solid var(--border);
		color: var(--text);
		border-radius: 2px 12px 12px 12px;
	}
	.msg-content { margin: 0; white-space: pre-wrap; word-break: break-word; }

	.typing-dots { display: flex; gap: 4px; align-items: center; height: 16px; }
	.typing-dots span {
		width: 5px; height: 5px;
		background: var(--muted);
		border-radius: 50%;
		animation: bounce 1.2s ease infinite;
	}
	.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
	.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
	@keyframes bounce {
		0%, 80%, 100% { transform: translateY(0); }
		40% { transform: translateY(-6px); }
	}

	/* Suggestion chips */
	.suggestions-row {
		display: flex;
		align-items: flex-start;
		gap: 0.35rem;
		padding: 0.5rem 0.625rem 0.25rem;
		border-top: 1px solid var(--border);
		flex-shrink: 0;
	}
	.suggestions-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		flex: 1;
	}
	.suggestion-chip {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 99px;
		padding: 0.25rem 0.6rem;
		font-size: 0.72rem;
		color: var(--text);
		cursor: pointer;
		font-family: inherit;
		transition: background 0.12s, border-color 0.12s, color 0.12s;
		white-space: nowrap;
	}
	.suggestion-chip:hover {
		background: color-mix(in srgb, var(--accent) 10%, var(--surface-2));
		border-color: color-mix(in srgb, var(--accent) 30%, var(--border));
		color: var(--accent);
	}
	.refresh-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--muted);
		display: flex;
		align-items: center;
		padding: 0.25rem;
		border-radius: 5px;
		flex-shrink: 0;
		margin-top: 1px;
		transition: color 0.12s, background 0.12s;
	}
	.refresh-btn:hover { color: var(--text); background: var(--surface-2); }

	/* Chat input */
	.chat-input-row {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		padding: 0.5rem 0.625rem 0.625rem;
		border-top: 1px solid var(--border);
		flex-shrink: 0;
	}

	textarea {
		flex: 1;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.5rem 0.75rem;
		font-size: 0.83rem;
		color: var(--text);
		font-family: inherit;
		resize: none;
		outline: none;
		min-height: 36px;
		max-height: 120px;
		overflow-y: auto;
		transition: border-color 0.15s, box-shadow 0.15s;
		line-height: 1.5;
	}
	textarea::placeholder { color: var(--muted); opacity: 0.5; }
	textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
	textarea:disabled { opacity: 0.5; }

	.send-btn {
		width: 34px; height: 34px;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		display: flex; align-items: center; justify-content: center;
		flex-shrink: 0;
		transition: opacity 0.15s;
	}
	.send-btn:hover:not(:disabled) { opacity: 0.88; }
	.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

	/* Findings list */
	.findings-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.625rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.empty-findings {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 3rem 1rem;
		text-align: center;
	}
	.empty-findings p { font-size: 0.83rem; color: var(--muted); }

	.finding-card {
		width: 100%;
		text-align: left;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.625rem 0.75rem;
		cursor: pointer;
		font-family: inherit;
		transition: border-color 0.15s, background 0.1s;
	}
	.finding-card:hover { border-color: var(--accent); background: var(--accent-glow); }
	.finding-card.bug { border-left: 3px solid var(--red); }

	.finding-header { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.35rem; }
	.sev-pill { font-size: 0.65rem; font-weight: 800; padding: 0.1rem 0.35rem; border-radius: 4px; border: 1px solid; font-family: monospace; }
	.finding-type { font-size: 0.68rem; color: var(--muted); text-transform: capitalize; }
	.finding-title { font-size: 0.8rem; font-weight: 600; color: var(--text); margin: 0 0 0.25rem; line-height: 1.4; }
	.finding-file { font-size: 0.7rem; color: var(--muted); font-family: monospace; margin: 0; }
	.finding-suggestion { font-size: 0.75rem; color: var(--muted); margin: 0.35rem 0 0; line-height: 1.5; border-top: 1px solid var(--border); padding-top: 0.35rem; }

	/* Tests panel */
	.tests-panel {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.tests-empty {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 0.6rem;
		padding: 2rem 1.25rem;
		color: var(--muted);
	}
	.tests-empty-title { font-size: 0.88rem; font-weight: 600; color: var(--text); }
	.tests-empty-hint { font-size: 0.76rem; line-height: 1.5; max-width: 240px; }
	.tests-wait { font-size: 0.72rem; color: var(--muted); }

	.run-tests-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 8px;
		padding: 0.5rem 1rem;
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		margin-top: 0.25rem;
		transition: opacity 0.12s;
	}
	.run-tests-btn:disabled { opacity: 0.45; cursor: not-allowed; }
	.run-tests-btn:not(:disabled):hover { opacity: 0.88; }

	.tests-running {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.85rem;
		color: var(--muted);
		font-size: 0.82rem;
		padding: 2rem;
	}
	.run-spinner {
		width: 28px; height: 28px;
		border: 3px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	.test-results {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem;
	}
	.test-summary { display: flex; flex-direction: column; gap: 0.4rem; }
	.test-counts { display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; }
	.count-pass { color: var(--green); font-weight: 600; }
	.count-fail { color: var(--red); font-weight: 600; }
	.count-total { color: var(--muted); }
	.count-sep { color: var(--border); }
	.test-bar-track {
		height: 4px;
		background: var(--border);
		border-radius: 2px;
		overflow: hidden;
	}
	.test-bar-fill {
		height: 100%;
		background: var(--green);
		border-radius: 2px;
		transition: width 0.5s cubic-bezier(0.16,1,0.3,1);
	}
	.test-output {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.75rem;
		overflow-x: auto;
	}
	.test-output pre {
		margin: 0;
		font-size: 0.72rem;
		font-family: 'SF Mono', 'Fira Code', monospace;
		color: var(--text);
		white-space: pre-wrap;
		word-break: break-word;
		line-height: 1.6;
	}
	.rerun-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: none;
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.35rem 0.75rem;
		font-size: 0.75rem;
		color: var(--muted);
		cursor: pointer;
		font-family: inherit;
		align-self: flex-end;
		transition: color 0.12s, border-color 0.12s;
	}
	.rerun-btn:hover { color: var(--text); border-color: var(--muted); }
</style>
