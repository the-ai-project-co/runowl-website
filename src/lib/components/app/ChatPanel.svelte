<script lang="ts">
	import { tick } from 'svelte';
	import { reviewStore } from '$lib/stores/review.svelte';

	let input = $state('');
	let messagesEl = $state<HTMLDivElement | null>(null);

	const bugs = $derived(reviewStore.bugs);
	const flags = $derived(reviewStore.flags);
	const messages = $derived(reviewStore.chatMessages);
	const streaming = $derived(reviewStore.streaming);
	const activeTab = $derived(reviewStore.activeTab);

	async function handleSend(e?: SubmitEvent) {
		e?.preventDefault();
		const q = input.trim();
		if (!q || streaming) return;
		input = '';
		await reviewStore.sendMessage(q);
		// Scroll to bottom after new message
		await tick();
		if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
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
			Code Review
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
	</div>

	<!-- Tab content -->
	{#if activeTab === 'review'}
		<!-- Messages -->
		<div class="messages" bind:this={messagesEl} role="log" aria-live="polite">
			{#if messages.length === 0}
				<div class="empty-chat">
					<svg
						width="32"
						height="32"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						opacity="0.3"
					>
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
									<path
										d="M9 10 Q14 6 19 10 Q21 14 19 18 Q14 22 9 18 Q7 14 9 10Z"
										fill="var(--accent)"
										opacity="0.7"
									/>
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

		<!-- Input -->
		<form class="chat-input-row" onsubmit={handleSend}>
			<textarea
				placeholder="Ask about this PR…"
				bind:value={input}
				onkeydown={handleKeydown}
				disabled={streaming}
				rows="1"
			></textarea>
			<button
				type="submit"
				class="send-btn"
				disabled={!input.trim() || streaming}
				aria-label="Send"
			>
				<svg
					width="15"
					height="15"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
				>
					<line x1="22" y1="2" x2="11" y2="13" />
					<polygon points="22 2 15 22 11 13 2 9 22 2" />
				</svg>
			</button>
		</form>
	{:else if activeTab === 'flags'}
		<div class="findings-list">
			{#if flags.length === 0}
				<div class="empty-findings">
					{#if reviewStore.status !== 'done'}
						<p>Run a review to see flags.</p>
					{:else}
						<svg
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="var(--green)"
							stroke-width="1.5"
						>
							<polyline points="20 6 9 17 4 12" />
						</svg>
						<p>No flags found</p>
					{/if}
				</div>
			{:else}
				{#each flags as f (f.id)}
					<button class="finding-card" onclick={() => reviewStore.highlightFinding(f)}>
						<div class="finding-header">
							<span
								class="sev-pill"
								style="color: {sevColor[f.severity] ?? 'var(--muted)'}; border-color: {sevColor[
									f.severity
								] ?? 'var(--border)'};"
							>
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
	{:else}
		<div class="findings-list">
			{#if bugs.length === 0}
				<div class="empty-findings">
					{#if reviewStore.status !== 'done'}
						<p>Run a review to see bugs.</p>
					{:else}
						<svg
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="var(--green)"
							stroke-width="1.5"
						>
							<polyline points="20 6 9 17 4 12" />
						</svg>
						<p>No bugs found</p>
					{/if}
				</div>
			{:else}
				{#each bugs as f (f.id)}
					<button class="finding-card bug" onclick={() => reviewStore.highlightFinding(f)}>
						<div class="finding-header">
							<span
								class="sev-pill"
								style="color: {sevColor[f.severity] ?? 'var(--red)'}; border-color: {sevColor[
									f.severity
								] ?? 'var(--red)'};"
							>
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
		padding: 0.6rem 0.5rem;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		font-size: 0.78rem;
		font-weight: 500;
		color: var(--muted);
		cursor: pointer;
		font-family: inherit;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.tab-bar button.active {
		color: var(--text);
		border-bottom-color: var(--accent);
	}
	.tab-bar button:hover:not(.active) {
		color: var(--text);
	}

	.tab-badge {
		font-size: 0.65rem;
		font-weight: 700;
		padding: 0.05rem 0.35rem;
		border-radius: 99px;
	}
	.tab-badge.bug {
		background: rgba(248, 113, 113, 0.15);
		color: var(--red);
	}
	.tab-badge.flag {
		background: rgba(251, 191, 36, 0.12);
		color: var(--yellow);
	}

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
	.empty-chat p {
		font-size: 0.83rem;
		color: var(--muted);
	}
	.empty-hint {
		font-size: 0.75rem;
		opacity: 0.6;
	}

	.message {
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
	}
	.message.user {
		flex-direction: row-reverse;
	}

	.msg-avatar {
		width: 26px;
		height: 26px;
		background: var(--accent-glow);
		border: 1px solid rgba(124, 106, 247, 0.2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
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

	.msg-content {
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.typing-dots {
		display: flex;
		gap: 4px;
		align-items: center;
		height: 16px;
	}
	.typing-dots span {
		width: 5px;
		height: 5px;
		background: var(--muted);
		border-radius: 50%;
		animation: bounce 1.2s ease infinite;
	}
	.typing-dots span:nth-child(2) {
		animation-delay: 0.2s;
	}
	.typing-dots span:nth-child(3) {
		animation-delay: 0.4s;
	}
	@keyframes bounce {
		0%,
		80%,
		100% {
			transform: translateY(0);
		}
		40% {
			transform: translateY(-6px);
		}
	}

	/* Chat input */
	.chat-input-row {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		padding: 0.625rem;
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
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
		line-height: 1.5;
	}
	textarea::placeholder {
		color: var(--muted);
		opacity: 0.5;
	}
	textarea:focus {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-glow);
	}
	textarea:disabled {
		opacity: 0.5;
	}

	.send-btn {
		width: 34px;
		height: 34px;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: opacity 0.15s;
	}
	.send-btn:hover:not(:disabled) {
		opacity: 0.88;
	}
	.send-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* Findings list (Flags / Bugs tabs) */
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
	.empty-findings p {
		font-size: 0.83rem;
		color: var(--muted);
	}

	.finding-card {
		width: 100%;
		text-align: left;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.625rem 0.75rem;
		cursor: pointer;
		font-family: inherit;
		transition:
			border-color 0.15s,
			background 0.1s;
	}
	.finding-card:hover {
		border-color: var(--accent);
		background: var(--accent-glow);
	}
	.finding-card.bug {
		border-left: 3px solid var(--red);
	}

	.finding-header {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-bottom: 0.35rem;
	}

	.sev-pill {
		font-size: 0.65rem;
		font-weight: 800;
		padding: 0.1rem 0.35rem;
		border-radius: 4px;
		border: 1px solid;
		font-family: monospace;
	}

	.finding-type {
		font-size: 0.68rem;
		color: var(--muted);
		text-transform: capitalize;
	}

	.finding-title {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text);
		margin: 0 0 0.25rem;
		line-height: 1.4;
	}

	.finding-file {
		font-size: 0.7rem;
		color: var(--muted);
		font-family: monospace;
		margin: 0;
	}

	.finding-suggestion {
		font-size: 0.75rem;
		color: var(--muted);
		margin: 0.35rem 0 0;
		line-height: 1.5;
		border-top: 1px solid var(--border);
		padding-top: 0.35rem;
	}
</style>
