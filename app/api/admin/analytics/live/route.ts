import { connectDB } from "@/lib/mongoose";
import { ok, fail, requireAdmin } from "@/lib/api";
import { getSSECount } from "@/lib/sse";
import Order from "@/models/Order";

export const dynamic = "force-dynamic";

// ── GET /api/admin/analytics/live ─────────────────────────────────────────────
// Light-weight endpoint polled every 30 s for the real-time widget strip.
// Returns:
//   todayOrders    – count of non-cancelled orders placed today
//   todayRevenue   – sum of grandTotal for today
//   yesterdayRevenue – sum for the same window yesterday (comparison)
//   activeSessions – current SSE connection count

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();

    const now = new Date();

    // Today: midnight → now
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Yesterday: midnight → midnight
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);

    const [todayRows, yesterdayRows] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            placedAt: { $gte: todayStart },
            status:   { $ne: "cancelled" },
          },
        },
        {
          $group: {
            _id:     null,
            revenue: { $sum: "$grandTotal" },
            orders:  { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            placedAt: { $gte: yesterdayStart, $lt: yesterdayEnd },
            status:   { $ne: "cancelled" },
          },
        },
        {
          $group: {
            _id:     null,
            revenue: { $sum: "$grandTotal" },
          },
        },
      ]),
    ]);

    return ok({
      todayOrders:       todayRows[0]?.orders  ?? 0,
      todayRevenue:      todayRows[0]?.revenue ?? 0,
      yesterdayRevenue:  yesterdayRows[0]?.revenue ?? 0,
      activeSessions:    getSSECount(),
    });
  } catch (err) {
    console.error("[ANALYTICS LIVE]", err);
    return fail("Internal server error", 500);
  }
}
