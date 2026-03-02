import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SSE_HEADERS } from "@/lib/sse";
import { IClientCartItem } from "@/types";

export const dynamic = "force-dynamic";

// ─── Per-connection registry ──────────────────────────────────────────────────
// Maps clientId → { userId, send } so the POST handler can broadcast to all
// connections of a user EXCEPT the originating client (skip-echo).

type SendFn = (items: IClientCartItem[]) => void;

const g = globalThis as typeof globalThis & {
  _fcCartConns?: Map<string, { userId: string; send: SendFn }>;
};
if (!g._fcCartConns) g._fcCartConns = new Map();
const connections = g._fcCartConns;

// ─── GET — SSE stream ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const clientId = req.nextUrl.searchParams.get("clientId") ?? Math.random().toString(36).slice(2);
  const userId   = session.user.id;
  const enc      = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send: SendFn = (items) => {
        try {
          controller.enqueue(
            enc.encode(`event: cartUpdate\ndata: ${JSON.stringify({ items })}\n\n`)
          );
        } catch {
          connections.delete(clientId);
        }
      };

      connections.set(clientId, { userId, send });

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(enc.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30_000);

      req.signal.addEventListener("abort", () => {
        connections.delete(clientId);
        clearInterval(heartbeat);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

// ─── POST — broadcast cart state ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false }, { status: 401 });

  const userId = session.user.id;
  const { items, clientId } = (await req.json()) as {
    items: IClientCartItem[];
    clientId: string;
  };

  // Push to all connected tabs/devices of this user EXCEPT the sender
  for (const [connId, conn] of connections) {
    if (conn.userId === userId && connId !== clientId) {
      conn.send(items);
    }
  }

  return NextResponse.json({ success: true });
}
