import { describe, it, expect } from 'vitest';

// ── Eval: Diff parsing accuracy — golden datasets ────────────────────────────
//
// Evaluates the diff parser against a curated set of realistic unified diffs
// to verify hunk counts, line counts, and line number tracking accuracy.

// ── Diff parser (matching src/lib DiffViewer logic) ──────────────────────────

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
			if (m) {
				oldNo = parseInt(m[1]) - 1;
				newNo = parseInt(m[2]) - 1;
			}
			result.push({ type: 'hunk', oldNo: null, newNo: null, content: line });
		} else if (line.startsWith('+')) {
			newNo++;
			result.push({ type: 'add', oldNo: null, newNo, content: line.slice(1) });
		} else if (line.startsWith('-')) {
			oldNo++;
			result.push({ type: 'remove', oldNo, newNo: null, content: line.slice(1) });
		} else {
			oldNo++;
			newNo++;
			result.push({ type: 'context', oldNo, newNo, content: line.slice(1) });
		}
	}
	return result;
}

// ── Helper to count line types ──────────────────────────────────────────────

function countTypes(lines: DiffLine[]) {
	return {
		hunks: lines.filter((l) => l.type === 'hunk').length,
		adds: lines.filter((l) => l.type === 'add').length,
		removes: lines.filter((l) => l.type === 'remove').length,
		context: lines.filter((l) => l.type === 'context').length,
	};
}

// ── Golden dataset: realistic unified diffs ──────────────────────────────────

describe('eval — diff parsing: single hunk diffs', () => {
	it('parses a simple one-line change', () => {
		const patch = `@@ -1,3 +1,3 @@
 const a = 1;
-const b = 2;
+const b = 3;
 const c = 4;`;

		const lines = parsePatch(patch);
		const counts = countTypes(lines);

		expect(counts.hunks).toBe(1);
		expect(counts.adds).toBe(1);
		expect(counts.removes).toBe(1);
		expect(counts.context).toBe(2);
	});

	it('parses a pure addition (new function)', () => {
		const patch = `@@ -5,3 +5,8 @@
 import { db } from './db';
+
+export function clearCache(): void {
+  cache.clear();
+  console.log('Cache cleared');
+}
 export default app;`;

		const lines = parsePatch(patch);
		const counts = countTypes(lines);

		expect(counts.hunks).toBe(1);
		expect(counts.adds).toBe(5);
		expect(counts.removes).toBe(0);
		expect(counts.context).toBe(2);
	});

	it('parses a pure deletion', () => {
		const patch = `@@ -10,5 +10,3 @@
 function old() {
-  console.log('deprecated');
-  return null;
 }`;

		const lines = parsePatch(patch);
		const counts = countTypes(lines);

		expect(counts.hunks).toBe(1);
		expect(counts.adds).toBe(0);
		expect(counts.removes).toBe(2);
		expect(counts.context).toBe(2);
	});
});

describe('eval — diff parsing: multi-hunk diffs', () => {
	it('parses a two-hunk diff with correct line numbers', () => {
		const patch = `@@ -1,4 +1,4 @@
-import { old } from './old';
+import { updated } from './updated';
 import { db } from './db';

 const config = {};
@@ -20,3 +20,4 @@
 function main() {
   init();
+  setup();
 }`;

		const lines = parsePatch(patch);
		const counts = countTypes(lines);

		expect(counts.hunks).toBe(2);
		expect(counts.adds).toBe(2);
		expect(counts.removes).toBe(1);

		// Verify line numbers reset correctly at second hunk
		const secondHunkIdx = lines.findIndex(
			(l, i) => l.type === 'hunk' && i > 0
		);
		expect(secondHunkIdx).toBeGreaterThan(0);

		// The context line "function main()" should be at old line 20
		const mainLine = lines[secondHunkIdx + 1];
		expect(mainLine.type).toBe('context');
		expect(mainLine.oldNo).toBe(20);
		expect(mainLine.newNo).toBe(20);
	});

	it('parses a three-hunk diff', () => {
		const patch = `@@ -1,2 +1,2 @@
-const VERSION = '1.0.0';
+const VERSION = '2.0.0';
 export default VERSION;
@@ -10,3 +10,3 @@
 function getVersion() {
-  return '1.0.0';
+  return '2.0.0';
 }
@@ -25,2 +25,3 @@
 // footer
+// updated in v2
 export {};`;

		const lines = parsePatch(patch);
		const counts = countTypes(lines);

		expect(counts.hunks).toBe(3);
		expect(counts.adds).toBe(3);
		expect(counts.removes).toBe(2);
	});
});

