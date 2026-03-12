import { describe, it, expect } from 'vitest';

// ── Layout & resizable panel logic ────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function applyResize(
	currentWidth: number,
	delta: number,
	min: number,
	max: number
): number {
	return clamp(currentWidth + delta, min, max);
}

describe('layout — panel resize clamping', () => {
	it('does not shrink below minimum width', () => {
		expect(applyResize(200, -200, 160, 400)).toBe(160);
	});

	it('does not grow beyond maximum width', () => {
		expect(applyResize(380, 100, 160, 400)).toBe(400);
	});

	it('applies delta within bounds', () => {
		expect(applyResize(220, 30, 160, 400)).toBe(250);
	});

	it('handles zero delta', () => {
		expect(applyResize(220, 0, 160, 400)).toBe(220);
	});

	it('handles negative delta within bounds', () => {
		expect(applyResize(220, -30, 160, 400)).toBe(190);
	});
});

describe('layout — keyboard shortcuts', () => {
	function handleShortcut(key: string, meta: boolean): string | null {
		if (meta && key === 'k') return 'reset';
		if (key === 'Enter') return 'send-message';
		return null;
	}

	it('⌘K triggers reset', () => {
		expect(handleShortcut('k', true)).toBe('reset');
	});

	it('Enter triggers send-message', () => {
		expect(handleShortcut('Enter', false)).toBe('send-message');
	});

	it('unknown key does nothing', () => {
		expect(handleShortcut('z', false)).toBeNull();
	});

	it('k without meta does nothing', () => {
		expect(handleShortcut('k', false)).toBeNull();
	});
});

describe('layout — responsive breakpoint', () => {
	const MOBILE_BREAKPOINT = 768;

	function isMobile(width: number): boolean {
		return width <= MOBILE_BREAKPOINT;
	}

	it('treats 768px as mobile', () => {
		expect(isMobile(768)).toBe(true);
	});

	it('treats 769px as desktop', () => {
		expect(isMobile(769)).toBe(false);
	});

	it('treats 375px as mobile', () => {
		expect(isMobile(375)).toBe(true);
	});

	it('treats 1440px as desktop', () => {
		expect(isMobile(1440)).toBe(false);
	});
});

describe('layout — panel min/max constraints', () => {
	const PANEL_CONSTRAINTS = {
		summary: { min: 36, max: 360 },
		files:   { min: 160, max: 360 },
		chat:    { min: 260, max: 520 },
	};

	it('summary panel allows collapse to 36px', () => {
		expect(applyResize(240, -300, PANEL_CONSTRAINTS.summary.min, PANEL_CONSTRAINTS.summary.max)).toBe(36);
	});

	it('chat panel enforces 260px minimum', () => {
		expect(applyResize(340, -200, PANEL_CONSTRAINTS.chat.min, PANEL_CONSTRAINTS.chat.max)).toBe(260);
	});

	it('chat panel caps at 520px', () => {
		expect(applyResize(340, 500, PANEL_CONSTRAINTS.chat.min, PANEL_CONSTRAINTS.chat.max)).toBe(520);
	});
});
