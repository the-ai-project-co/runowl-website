import { describe, it, expect } from 'vitest';

// ── Video & replay viewer logic ───────────────────────────────────────────────

function formatTime(s: number): string {
	const m = Math.floor(s / 60);
	const sec = Math.floor(s % 60);
	return `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatMs(ms: number): string {
	if (ms < 1000) return `${Math.round(ms)}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

function markerPosition(offsetMs: number, durationSeconds: number): number {
	return durationSeconds > 0 ? (offsetMs / 1000 / durationSeconds) * 100 : 0;
}

function methodColor(method: string): string {
	const m = (method ?? '').toUpperCase();
	if (m === 'GET') return 'var(--green)';
	if (m === 'POST') return 'var(--accent)';
	if (m === 'PUT' || m === 'PATCH') return 'var(--yellow)';
	if (m === 'DELETE') return 'var(--red)';
	return 'var(--muted)';
}

function statusColor(status: number): string {
	if (status >= 200 && status < 300) return 'var(--green)';
	if (status >= 400) return 'var(--red)';
	return 'var(--yellow)';
}

function consoleColor(level: string): string {
	if (level === 'error') return 'var(--red)';
	if (level === 'warn') return 'var(--yellow)';
	return 'var(--muted)';
}

function filterEventsByType(
	events: Array<{ type: string }>,
	type: string
): Array<{ type: string }> {
	return events.filter((e) => e.type === type);
}

describe('video player — time formatting', () => {
	it('formats 0 seconds as 0:00', () => {
		expect(formatTime(0)).toBe('0:00');
	});

	it('formats 65 seconds as 1:05', () => {
		expect(formatTime(65)).toBe('1:05');
	});

	it('formats 3600 seconds as 60:00', () => {
		expect(formatTime(3600)).toBe('60:00');
	});

	it('pads seconds below 10 with leading zero', () => {
		expect(formatTime(61)).toBe('1:01');
	});
});

describe('video player — millisecond formatting', () => {
	it('formats sub-second as ms', () => {
		expect(formatMs(500)).toBe('500ms');
	});

	it('formats exactly 1000ms as 1.00s', () => {
		expect(formatMs(1000)).toBe('1.00s');
	});

	it('formats 2500ms as 2.50s', () => {
		expect(formatMs(2500)).toBe('2.50s');
	});
});

describe('video player — marker positioning', () => {
	it('places marker at 50% for halfway point', () => {
		expect(markerPosition(5000, 10)).toBeCloseTo(50);
	});

	it('places marker at 0% when at start', () => {
		expect(markerPosition(0, 30)).toBe(0);
	});

	it('places marker at 100% at end', () => {
		expect(markerPosition(30000, 30)).toBeCloseTo(100);
	});

	it('returns 0% when duration is 0 (avoid divide by zero)', () => {
		expect(markerPosition(1000, 0)).toBe(0);
	});
});

describe('replay viewer — network panel colors', () => {
	it('colors GET requests green', () => {
		expect(methodColor('GET')).toBe('var(--green)');
	});

	it('colors POST requests accent', () => {
		expect(methodColor('POST')).toBe('var(--accent)');
	});

	it('colors DELETE requests red', () => {
		expect(methodColor('DELETE')).toBe('var(--red)');
	});

	it('colors 200 status green', () => {
		expect(statusColor(200)).toBe('var(--green)');
	});

	it('colors 404 status red', () => {
		expect(statusColor(404)).toBe('var(--red)');
	});

	it('colors 301 status yellow', () => {
		expect(statusColor(301)).toBe('var(--yellow)');
	});
});

describe('replay viewer — console level colors', () => {
	it('colors error level red', () => {
		expect(consoleColor('error')).toBe('var(--red)');
	});

	it('colors warn level yellow', () => {
		expect(consoleColor('warn')).toBe('var(--yellow)');
	});

	it('colors log level muted', () => {
		expect(consoleColor('log')).toBe('var(--muted)');
	});
});

describe('replay viewer — event filtering', () => {
	const events = [
		{ type: 'network_request' },
		{ type: 'console_log' },
		{ type: 'network_request' },
		{ type: 'assertion' },
	];

	it('filters only network requests', () => {
		expect(filterEventsByType(events, 'network_request')).toHaveLength(2);
	});

	it('filters only console logs', () => {
		expect(filterEventsByType(events, 'console_log')).toHaveLength(1);
	});

	it('returns empty for absent type', () => {
		expect(filterEventsByType(events, 'dom_action')).toHaveLength(0);
	});
});

describe('replay viewer — linked assertion detection', () => {
	const events = [
		{ type: 'network_request', offset_ms: 100, linked_assertion_id: null },
		{ type: 'assertion', offset_ms: 500, linked_assertion_id: 'assert-1' },
		{ type: 'console_log', offset_ms: 300, linked_assertion_id: 'assert-1' },
	];

	it('finds the linked assertion ms from events', () => {
		const linked = events.find((e) => e.linked_assertion_id);
		expect(linked?.offset_ms).toBe(500);
	});

	it('returns null when no linked assertion', () => {
		const clean = [{ type: 'network_request', offset_ms: 100, linked_assertion_id: null }];
		const linked = clean.find((e) => e.linked_assertion_id);
		expect(linked?.offset_ms ?? null).toBeNull();
	});
});
