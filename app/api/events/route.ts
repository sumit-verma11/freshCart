import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import UserEvent from "@/models/UserEvent";
import { ok, fail } from "@/lib/api";

export const dynamic = "force-dynamic";

// POST /api/events — record a user event (anonymous-friendly)
export async function POST(req: NextRequest) {
  try {
    const { productId, event } = await req.json();
    if (!productId || !["view", "cart", "purchase"].includes(event)) {
      return fail("Invalid event payload", 400);
    }

    const session = await getServerSession(authOptions);
    await connectDB();

    await UserEvent.create({
      productId,
      event,
      userId: session?.user?.id ?? null,
    });

    return ok({ recorded: true });
  } catch (err) {
    console.error("[EVENTS POST]", err);
    return fail("Internal server error", 500);
  }
}

// GET /api/events?productId=X&event=cart&hours=24 — count events
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const event     = searchParams.get("event") ?? "cart";
    const hours     = parseInt(searchParams.get("hours") ?? "24");

    if (!productId) return fail("productId is required", 400);

    await connectDB();

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const count = await UserEvent.countDocuments({
      productId,
      event,
      timestamp: { $gte: since },
    });

    return ok({ count });
  } catch (err) {
    console.error("[EVENTS GET]", err);
    return fail("Internal server error", 500);
  }
}
