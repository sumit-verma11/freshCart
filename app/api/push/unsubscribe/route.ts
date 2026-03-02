import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import PushSubscription from "@/models/PushSubscription";

/**
 * DELETE /api/push/unsubscribe
 *
 * Removes a push subscription for the authenticated user.
 * Body: { endpoint: string }
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false }, { status: 401 });

  const { endpoint } = (await req.json()) as { endpoint: string };
  if (!endpoint) {
    return NextResponse.json({ success: false, error: "Missing endpoint" }, { status: 400 });
  }

  await connectDB();

  await PushSubscription.deleteOne({ userId: session.user.id, endpoint });

  return NextResponse.json({ success: true });
}
