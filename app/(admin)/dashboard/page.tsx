import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";
import {
  Package, ShoppingBag, Users, TrendingUp,
  DollarSign, AlertTriangle, CheckCircle, Clock
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

async function getDashboardStats() {
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
    Product.countDocuments(),
    Order.countDocuments(),
    User.countDocuments({ role: "user" }),
    Order.find().sort({ placedAt: -1 }).limit(5).populate("userId", "name email").lean(),
    Product.find({ stockQty: { $lt: 10 } }).sort({ stockQty: 1 }).limit(5).lean(),
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

  return { totalProducts, totalOrders, totalUsers, recentOrders, lowStockProducts, statusCounts, totalRevenue };
}

export default async function DashboardPage() {
  const { totalProducts, totalOrders, totalUsers, recentOrders, lowStockProducts, statusCounts, totalRevenue } =
    await getDashboardStats();

  const statCards = [
    { label: "Total Revenue", value: formatPrice(totalRevenue), icon: DollarSign, color: "bg-green-50 text-success" },
    { label: "Total Orders", value: totalOrders, icon: ShoppingBag, color: "bg-blue-50 text-blue-600" },
    { label: "Products", value: totalProducts, icon: Package, color: "bg-purple-50 text-purple-600" },
    { label: "Users", value: totalUsers, icon: Users, color: "bg-amber-50 text-amber-600" },
  ];

  const orderStatusCards = [
    { label: "Pending", count: statusCounts.pending || 0, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Confirmed", count: statusCounts.confirmed || 0, icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
    { label: "Delivered", count: statusCounts.delivered || 0, icon: CheckCircle, color: "text-success bg-green-50" },
    { label: "Cancelled", count: statusCounts.cancelled || 0, icon: AlertTriangle, color: "text-danger bg-red-50" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-dark mb-2">Dashboard</h1>
      <p className="text-muted text-sm mb-8">Welcome back! Here&apos;s what&apos;s happening.</p>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-muted text-sm font-medium">{label}</p>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-dark">{value}</p>
          </div>
        ))}
      </div>

      {/* Order status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {orderStatusCards.map(({ label, count, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-dark">{count}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-dark">Recent Orders</h2>
            <a href="/manage-orders" className="text-primary text-sm font-semibold hover:underline">
              View All
            </a>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const user = order.userId as unknown as { name: string; email: string };
              return (
                <div key={order._id.toString()}
                     className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-dark">#{order.orderNumber as string}</p>
                    <p className="text-xs text-muted">{user?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{formatPrice(order.grandTotal as number)}</p>
                    <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full
                                      ${order.status === "delivered" ? "bg-green-100 text-success" :
                                        order.status === "cancelled" ? "bg-red-100 text-danger" :
                                        "bg-amber-100 text-amber-700"}`}>
                      {order.status as string}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low stock alert */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-dark">Low Stock Alert</h2>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-muted text-sm">All products are well-stocked!</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product._id.toString()}
                     className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-dark line-clamp-1">{product.name}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full
                                    ${product.stockQty === 0 ? "bg-red-100 text-danger" : "bg-amber-100 text-amber-700"}`}>
                    {product.stockQty === 0 ? "Out of Stock" : `${product.stockQty} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
