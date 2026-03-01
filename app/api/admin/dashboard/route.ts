import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";
import { ok, fail, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/admin/dashboard — aggregated stats for the admin dashboard */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();

    const [
      totalProducts,
      totalOrders,
      totalUsers,
      recentOrders,
      lowStockProducts,
      orderStats,
      revenue,
    ] = await Promise.all([
      Product.countDocuments({ isAvailable: true }),
      Order.countDocuments(),
      User.countDocuments({ role: "user" }),
      Order.find()
        .sort({ placedAt: -1 })
        .limit(5)
        .populate("userId", "name email")
        .lean(),
      Product.find({ stockQty: { $lt: 10 } })
        .sort({ stockQty: 1 })
        .limit(5)
        .select("name stockQty")
        .lean(),
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $group: { _id: null, total: { $sum: "$grandTotal" } } },
      ]),
    ]);

    const statusCounts = Object.fromEntries(
      (orderStats as { _id: string; count: number }[]).map((s) => [s._id, s.count])
    );
    const totalRevenue = (revenue[0] as { total?: number } | undefined)?.total ?? 0;

    return ok({
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      statusCounts,
      recentOrders,
      lowStockProducts,
    });
  } catch (error) {
    console.error("[ADMIN DASHBOARD]", error);
    return fail("Internal server error", 500);
  }
}
