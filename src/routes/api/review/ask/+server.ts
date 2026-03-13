import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MOCK } from '$lib/server/seed';

/**
 * POST /api/review/ask — stream an AI answer via SSE.
 *
 * Request body: { url: string; question: string; context?: string }
 * Response: text/event-stream  (data: <chunk>\n\n ... data: [DONE]\n\n)
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) error(401, 'Unauthorized');

	const body = await request.json().catch(() => null);
	const { url: prUrl, question, context } = body ?? {};

	if (!prUrl || !question) error(400, 'url and question are required');

	// CI / demo mode — stream a canned response
	if (MOCK) {
		const mockAnswer = `Great question! Looking at the PR, the rate limiter uses an in-memory \`Map\` with \`setTimeout\` for cleanup. The main concern is that under high load, the cleanup callbacks may queue up faster than they execute, causing the Map to grow unbounded and eventually trigger an OOM. A production-grade solution would use Redis with TTL-based keys instead.`;
		const encoder = new TextEncoder();
		const stream = new ReadableStream({
			start(controller) {
				const words = mockAnswer.split(' ');
				let i = 0;
				const interval = setInterval(() => {
					if (i >= words.length) {
						controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
						controller.close();
						clearInterval(interval);
					} else {
						controller.enqueue(encoder.encode(`data: ${words[i++]} \n\n`));
					}
				}, 40);
			},
		});
		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
				'X-Accel-Buffering': 'no',
			},
		});
	}

	const backendUrl = process.env.RUNOWL_BACKEND_URL ?? 'http://localhost:8000';

	// Try to proxy a streaming response from the backend.
	// If the backend isn't available, we still return a well-formed SSE stream
	// with a graceful error message.
	let backendStream: ReadableStream<Uint8Array> | null = null;

	try {
		const res = await fetch(`${backendUrl}/review/ask`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ url: prUrl, question, context }),
		});
		if (res.ok && res.body) backendStream = res.body;
	} catch {
		// backend unavailable — fall through to stub
	}

	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		async start(controller) {
			if (backendStream) {
				// Forward the backend SSE stream as-is
				const reader = backendStream.getReader();
				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						controller.enqueue(value);
					}
				} finally {
					reader.releaseLock();
				}
			} else {
				// Stub: backend not running — return a clear message
				const msg =
					'The RunOwl backend is not running. ' +
					'Start it with `uv run python -m runowl.main` and try again.';
				controller.enqueue(encoder.encode(`data: ${msg}\n\n`));
				controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
			}
			controller.close();
		},
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no',
		},
	});
};
