import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import { sseEmitter, SSE_HEADERS } from "@/lib/sse";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Auth check
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Validate order belongs to user
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return new Response("Invalid order ID", { status: 400 });
  }

  await connectDB();
  const order = await Order.findById(id).lean();
  if (!order) return new Response("Order not found", { status: 404 });
  if (order.userId.toString() !== session.user.id && session.user.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const channel = `order:${id}`;
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send the current status immediately so the client is never out of date
      controller.enqueue(
        enc.encode(`event: statusUpdate\ndata: ${JSON.stringify({ status: order.status, updatedAt: order.updatedAt ?? order.placedAt })}\n\n`)
      );

      const listener = (data: object) => {
        try {
          controller.enqueue(
            enc.encode(`event: statusUpdate\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          sseEmitter.off(channel, listener);
        }
      };

      sseEmitter.on(channel, listener);

      // 30-second heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(enc.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30_000);

      req.signal.addEventListener("abort", () => {
        sseEmitter.off(channel, listener);
        clearInterval(heartbeat);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
