import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import PushSubscription from "@/models/PushSubscription";
import { OrderStatus } from "@/types";
import { publishSSE } from "@/lib/sse";
import { sendPushNotification } from "@/lib/webpush";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") return null;
  return session;
}

const VALID_STATUSES: OrderStatus[] = [
  "pending", "confirmed", "out_for_delivery", "delivered", "cancelled",
];

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 20;
    const status = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (status && VALID_STATUSES.includes(status as OrderStatus)) {
      query.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ placedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "name email phone")
        .lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[ADMIN ORDERS GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id, status } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "Order ID required" }, { status: 400 });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid order status" }, { status: 400 });
    }

    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {};
    if (status) updates.status = status;

    const order = await Order.findByIdAndUpdate(id, updates, { new: true });
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Push live status update to any connected SSE clients watching this order
    if (status) {
      publishSSE(`order:${id}`, { status, updatedAt: new Date().toISOString() });

      // Send web push notification when order goes out for delivery
      if (status === "out_for_delivery") {
        const subs = await PushSubscription.find({ userId: order.userId }).lean();
        await Promise.all(
          subs.map(async (sub) => {
            const ok = await sendPushNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              {
                title: "Your order is out for delivery! 🛵",
                body:  `Order #${order.orderNumber} is on its way to you.`,
                url:   "/orders",
                tag:   `order-${order._id}`,
              }
            );
            if (!ok) await PushSubscription.deleteOne({ _id: sub._id });
          })
        );
      }
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("[ADMIN ORDERS PATCH]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
