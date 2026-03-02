import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import PushSubscription from "@/models/PushSubscription";

/**
 * POST /api/push/subscribe
 *
 * Saves (or updates) a browser push subscription for the authenticated user.
 * Body: { endpoint: string; keys: { p256dh: string; auth: string } }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false }, { status: 401 });

  const { endpoint, keys } = (await req.json()) as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ success: false, error: "Invalid subscription" }, { status: 400 });
  }

  await connectDB();

  // Upsert: one endpoint can belong to only one user; update auth on re-subscribe
  await PushSubscription.findOneAndUpdate(
    { endpoint },
    { userId: session.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    { upsert: true, new: true }
  );

  return NextResponse.json({ success: true });
}
