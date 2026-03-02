import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { ok, fail, requireAdmin } from "@/lib/api";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import UserEvent from "@/models/UserEvent";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// ── helpers ───────────────────────────────────────────────────────────────────

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fillDailyGaps(
  rows: { date: string; revenue: number; orders: number; label?: string }[],
  days: number,
) {
  const map = Object.fromEntries(rows.map((r) => [r.date, r]));
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push(
      map[key] ?? {
        date: key,
        label: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        revenue: 0,
        orders: 0,
      },
    );
  }
  // add short label for display
  return result.map((r) => ({
    ...r,
    label:
      r.label ??
      new Date(r.date).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      }),
  }));
}

// ── GET /api/admin/analytics?period=30 ───────────────────────────────────────

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const period = Math.min(
    90,
    Math.max(7, parseInt(req.nextUrl.searchParams.get("period") ?? "30", 10)),
  );

  try {
    await connectDB();

    const periodStart    = daysAgo(period);
    const prevStart      = daysAgo(period * 2);
    const weekStart      = daysAgo(7);
    const fourteenAgo    = daysAgo(14);

    // ── All heavy queries in parallel ────────────────────────────────────────
    const [
      // 1. Daily revenue (period days)
      dailyRows,
      // 2. Orders by day-of-week (all time)
      dowRows,
      // 3. Category revenue (joined through product.category)
      catRows,
      // 4. Top products by revenue
      topRevRows,
      // 5. Top products by units sold
      topUnitRows,
      // 6. Summary: current period
      summaryRows,
      // 7. Summary: previous period (for trend)
      prevRows,
      // 8. Low-stock products
      lowStockProds,
      // 9. Out-of-stock products
      outOfStockProds,
      // 10. Recently ordered product IDs (last 14 days)
      recentProductIds,
      // 11. Top customers by lifetime value
      topCustRows,
      // 12. Returning users this week (placed order in last 7 days)
      returningThisWeek,
      // 13. New users this week
      newUsersCount,
      // 14. Pincode performance
      pincodeRows,
      // 15. Repeat-purchase: how many users have 2+ orders
      repeatRows,
      // 16. Avg days between orders (sample of users with 2+ orders)
      avgOrderGap,
      // 17. Funnel events (last 30 days)
      funnelViews,
      funnelCarts,
      funnelPurchases,
    ] = await Promise.all([
      // 1
      Order.aggregate([
        { $match: { placedAt: { $gte: periodStart }, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$placedAt" } },
            revenue: { $sum: "$grandTotal" },
            orders:  { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 2
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        {
          $group: {
            _id:     { $dayOfWeek: "$placedAt" }, // 1=Sun..7=Sat
            orders:  { $sum: 1 },
            revenue: { $sum: "$grandTotal" },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 3 — category revenue via $lookup chain
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $unwind: "$items" },
        {
          $lookup: {
            from:         "products",
            localField:   "items.productId",
            foreignField: "_id",
            as:           "product",
          },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from:         "categories",
            localField:   "product.category",
            foreignField: "_id",
            as:           "cat",
          },
        },
        { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id:     { $ifNull: ["$cat.name", "Uncategorised"] },
            revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
            units:   { $sum: "$items.qty" },
            orders:  { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]),

      // 4
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $unwind: "$items" },
        {
          $group: {
            _id:       "$items.productId",
            name:      { $first: "$items.name" },
            revenue:   { $sum: { $multiply: ["$items.price", "$items.qty"] } },
            units:     { $sum: "$items.qty" },
            orderCount:{ $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]),

      // 5
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $unwind: "$items" },
        {
          $group: {
            _id:       "$items.productId",
            name:      { $first: "$items.name" },
            units:     { $sum: "$items.qty" },
            revenue:   { $sum: { $multiply: ["$items.price", "$items.qty"] } },
            orderCount:{ $sum: 1 },
          },
        },
        { $sort: { units: -1 } },
        { $limit: 10 },
      ]),

      // 6 — current period summary
      Order.aggregate([
        { $match: { placedAt: { $gte: periodStart }, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id:      null,
            revenue:  { $sum: "$grandTotal" },
            orders:   { $sum: 1 },
            discount: { $sum: "$totalDiscount" },
          },
        },
      ]),

      // 7 — previous period
      Order.aggregate([
        {
          $match: {
            placedAt: { $gte: prevStart, $lt: periodStart },
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

      // 8
      Product.find({ stockQty: { $gt: 0, $lt: 10 }, isAvailable: true })
        .select("name slug stockQty")
        .sort({ stockQty: 1 })
        .limit(15)
        .lean(),

      // 9
      Product.find({ stockQty: 0, isAvailable: true })
        .select("name slug")
        .limit(20)
        .lean(),

      // 10 — IDs ordered recently (for slow-moving detection)
      Order.distinct("items.productId", { placedAt: { $gte: fourteenAgo } }),

      // 11
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        {
          $group: {
            _id:        "$userId",
            totalSpend: { $sum: "$grandTotal" },
            orderCount: { $sum: 1 },
            lastOrderAt:{ $max: "$placedAt" },
          },
        },
        { $sort: { totalSpend: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from:         "users",
            localField:   "_id",
            foreignField: "_id",
            as:           "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name:       { $ifNull: ["$user.name", "Guest"] },
            email:      { $ifNull: ["$user.email", ""] },
            totalSpend: 1,
            orderCount: 1,
            lastOrderAt:1,
          },
        },
      ]),

      // 12 — users with orders in last 7 days
      Order.distinct("userId", { placedAt: { $gte: weekStart } }),

      // 13 — new users this week
      User.countDocuments({ createdAt: { $gte: weekStart }, role: "user" }),

      // 14
      Order.aggregate([
        {
          $group: {
            _id:     "$deliveryAddress.pincode",
            orders:  { $sum: 1 },
            revenue: { $sum: "$grandTotal" },
          },
        },
        { $sort: { orders: -1 } },
        { $limit: 20 },
      ]),

      // 15 — users with 2+ orders (repeat purchase)
      Order.aggregate([
        { $group: { _id: "$userId", count: { $sum: 1 } } },
        { $match: { count: { $gte: 2 } } },
        { $count: "total" },
      ]),

      // 16 — avg days between first and last order for multi-order users
      Order.aggregate([
        {
          $group: {
            _id:   "$userId",
            first: { $min: "$placedAt" },
            last:  { $max: "$placedAt" },
            count: { $sum: 1 },
          },
        },
        { $match: { count: { $gte: 2 } } },
        {
          $project: {
            gapDays: {
              $divide: [
                { $subtract: ["$last", "$first"] },
                86400000 * 1, // ms → days
              ],
            },
            count: 1,
          },
        },
        { $group: { _id: null, avg: { $avg: "$gapDays" } } },
      ]),

      // 17a — funnel: view events (last 30 days)
      UserEvent.countDocuments({ event: "view", timestamp: { $gte: daysAgo(30) } }),
      // 17b — cart events
      UserEvent.countDocuments({ event: "cart", timestamp: { $gte: daysAgo(30) } }),
      // 17c — purchase events
      UserEvent.countDocuments({ event: "purchase", timestamp: { $gte: daysAgo(30) } }),
    ]);

    // ── Slow-moving products ──────────────────────────────────────────────────
    const recentSet = new Set(recentProductIds.map(String));
    const slowMoving = await Product.find({
      _id:         { $nin: recentProductIds },
      isAvailable: true,
      stockQty:    { $gt: 0 },
    })
      .select("name slug stockQty")
      .limit(10)
      .lean();

    // ── Sales velocity for low-stock products ─────────────────────────────────
    const lowStockIds = lowStockProds.map((p) => p._id);
    const velocityRows = await Order.aggregate([
      { $match: { placedAt: { $gte: daysAgo(30) }, status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      { $match: { "items.productId": { $in: lowStockIds } } },
      {
        $group: {
          _id:  "$items.productId",
          sold: { $sum: "$items.qty" },
        },
      },
    ]);
    const velocityMap: Record<string, number> = {};
    for (const r of velocityRows) velocityMap[String(r._id)] = r.sold;

    // ── Shape responses ───────────────────────────────────────────────────────

    // Daily revenue — fill gaps
    const dailyRevenue = fillDailyGaps(
      dailyRows.map((r) => ({
        date:    r._id as string,
        revenue: r.revenue as number,
        orders:  r.orders  as number,
        label:   "",
      })),
      period,
    );

    // Orders by day of week
    const ordersByDow = Array.from({ length: 7 }, (_, i) => {
      const row = dowRows.find((r) => (r._id as number) === i + 1);
      return { day: DOW[i], orders: row?.orders ?? 0, revenue: row?.revenue ?? 0 };
    });

    // Summary
    const cur      = summaryRows[0] ?? { revenue: 0, orders: 0, discount: 0 };
    const prev     = prevRows[0]    ?? { revenue: 0, orders: 0 };
    const allTimeRevenue = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);

    const summary = {
      periodRevenue:     cur.revenue  as number,
      periodOrders:      cur.orders   as number,
      prevPeriodRevenue: prev.revenue as number,
      prevPeriodOrders:  prev.orders  as number,
      aov:               cur.orders > 0 ? Math.round(cur.revenue / cur.orders) : 0,
      totalRevenue:      (allTimeRevenue[0]?.total ?? 0) as number,
      totalOrders:       await Order.countDocuments({ status: { $ne: "cancelled" } }),
      totalDiscount:     cur.discount as number,
    };

    // Repeat rate
    const totalCustomers = await User.countDocuments({ role: "user" });
    const repeatTotal    = (repeatRows[0]?.total ?? 0) as number;
    const repeatRate     = totalCustomers > 0 ? repeatTotal / totalCustomers : 0;

    // Avg days between orders
    const avgDays = (avgOrderGap[0]?.avg ?? 0) as number;

    // Funnel
    const funnelPurchasesCount = await Order.countDocuments({
      placedAt: { $gte: daysAgo(30) },
      status:   { $ne: "cancelled" },
    });
    const funnel = [
      { name: "Viewed Product",   value: funnelViews    },
      { name: "Added to Cart",    value: funnelCarts    },
      { name: "Ordered",          value: funnelPurchasesCount },
    ];

    return ok({
      period,
      dailyRevenue,
      ordersByDow,
      categories: catRows.map((r) => ({
        name:    r._id,
        revenue: r.revenue,
        units:   r.units,
        orders:  r.orders,
      })),
      summary,
      topProductsByRevenue: topRevRows.map((r) => ({
        productId:  String(r._id),
        name:       r.name,
        revenue:    r.revenue,
        units:      r.units,
        orderCount: r.orderCount,
      })),
      topProductsByUnits: topUnitRows.map((r) => ({
        productId:  String(r._id),
        name:       r.name,
        units:      r.units,
        revenue:    r.revenue,
        orderCount: r.orderCount,
      })),
      inventory: {
        lowStock: lowStockProds.map((p) => ({
          _id:           String(p._id),
          name:          p.name,
          slug:          p.slug,
          stockQty:      p.stockQty,
          salesVelocity: velocityMap[String(p._id)] ?? 0,
        })),
        outOfStock: outOfStockProds.map((p) => ({
          _id:  String(p._id),
          name: p.name,
          slug: p.slug,
        })),
        slowMoving: slowMoving.map((p) => ({
          _id:      String(p._id),
          name:     p.name,
          slug:     p.slug,
          stockQty: p.stockQty,
        })),
      },
      customers: {
        newThisWeek:         newUsersCount,
        returningThisWeek:   returningThisWeek.length,
        repeatPurchaseRate:  Math.round(repeatRate * 100),
        avgDaysBetweenOrders:Math.round(avgDays),
        topCustomers:        topCustRows,
      },
      pincodes: pincodeRows.map((r) => ({
        pincode: r._id,
        orders:  r.orders,
        revenue: r.revenue,
      })),
      funnel,
    });
  } catch (err) {
    console.error("[ANALYTICS]", err);
    return fail("Internal server error", 500);
  }
}
