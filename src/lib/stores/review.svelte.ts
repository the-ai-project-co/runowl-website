/**
 * Reactive state for the active PR review session.
 * Uses Svelte 5 runes ($state, $derived) — import as a module singleton.
 */

export interface PRFile {
	filename: string;
	status: 'added' | 'modified' | 'removed' | 'renamed';
	additions: number;
	deletions: number;
	patch: string | null;
	blob_url: string;
}

export interface PRMeta {
	number: number;
	title: string;
	body: string | null;
	author: string;
	head_branch: string;
	base_branch: string;
	commits: number;
	additions: number;
	deletions: number;
	changed_files: number;
	state: 'open' | 'closed' | 'merged';
	created_at: string;
	url: string;
}

export interface Finding {
	id: string;
	severity: 'P0' | 'P1' | 'P2' | 'P3';
	type: 'bug' | 'security' | 'style' | 'architecture';
	title: string;
	description: string;
	file: string;
	line_start: number;
	line_end: number;
	suggestion: string | null;
}

export type ReviewStatus = 'idle' | 'loading_pr' | 'ready' | 'reviewing' | 'done' | 'error';

export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
}

function createReviewStore() {
	let prUrl = $state('');
	let status = $state<ReviewStatus>('idle');
	let errorMsg = $state<string | null>(null);
	let meta = $state<PRMeta | null>(null);
	let files = $state<PRFile[]>([]);
	let selectedFile = $state<string | null>(null);
	let findings = $state<Finding[]>([]);
	let chatMessages = $state<ChatMessage[]>([]);
	let streaming = $state(false);
	let activeTab = $state<'review' | 'flags' | 'bugs'>('review');
	let highlightedLine = $state<{ file: string; line: number } | null>(null);

	const flags = $derived(findings.filter((f) => f.severity === 'P2' || f.severity === 'P3'));
	const bugs = $derived(findings.filter((f) => f.severity === 'P0' || f.severity === 'P1'));
	const selectedFileData = $derived(files.find((f) => f.filename === selectedFile) ?? null);

	function reset() {
		prUrl = '';
		status = 'idle';
		errorMsg = null;
		meta = null;
		files = [];
		selectedFile = null;
		findings = [];
		chatMessages = [];
		streaming = false;
		activeTab = 'review';
		highlightedLine = null;
	}

	async function loadPR(url: string) {
		prUrl = url;
		status = 'loading_pr';
		errorMsg = null;
		meta = null;
		files = [];
		findings = [];
		chatMessages = [];

		try {
			const res = await fetch('/api/pr/load', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url }),
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({ message: res.statusText }));
				throw new Error(err.message ?? `Error ${res.status}`);
			}

			const data = await res.json();
			meta = data.meta;
			files = data.files;
			selectedFile = data.files[0]?.filename ?? null;
			status = 'ready';
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : 'Failed to load PR';
			status = 'error';
		}
	}

	async function runReview() {
		if (!prUrl || status === 'reviewing') return;
		status = 'reviewing';
		findings = [];

		try {
			const res = await fetch('/api/review/run', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: prUrl }),
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({ message: res.statusText }));
				throw new Error(err.message ?? `Error ${res.status}`);
			}

			const data = await res.json();
			findings = data.findings ?? [];
			status = 'done';
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : 'Review failed';
			status = 'error';
		}
	}

	async function sendMessage(question: string) {
		if (!question.trim() || streaming) return;

		const userMsg: ChatMessage = {
			id: crypto.randomUUID(),
			role: 'user',
			content: question.trim(),
			timestamp: Date.now(),
		};
		chatMessages = [...chatMessages, userMsg];

		const assistantMsg: ChatMessage = {
			id: crypto.randomUUID(),
			role: 'assistant',
			content: '',
			timestamp: Date.now(),
		};
		chatMessages = [...chatMessages, assistantMsg];
		streaming = true;

		try {
			const res = await fetch('/api/review/ask', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: prUrl, question: question.trim() }),
			});

			if (!res.ok || !res.body) throw new Error(`Error ${res.status}`);

			const reader = res.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				// Parse SSE lines: "data: <content>"
				for (const line of chunk.split('\n')) {
					if (!line.startsWith('data: ')) continue;
					const payload = line.slice(6);
					if (payload === '[DONE]') break;
					// Update the last assistant message in place
					chatMessages = chatMessages.map((m) =>
						m.id === assistantMsg.id ? { ...m, content: m.content + payload } : m
					);
				}
			}
		} catch (e) {
			chatMessages = chatMessages.map((m) =>
				m.id === assistantMsg.id
					? { ...m, content: 'Failed to get a response. Please try again.' }
					: m
			);
		} finally {
			streaming = false;
		}
	}

	function selectFile(filename: string) {
		selectedFile = filename;
		highlightedLine = null;
	}

	function highlightFinding(finding: Finding) {
		selectedFile = finding.file;
		highlightedLine = { file: finding.file, line: finding.line_start };
		activeTab = 'review';
	}

	return {
		get prUrl() { return prUrl; },
		get status() { return status; },
		get errorMsg() { return errorMsg; },
		get meta() { return meta; },
		get files() { return files; },
		get selectedFile() { return selectedFile; },
		get selectedFileData() { return selectedFileData; },
		get findings() { return findings; },
		get flags() { return flags; },
		get bugs() { return bugs; },
		get chatMessages() { return chatMessages; },
		get streaming() { return streaming; },
		get activeTab() { return activeTab; },
		get highlightedLine() { return highlightedLine; },
		set activeTab(v: 'review' | 'flags' | 'bugs') { activeTab = v; },
		reset,
		loadPR,
		runReview,
		sendMessage,
		selectFile,
		highlightFinding,
	};
}

export const reviewStore = createReviewStore();
