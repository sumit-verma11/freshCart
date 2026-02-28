"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Package, CheckCircle, Clock, Truck } from "lucide-react";
import { IOrder, OrderStatus } from "@/types";
import { formatPrice } from "@/lib/utils";

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  confirmed: <CheckCircle className="w-4 h-4" />,
  processing: <Package className="w-4 h-4" />,
  shipped: <Truck className="w-4 h-4" />,
  delivered: <CheckCircle className="w-4 h-4" />,
  cancelled: <Package className="w-4 h-4" />,
};

function OrdersContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const successOrderNum = searchParams.get("order");

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/orders")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setOrders(d.data);
        })
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-dark mb-2">My Orders</h1>
      <p className="text-muted text-sm mb-8">Track and manage your orders</p>

      {/* Success banner */}
      {successOrderNum && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-8 flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-success shrink-0" />
          <div>
            <p className="font-bold text-dark">Order Placed Successfully! 🎉</p>
            <p className="text-sm text-muted">
              Order #{successOrderNum} has been confirmed. We&apos;ll deliver it soon.
            </p>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-6xl mb-4">📦</p>
          <p className="text-lg font-semibold text-dark mb-2">No orders yet</p>
          <p className="text-muted mb-8">Start shopping to see your orders here.</p>
          <Link href="/" className="btn-primary">Shop Now</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id.toString()} className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-dark">#{order.orderNumber}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
                <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5
                                  rounded-full capitalize ${STATUS_STYLES[order.orderStatus]}`}>
                  {STATUS_ICONS[order.orderStatus]}
                  {order.orderStatus}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-1.5 mb-4">
                {order.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-muted">
                    <span>{item.name} × {item.quantity}</span>
                    <span className="text-dark font-medium">
                      {formatPrice((item.salePrice ?? item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-xs text-muted">+{order.items.length - 3} more items</p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <p className="text-xs text-muted">Total</p>
                  <p className="font-bold text-primary text-lg">{formatPrice(order.total)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">Payment</p>
                  <p className="text-sm font-medium text-dark capitalize">{order.paymentMethod}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-96 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}
