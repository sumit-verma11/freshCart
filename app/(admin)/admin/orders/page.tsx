"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Loader2, RefreshCw, ShoppingBag, X, MapPin,
  Clock, CheckCircle, Truck, XCircle, TrendingUp,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

// ─── Types ─────────────────────────────────────────────────────────────────────

type OrderStatus = "pending" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled";

interface OrderItem {
  productId: string;
  variantSku: string;
  name: string;
  qty: number;
  price: number;
}

interface DeliveryAddress { street: string; city: string; state: string; pincode: string; }

interface Order {
  _id: string;
  orderNumber: string;
  userId: { _id: string; name: string; email: string; phone?: string } | null;
  items: OrderItem[];
  deliveryAddress: DeliveryAddress;
  billingType: "COD";
  status: OrderStatus;
  totalMRP: number;
  totalDiscount: number;
  deliveryCharge: number;
  grandTotal: number;
  estimatedDelivery: { minHours: number; maxHours: number };
  placedAt: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: "",                label: "All Orders" },
  { value: "pending",         label: "Pending" },
  { value: "confirmed",       label: "Confirmed" },
  { value: "out_for_delivery",label: "Out for Delivery" },
  { value: "delivered",       label: "Delivered" },
  { value: "cancelled",       label: "Cancelled" },
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:          "bg-amber-100 text-amber-700",
  confirmed:        "bg-blue-100 text-blue-700",
  out_for_delivery: "bg-cyan-100 text-cyan-700",
  delivered:        "bg-green-100 text-success",
  cancelled:        "bg-red-100 text-danger",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:          "Pending",
  confirmed:        "Confirmed",
  out_for_delivery: "Out for Delivery",
  delivered:        "Delivered",
  cancelled:        "Cancelled",
};

const STATUS_ICONS: Record<OrderStatus, React.FC<{ className?: string }>> = {
  pending:          Clock,
  confirmed:        TrendingUp,
  out_for_delivery: Truck,
  delivered:        CheckCircle,
  cancelled:        XCircle,
};

const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending:          ["confirmed", "cancelled"],
  confirmed:        ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered:        [],
  cancelled:        [],
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders,      setOrders]      = useState<Order[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [statusFilter,setStatusFilter]= useState("");
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);

  // Detail modal
  const [selected,    setSelected]    = useState<Order | null>(null);
  const [updating,    setUpdating]    = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter) params.set("status", statusFilter);
    try {
      const res  = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        setTotalPages(data.pagination?.totalPages ?? 1);
      }
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Local search filter (client-side on loaded page)
  const visible = search.trim()
    ? orders.filter((o) =>
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.userId?.name.toLowerCase().includes(search.toLowerCase()) ||
        o.userId?.email.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  async function updateStatus(id: string, status: OrderStatus) {
    setUpdating(true);
    try {
      const res  = await fetch("/api/admin/orders", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Update failed");
      } else {
        toast.success(`Order marked as ${STATUS_LABELS[status]}`);
        setOrders((prev) => prev.map((o) => o._id === id ? { ...o, status } : o));
        setSelected((prev) => prev ? { ...prev, status } : null);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dark">Orders</h1>
          <p className="text-muted text-sm mt-0.5">View and manage customer orders</p>
        </div>
        <button onClick={() => fetchOrders()}
          className="btn-ghost flex items-center gap-1.5 text-sm py-2.5">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input className="input pl-10 py-2.5" placeholder="Search by order # or customer…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button key={value}
              onClick={() => { setStatusFilter(value); setPage(1); }}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors
                          ${statusFilter === value
                            ? "bg-primary text-white"
                            : "bg-white dark:bg-gray-800 border border-border text-muted hover:text-dark dark:hover:bg-gray-700"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="font-semibold text-dark">No orders found</p>
          <p className="text-muted text-sm mt-1">Try changing your filters</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-border">
                <tr>
                  {["Order #", "Customer", "Items", "Total", "Status", "Date", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold
                                           text-muted uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((order) => {
                  const StatusIcon = STATUS_ICONS[order.status];
                  return (
                    <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-dark text-sm">
                        #{order.orderNumber}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-dark text-sm">{order.userId?.name ?? "—"}</p>
                        <p className="text-xs text-muted">{order.userId?.email ?? ""}</p>
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </td>
                      <td className="px-5 py-4 font-bold text-dark">
                        {formatPrice(order.grandTotal)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold
                                          px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                          <StatusIcon className="w-3 h-3" />
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted text-xs whitespace-nowrap">
                        {new Date(order.placedAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => setSelected(order)}
                          className="text-xs font-semibold text-primary hover:underline">
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-gray-50 dark:bg-gray-800/50">
              <p className="text-sm text-muted">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-outline py-1.5 px-4 text-sm disabled:opacity-40">Prev</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="btn-outline py-1.5 px-4 text-sm disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Order Detail Modal ──────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="font-bold text-dark text-lg">Order #{selected.orderNumber}</h2>
                <p className="text-sm text-muted mt-0.5">
                  {new Date(selected.placedAt).toLocaleString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <button onClick={() => setSelected(null)}
                className="text-muted hover:text-dark transition-colors p-2 rounded-xl hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Status</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 text-sm font-semibold
                                    px-3 py-1.5 rounded-full ${STATUS_COLORS[selected.status]}`}>
                    {STATUS_LABELS[selected.status]}
                  </span>
                  {NEXT_STATUSES[selected.status].map((next) => (
                    <button key={next}
                      disabled={updating}
                      onClick={() => updateStatus(selected._id, next)}
                      className="btn-outline text-sm py-1.5 px-4 flex items-center gap-1.5 disabled:opacity-50">
                      {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      → {STATUS_LABELS[next]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Customer</p>
                  <p className="font-semibold text-dark">{selected.userId?.name ?? "—"}</p>
                  <p className="text-sm text-muted">{selected.userId?.email}</p>
                  {selected.userId?.phone && (
                    <p className="text-sm text-muted">{selected.userId.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Delivery Address
                  </p>
                  <p className="text-sm text-dark">{selected.deliveryAddress.street}</p>
                  <p className="text-sm text-muted">
                    {selected.deliveryAddress.city}, {selected.deliveryAddress.state} — {selected.deliveryAddress.pincode}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Items</p>
                <div className="space-y-2">
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-dark">{item.name}</p>
                        <p className="text-xs text-muted font-mono">{item.variantSku} × {item.qty}</p>
                      </div>
                      <p className="text-sm font-bold text-dark">{formatPrice(item.price * item.qty)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financials */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-muted">
                  <span>Total MRP</span><span>{formatPrice(selected.totalMRP)}</span>
                </div>
                {selected.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount</span><span>-{formatPrice(selected.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-muted">
                  <span>Delivery</span>
                  <span>{selected.deliveryCharge > 0 ? formatPrice(selected.deliveryCharge) : "Free"}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-dark pt-2 border-t border-border">
                  <span>Grand Total</span><span className="text-primary">{formatPrice(selected.grandTotal)}</span>
                </div>
                <p className="text-xs text-muted text-center pt-1">
                  Payment: {selected.billingType} · Delivery: {selected.estimatedDelivery.minHours}–{selected.estimatedDelivery.maxHours}h
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
