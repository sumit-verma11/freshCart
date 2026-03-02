import { EventEmitter } from "events";

// ─── Global singleton ─────────────────────────────────────────────────────────
// Stored on globalThis so Next.js hot-reloads don't destroy the emitter and
// disconnect all live SSE clients.

const g = globalThis as typeof globalThis & { _fcSSE?: EventEmitter };

if (!g._fcSSE) {
  g._fcSSE = new EventEmitter();
  g._fcSSE.setMaxListeners(1000);
}

export const sseEmitter = g._fcSSE;

// ─── Active SSE connection counter ───────────────────────────────────────────
// Incremented/decremented by each SSE route handler on connect/disconnect.
const gc = globalThis as typeof globalThis & { _fcSSECount?: number };
if (gc._fcSSECount === undefined) gc._fcSSECount = 0;

export function sseConnect()    { gc._fcSSECount! += 1; }
export function sseDisconnect() { gc._fcSSECount! = Math.max(0, gc._fcSSECount! - 1); }
export function getSSECount()   { return gc._fcSSECount ?? 0; }

/**
 * Publish an event to all SSE clients subscribed to `channel`.
 */
export function publishSSE(channel: string, data: object): void {
  sseEmitter.emit(channel, data);
}

/**
 * Standard SSE response headers.
 */
export const SSE_HEADERS = {
  "Content-Type":    "text/event-stream",
  "Cache-Control":   "no-cache, no-transform",
  "Connection":      "keep-alive",
  "X-Accel-Buffering": "no", // prevent nginx buffering
} as const;