describe('eval — diff parsing: edge cases', () => {
	it('handles empty patch string', () => {
		const lines = parsePatch('');
		// An empty string produces one "context" line with empty content
		expect(lines).toHaveLength(1);
		expect(lines[0].type).toBe('context');
		expect(lines[0].content).toBe('');
	});

	it('handles patch with only a hunk header and no content', () => {
		const patch = '@@ -1,0 +1,0 @@';
		const lines = parsePatch(patch);

		expect(lines).toHaveLength(1);
		expect(lines[0].type).toBe('hunk');
	});

	it('handles binary file notation (no parseable hunks)', () => {
		// Binary files typically show as a single context-like line
		const patch = 'Binary files a/image.png and b/image.png differ';
		const lines = parsePatch(patch);

		// Should not crash, produces context lines
		expect(lines.length).toBeGreaterThan(0);
		const counts = countTypes(lines);
		expect(counts.hunks).toBe(0);
	});

	it('handles renamed file with no content change', () => {
		// Some diffs for renames show only the header
		const patch = '@@ -1,3 +1,3 @@\n old content\n more content\n last line';
		const lines = parsePatch(patch);
		const counts = countTypes(lines);

		expect(counts.hunks).toBe(1);
		expect(counts.adds).toBe(0);
		expect(counts.removes).toBe(0);
		expect(counts.context).toBe(3);
	});

	it('handles diff with only additions (new file)', () => {
		const patch = `@@ -0,0 +1,4 @@
+export const APP_NAME = 'RunOwl';
+export const VERSION = '1.0.0';
+export const ENV = 'production';
+export default { APP_NAME, VERSION, ENV };`;

		const lines = parsePatch(patch);
		const counts = countTypes(lines);

		expect(counts.hunks).toBe(1);
		expect(counts.adds).toBe(4);
		expect(counts.removes).toBe(0);
		expect(counts.context).toBe(0);

		// Line numbers should start at 1 for new file
		expect(lines[1].newNo).toBe(1);
		expect(lines[4].newNo).toBe(4);
	});

	it('handles diff with only deletions (deleted file)', () => {
		const patch = `@@ -1,3 +0,0 @@
-const deprecated = true;
-export default deprecated;
-// remove me`;

		const lines = parsePatch(patch);
		const counts = countTypes(lines);

		expect(counts.hunks).toBe(1);
		expect(counts.adds).toBe(0);
		expect(counts.removes).toBe(3);
	});
});

describe('eval — diff parsing: line number tracking accuracy', () => {
	it('tracks line numbers correctly through a complex diff', () => {
		const patch = `@@ -10,7 +10,8 @@
 import { a } from './a';
 import { b } from './b';
-import { c } from './c';
+import { c } from './c-updated';
+import { d } from './d';

 export function main() {
   return a() + b();
 }`;

		const lines = parsePatch(patch);

		// Context: "import { a }" -> old 10, new 10
		expect(lines[1].oldNo).toBe(10);
		expect(lines[1].newNo).toBe(10);

		// Context: "import { b }" -> old 11, new 11
		expect(lines[2].oldNo).toBe(11);
		expect(lines[2].newNo).toBe(11);

		// Remove: "import { c }" -> old 12
		expect(lines[3].type).toBe('remove');
		expect(lines[3].oldNo).toBe(12);
		expect(lines[3].newNo).toBeNull();

		// Add: "import { c } from './c-updated'" -> new 12
		expect(lines[4].type).toBe('add');
		expect(lines[4].oldNo).toBeNull();
		expect(lines[4].newNo).toBe(12);

		// Add: "import { d }" -> new 13
		expect(lines[5].type).toBe('add');
		expect(lines[5].newNo).toBe(13);

		// Context: empty line -> old 13, new 14
		expect(lines[6].type).toBe('context');
		expect(lines[6].oldNo).toBe(13);
		expect(lines[6].newNo).toBe(14);

		// Context: "export function main()" -> old 14, new 15
		expect(lines[7].oldNo).toBe(14);
		expect(lines[7].newNo).toBe(15);
	});

	it('tracks line numbers across hunk boundaries', () => {
		const patch = `@@ -1,3 +1,3 @@
 line1
-line2
+line2-modified
 line3
@@ -50,3 +50,3 @@
 line50
-line51
+line51-modified
 line52`;

		const lines = parsePatch(patch);

		// First hunk
		expect(lines[1].oldNo).toBe(1); // line1
		expect(lines[2].oldNo).toBe(2); // -line2
		expect(lines[3].newNo).toBe(2); // +line2-modified
		expect(lines[4].oldNo).toBe(3); // line3

		// Second hunk — numbers should reset based on hunk header
		const hunk2Idx = lines.findIndex((l, i) => l.type === 'hunk' && i > 0);
		expect(lines[hunk2Idx + 1].oldNo).toBe(50); // line50
		expect(lines[hunk2Idx + 2].oldNo).toBe(51); // -line51
		expect(lines[hunk2Idx + 3].newNo).toBe(51); // +line51-modified
		expect(lines[hunk2Idx + 4].oldNo).toBe(52); // line52
	});
});

describe('eval — diff parsing: realistic multi-file scenarios', () => {
	it('parses a typical TypeScript refactor diff', () => {
		const patch = `@@ -1,8 +1,10 @@
-import { useState } from 'react';
+import { useState, useCallback } from 'react';
+import { debounce } from 'lodash';

 export function Search() {
-  const [query, setQuery] = useState('');
+  const [query, setQuery] = useState<string>('');
+  const debouncedSearch = useCallback(debounce(search, 300), []);

-  function handleChange(e) {
+  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
     setQuery(e.target.value);`;

		const lines = parsePatch(patch);
		const counts = countTypes(lines);

		expect(counts.hunks).toBe(1);
		expect(counts.adds).toBe(5);
		expect(counts.removes).toBe(3);
		expect(counts.context).toBe(4);
		expect(counts.adds + counts.removes + counts.context + counts.hunks).toBe(lines.length);
	});

	it('parses a config file diff with many small changes', () => {
		const patch = `@@ -1,6 +1,6 @@
 {
-  "name": "old-name",
-  "version": "0.9.0",
+  "name": "new-name",
+  "version": "1.0.0",
   "private": true,
   "scripts": {
@@ -10,4 +10,5 @@
     "build": "vite build",
-    "test": "vitest"
+    "test": "vitest run",
+    "test:watch": "vitest"
   }
 }`;

		const lines = parsePatch(patch);
		const counts = countTypes(lines);

		expect(counts.hunks).toBe(2);
		expect(counts.adds).toBe(4);
		expect(counts.removes).toBe(3);
	});
});
