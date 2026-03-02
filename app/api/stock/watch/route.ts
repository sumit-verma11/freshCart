import { NextRequest } from "next/server";
import { sseEmitter, SSE_HEADERS } from "@/lib/sse";

export const dynamic = "force-dynamic";

/**
 * GET /api/stock/watch?products=id1,id2,id3
 *
 * Public SSE endpoint. Subscribes to `stock:{id}` channels for each product ID.
 * Emits `event: stockUpdate` with { productId, stockQty, isAvailable } whenever
 * the admin updates product availability or stock quantity.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("products") ?? "";
  const productIds = raw.split(",").map((s) => s.trim()).filter(Boolean);

  if (productIds.length === 0) {
    return new Response("products query param required", { status: 400 });
  }

  const enc = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const listeners: Array<{ channel: string; fn: (d: object) => void }> = [];

      for (const pid of productIds) {
        const channel = `stock:${pid}`;
        const fn = (data: object) => {
          try {
            controller.enqueue(
              enc.encode(`event: stockUpdate\ndata: ${JSON.stringify(data)}\n\n`)
            );
          } catch {
            sseEmitter.off(channel, fn);
          }
        };
        sseEmitter.on(channel, fn);
        listeners.push({ channel, fn });
      }

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(enc.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30_000);

      req.signal.addEventListener("abort", () => {
        for (const { channel, fn } of listeners) {
          sseEmitter.off(channel, fn);
        }
        clearInterval(heartbeat);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
