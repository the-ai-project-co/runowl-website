import { describe, it, expect } from 'vitest';

// ── Diff parser logic (extracted from DiffViewer.svelte) ──────────────────────

interface DiffLine {
	type: 'context' | 'add' | 'remove' | 'hunk';
	oldNo: number | null;
	newNo: number | null;
	content: string;
}

function parsePatch(patch: string): DiffLine[] {
	const lines = patch.split('\n');
	const result: DiffLine[] = [];
	let oldNo = 0;
	let newNo = 0;

	for (const line of lines) {
		if (line.startsWith('@@')) {
			const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
			if (m) { oldNo = parseInt(m[1]) - 1; newNo = parseInt(m[2]) - 1; }
			result.push({ type: 'hunk', oldNo: null, newNo: null, content: line });
		} else if (line.startsWith('+')) {
			newNo++;
			result.push({ type: 'add', oldNo: null, newNo, content: line.slice(1) });
		} else if (line.startsWith('-')) {
			oldNo++;
			result.push({ type: 'remove', oldNo, newNo: null, content: line.slice(1) });
		} else {
			oldNo++; newNo++;
			result.push({ type: 'context', oldNo, newNo, content: line.slice(1) });
		}
	}
	return result;
}

const SAMPLE_PATCH = `@@ -1,5 +1,6 @@
 import foo from 'foo';
-const x = 1;
+const x = 2;
+const y = 3;
 export default x;`;

describe('diff viewer — parsePatch', () => {
	it('parses hunk header', () => {
		const lines = parsePatch(SAMPLE_PATCH);
		expect(lines[0].type).toBe('hunk');
		expect(lines[0].oldNo).toBeNull();
	});

	it('parses context line with correct line numbers', () => {
		const lines = parsePatch(SAMPLE_PATCH);
		const context = lines.find((l) => l.type === 'context' && l.content.trim() === "import foo from 'foo';");
		expect(context).toBeDefined();
		expect(context!.oldNo).toBe(1);
		expect(context!.newNo).toBe(1);
	});

	it('parses removed line (no newNo)', () => {
		const lines = parsePatch(SAMPLE_PATCH);
		const removed = lines.find((l) => l.type === 'remove');
		expect(removed).toBeDefined();
		expect(removed!.newNo).toBeNull();
		expect(removed!.content).toBe('const x = 1;');
	});

	it('parses added lines', () => {
		const lines = parsePatch(SAMPLE_PATCH);
		const added = lines.filter((l) => l.type === 'add');
		expect(added).toHaveLength(2);
		expect(added[0].oldNo).toBeNull();
		expect(added[0].content).toBe('const x = 2;');
	});

	it('line numbers increment correctly', () => {
		const lines = parsePatch(SAMPLE_PATCH);
		const addedNos = lines.filter((l) => l.type === 'add').map((l) => l.newNo);
		expect(addedNos[0]).toBeLessThan(addedNos[1]!);
	});

	it('handles empty patch', () => {
		expect(parsePatch('')).toEqual([{ type: 'context', oldNo: 1, newNo: 1, content: '' }]);
	});
});

describe('diff viewer — collapse threshold logic', () => {
	const COLLAPSE_THRESHOLD = 6;

	function shouldCollapseAtPosition(runLen: number, posInRun: number): boolean {
		return runLen > COLLAPSE_THRESHOLD && posInRun >= 3 && posInRun < runLen - 3;
	}

	it('does not collapse short runs', () => {
		expect(shouldCollapseAtPosition(4, 2)).toBe(false);
	});

	it('collapses middle of long context run', () => {
		expect(shouldCollapseAtPosition(10, 4)).toBe(true);
	});

	it('does not collapse first 3 lines of long run', () => {
		expect(shouldCollapseAtPosition(10, 1)).toBe(false);
	});

	it('does not collapse last 3 lines of long run', () => {
		expect(shouldCollapseAtPosition(10, 8)).toBe(false);
	});
});

describe('diff viewer — file status detection', () => {
	const statusIcon: Record<string, { icon: string; color: string }> = {
		added:    { icon: 'A', color: 'var(--green)' },
		modified: { icon: 'M', color: 'var(--yellow)' },
		removed:  { icon: 'D', color: 'var(--red)' },
		renamed:  { icon: 'R', color: 'var(--accent)' },
	};

	it('maps added status correctly', () => {
		expect(statusIcon['added'].icon).toBe('A');
	});

	it('maps removed status to red', () => {
		expect(statusIcon['removed'].color).toBe('var(--red)');
	});

	it('falls back to unknown for unrecognised status', () => {
		expect(statusIcon['binary']).toBeUndefined();
	});
});
