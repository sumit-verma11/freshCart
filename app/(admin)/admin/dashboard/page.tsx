import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import {
  Package, ShoppingBag, Users, TrendingUp, DollarSign,
  AlertTriangle, CheckCircle, Clock, Truck, XCircle,
} from "lucide-react";

async function getDashboardStats() {
  await connectDB();

  const now      = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const weekStart  = new Date(now); weekStart.setDate(now.getDate() - 7);

  const [
    totalProducts, totalOrders, totalUsers,
    todayOrders, weekOrders,
    todayRevenue, weekRevenue, totalRevenue,
    recentOrders, lowStock, statusCounts,
  ] = await Promise.all([
    Product.countDocuments({ isAvailable: true }),
    Order.countDocuments(),
    User.countDocuments({ role: "user" }),

    Order.countDocuments({ placedAt: { $gte: todayStart } }),
    Order.countDocuments({ placedAt: { $gte: weekStart } }),

    Order.aggregate([
      { $match: { placedAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]),
    Order.aggregate([
      { $match: { placedAt: { $gte: weekStart } } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]),
    Order.aggregate([
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]),

    Order.find()
      .sort({ placedAt: -1 })
      .limit(8)
      .populate("userId", "name email")
      .lean(),

    Product.find({ stockQty: { $lt: 10 }, isAvailable: true })
      .sort({ stockQty: 1 })
      .limit(5)
      .lean(),

    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const sc = Object.fromEntries(
    (statusCounts as { _id: string; count: number }[]).map((s) => [s._id, s.count])
  );

  return {
    totalProducts, totalOrders, totalUsers,
    todayOrders,  weekOrders,
    todayRevenue:  (todayRevenue[0]  as { total?: number } | undefined)?.total ?? 0,
    weekRevenue:   (weekRevenue[0]   as { total?: number } | undefined)?.total ?? 0,
    totalRevenue:  (totalRevenue[0]  as { total?: number } | undefined)?.total ?? 0,
    recentOrders, lowStock,
    pending:       sc.pending       ?? 0,
    confirmed:     sc.confirmed     ?? 0,
    outForDelivery: sc.out_for_delivery ?? 0,
    delivered:     sc.delivered     ?? 0,
    cancelled:     sc.cancelled     ?? 0,
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending:          "bg-amber-100 text-amber-700",
  confirmed:        "bg-blue-100 text-blue-700",
  out_for_delivery: "bg-cyan-100 text-cyan-700",
  delivered:        "bg-green-100 text-green-700",
  cancelled:        "bg-red-100 text-red-700",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed",
  out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled",
};

export default async function DashboardPage() {
  const d = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-dark">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* ── Top stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Total Revenue",   value: formatPrice(d.totalRevenue), sub: `${formatPrice(d.weekRevenue)} this week`,  icon: DollarSign, color: "bg-green-50 text-success"   },
          { label: "Orders Today",    value: d.todayOrders,               sub: `${d.weekOrders} this week`,                icon: ShoppingBag, color: "bg-blue-50 text-blue-600"  },
          { label: "Active Products", value: d.totalProducts,             sub: `${d.lowStock.length} low stock`,           icon: Package,    color: "bg-purple-50 text-purple-600" },
          { label: "Customers",       value: d.totalUsers,                sub: "registered users",                         icon: Users,      color: "bg-amber-50 text-amber-600"  },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm font-medium text-muted">{label}</p>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-dark">{value}</p>
            <p className="text-xs text-muted mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Order status strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Pending",          count: d.pending,        icon: Clock,       cls: "text-amber-600 bg-amber-50" },
          { label: "Confirmed",        count: d.confirmed,      icon: TrendingUp,  cls: "text-blue-600 bg-blue-50"   },
          { label: "Out for Delivery", count: d.outForDelivery, icon: Truck,       cls: "text-cyan-600 bg-cyan-50"   },
          { label: "Delivered",        count: d.delivered,      icon: CheckCircle, cls: "text-success bg-green-50"   },
          { label: "Cancelled",        count: d.cancelled,      icon: XCircle,     cls: "text-danger bg-red-50"      },
        ].map(({ label, count, icon: Icon, cls }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xl font-bold text-dark">{count}</p>
              <p className="text-xs text-muted leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom two-column ──────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Recent orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-dark">Recent Orders</h2>
            <Link href="/admin/orders" className="text-primary text-sm font-semibold hover:underline">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {d.recentOrders.map((order) => {
              const user = order.userId as unknown as { name: string; email: string } | null;
              return (
                <div key={order._id.toString()} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-dark font-mono">#{order.orderNumber as string}</p>
                    <p className="text-xs text-muted">{user?.name ?? "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{formatPrice(order.grandTotal as number)}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                                      ${STATUS_COLORS[order.status as string] ?? "bg-gray-100 text-muted"}`}>
                      {STATUS_LABELS[order.status as string] ?? order.status as string}
                    </span>
                  </div>
                </div>
              );
            })}
            {d.recentOrders.length === 0 && (
              <p className="text-muted text-sm py-6 text-center">No orders yet</p>
            )}
          </div>
        </div>

        {/* Low stock alert */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-dark">Low Stock Alert</h2>
          </div>
          {d.lowStock.length === 0 ? (
            <p className="text-muted text-sm py-6 text-center">All products are well-stocked! ✓</p>
          ) : (
            <div className="divide-y divide-border">
              {d.lowStock.map((p) => (
                <div key={p._id.toString()} className="flex items-center justify-between py-3">
                  <p className="text-sm font-semibold text-dark line-clamp-1 flex-1 pr-4">{p.name as string}</p>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0
                                    ${p.stockQty === 0
                                      ? "bg-red-100 text-danger"
                                      : "bg-amber-100 text-amber-700"}`}>
                    {p.stockQty === 0 ? "Out of Stock" : `${p.stockQty as number} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/admin/products"
            className="block text-center text-primary text-sm font-semibold hover:underline mt-4"
          >
            Manage Products →
          </Link>
        </div>
      </div>
    </div>
  );
}
