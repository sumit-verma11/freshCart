"use client";

import { useEffect, useState } from "react";
import { IOrder, OrderStatus } from "@/types";
import { formatPrice } from "@/lib/utils";
import {
  Package, CheckCircle, Clock, Truck, XCircle, RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending", "confirmed", "processing", "shipped", "delivered", "cancelled",
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5" />,
  confirmed: <CheckCircle className="w-3.5 h-3.5" />,
  processing: <Package className="w-3.5 h-3.5" />,
  shipped: <Truck className="w-3.5 h-3.5" />,
  delivered: <CheckCircle className="w-3.5 h-3.5" />,
  cancelled: <XCircle className="w-3.5 h-3.5" />,
};

export default function ManageOrdersPage() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [updating, setUpdating] = useState<string | null>(null);

  async function fetchOrders() {
    setLoading(true);
    const url = filter === "all" ? "/api/admin/orders" : `/api/admin/orders?status=${filter}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) setOrders(data.data);
    setLoading(false);
  }

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function updateStatus(orderId: string, orderStatus: OrderStatus) {
    setUpdating(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, orderStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id.toString() === orderId ? { ...o, orderStatus } : o))
        );
        toast.success("Order status updated");
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark">Manage Orders</h1>
          <p className="text-muted text-sm mt-1">{orders.length} orders</p>
        </div>
        <button onClick={fetchOrders} className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {(["all", ...STATUS_OPTIONS] as (OrderStatus | "all")[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all
                        ${filter === s
                          ? "bg-primary text-white"
                          : "bg-white border border-border text-muted hover:border-primary hover:text-primary"
                        }`}
          >
            {s === "all" ? "All Orders" : s}
          </button>
        ))}
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24">
          <Package className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="text-dark font-semibold">No orders found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  {["Order #", "Customer", "Items", "Total", "Payment", "Status", "Date", "Action"].map(
                    (h) => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wide">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => {
                  const user = order.userId as unknown as { name: string; email: string };
                  return (
                    <tr key={order._id.toString()} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-mono font-semibold text-dark text-xs">
                        #{order.orderNumber}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-dark">{user?.name}</p>
                        <p className="text-xs text-muted">{user?.email}</p>
                      </td>
                      <td className="px-5 py-4 text-muted">{order.items.length} item(s)</td>
                      <td className="px-5 py-4 font-bold text-primary">{formatPrice(order.total)}</td>
                      <td className="px-5 py-4 capitalize text-muted">{order.paymentMethod}</td>
                      <td className="px-5 py-4">
                        <span className={`flex items-center gap-1.5 w-fit text-xs font-semibold
                                         px-2.5 py-1 rounded-full capitalize
                                         ${STATUS_COLORS[order.orderStatus]}`}>
                          {STATUS_ICONS[order.orderStatus]}
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={order.orderStatus}
                          disabled={updating === order._id.toString()}
                          onChange={(e) =>
                            updateStatus(order._id.toString(), e.target.value as OrderStatus)
                          }
                          className="text-xs border border-border rounded-lg px-2 py-1.5
                                     focus:outline-none focus:ring-2 focus:ring-primary/30
                                     bg-white cursor-pointer"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s} className="capitalize">
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
