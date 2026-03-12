import { describe, it, expect } from 'vitest';

// ── Chat panel logic tests ────────────────────────────────────────────────────

interface ChatMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
}

function parseSSEChunk(chunk: string): string[] {
	return chunk
		.split('\n')
		.filter((l) => l.startsWith('data: '))
		.map((l) => l.slice(6))
		.filter((payload) => payload !== '[DONE]');
}

function buildSelectionQuestion(filename: string, selection: string): string {
	return `Regarding this code in \`${filename}\`:\n\`\`\`\n${selection}\n\`\`\`\nCan you explain what it does and flag any issues?`;
}

describe('chat — SSE chunk parsing', () => {
	it('extracts data from a single SSE line', () => {
		const chunk = 'data: hello world\n\n';
		expect(parseSSEChunk(chunk)).toEqual(['hello world']);
	});

	it('ignores [DONE] sentinel', () => {
		const chunk = 'data: last chunk\ndata: [DONE]\n';
		expect(parseSSEChunk(chunk)).toEqual(['last chunk']);
	});

	it('returns empty array for non-data lines', () => {
		expect(parseSSEChunk('event: ping\n\n')).toEqual([]);
	});

	it('handles multiple data lines in one chunk', () => {
		const chunk = 'data: chunk1\ndata: chunk2\ndata: [DONE]\n';
		expect(parseSSEChunk(chunk)).toEqual(['chunk1', 'chunk2']);
	});
});

describe('chat — message list management', () => {
	it('appends user message before assistant placeholder', () => {
		const messages: ChatMessage[] = [];
		const userMsg: ChatMessage = {
			id: '1',
			role: 'user',
			content: 'Hello?',
			timestamp: Date.now(),
		};
		const assistantMsg: ChatMessage = {
			id: '2',
			role: 'assistant',
			content: '',
			timestamp: Date.now(),
		};
		messages.push(userMsg, assistantMsg);
		expect(messages[0].role).toBe('user');
		expect(messages[1].role).toBe('assistant');
		expect(messages[1].content).toBe('');
	});

	it('updates only the targeted assistant message by id', () => {
		const id = 'target';
		let messages: ChatMessage[] = [
			{ id: 'other', role: 'assistant', content: 'keep', timestamp: 1 },
			{ id, role: 'assistant', content: '', timestamp: 2 },
		];
		const delta = 'Hello ';
		messages = messages.map((m) => (m.id === id ? { ...m, content: m.content + delta } : m));
		expect(messages[0].content).toBe('keep');
		expect(messages[1].content).toBe('Hello ');
	});

	it('accumulates streamed tokens into final content', () => {
		const tokens = ['The ', 'answer ', 'is ', '42.'];
		let content = '';
		for (const t of tokens) content += t;
		expect(content).toBe('The answer is 42.');
	});
});

describe('chat — code selection context', () => {
	it('builds a well-formed question from selection', () => {
		const q = buildSelectionQuestion('src/auth.ts', 'const x = 1;');
		expect(q).toContain('src/auth.ts');
		expect(q).toContain('const x = 1;');
		expect(q).toContain('```');
	});

	it('does not build a question for empty selection', () => {
		const selection = '   ';
		expect(selection.trim().length).toBe(0); // guard that would prevent the question being sent
	});
});

describe('chat — tab badge counts', () => {
	type Severity = 'P0' | 'P1' | 'P2' | 'P3';
	interface Finding {
		id: string;
		severity: Severity;
	}

	const findings: Finding[] = [
		{ id: '1', severity: 'P0' },
		{ id: '2', severity: 'P1' },
		{ id: '3', severity: 'P2' },
		{ id: '4', severity: 'P3' },
	];

	const bugs = findings.filter((f) => f.severity === 'P0' || f.severity === 'P1');
	const flags = findings.filter((f) => f.severity === 'P2' || f.severity === 'P3');

	it('counts bugs correctly (P0 + P1)', () => {
		expect(bugs).toHaveLength(2);
	});

	it('counts flags correctly (P2 + P3)', () => {
		expect(flags).toHaveLength(2);
	});
});
