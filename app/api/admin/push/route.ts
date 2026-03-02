import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import PushSubscription from "@/models/PushSubscription";
import { sendPushNotification } from "@/lib/webpush";

/**
 * POST /api/admin/push
 *
 * Broadcasts a push notification to all subscribers, or to a specific user's
 * devices when `targetUserId` is provided.
 *
 * Body: { title, body, url?, tag?, targetUserId? }
 * Requires admin session.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  const { title, body, url, tag, targetUserId } = (await req.json()) as {
    title:         string;
    body:          string;
    url?:          string;
    tag?:          string;
    targetUserId?: string;
  };

  if (!title || !body) {
    return NextResponse.json({ success: false, error: "title and body are required" }, { status: 400 });
  }

  await connectDB();

  const query = targetUserId ? { userId: targetUserId } : {};
  const subs  = await PushSubscription.find(query).lean();

  let sent   = 0;
  let failed = 0;

  await Promise.all(
    subs.map(async (sub) => {
      const ok = await sendPushNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        { title, body, url: url ?? "/", tag }
      );
      if (ok) {
        sent++;
      } else {
        failed++;
        // Clean up expired subscription
        await PushSubscription.deleteOne({ _id: sub._id });
      }
    })
  );

  return NextResponse.json({ success: true, sent, failed });
}
