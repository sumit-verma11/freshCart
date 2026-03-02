"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Package, CheckCircle, Clock, Truck, XCircle, ShoppingBag,
  ChevronDown, ChevronUp, MapPin, Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { OrderStatus } from "@/types";
import { useOrderTrack } from "@/hooks/useOrderTrack";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  productId: string | { _id: string; images: string[] };
  variantSku: string;
  name: string;
  qty: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  deliveryAddress: { street: string; city: string; state: string; pincode: string };
  billingType: "COD";
  status: OrderStatus;
  totalMRP: number;
  totalDiscount: number;
  deliveryCharge: number;
  grandTotal: number;
  estimatedDelivery: { minHours: number; maxHours: number };
  placedAt: string;
  deliveryPartner?: { name?: string; phone?: string; lat?: number; lng?: number };
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:          "bg-amber-100 text-amber-700",
  confirmed:        "bg-blue-100 text-blue-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
  delivered:        "bg-green-100 text-success",
  cancelled:        "bg-red-100 text-danger",
};

const STATUS_ICONS: Record<OrderStatus, React.FC<{ className?: string }>> = {
  pending:          Clock,
  confirmed:        CheckCircle,
  out_for_delivery: Truck,
  delivered:        CheckCircle,
  cancelled:        XCircle,
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:          "Pending",
  confirmed:        "Confirmed",
  out_for_delivery: "Out for Delivery",
  delivered:        "Delivered",
  cancelled:        "Cancelled",
};

const TIMELINE = [
  { label: "Order Placed",     icon: ShoppingBag },
  { label: "Confirmed",        icon: CheckCircle },
  { label: "Out for Delivery", icon: Truck },
  { label: "Delivered",        icon: CheckCircle },
];

const STATUS_STEP: Record<OrderStatus, number> = {
  pending:          0,
  confirmed:        1,
  out_for_delivery: 2,
  delivered:        3,
  cancelled:        -1,
};

// ─── Timeline ──────────────────────────────────────────────────────────────────

function DeliveryTimeline({ status }: { status: OrderStatus }) {
  const activeStep  = STATUS_STEP[status];
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
        <XCircle className="w-5 h-5 text-danger shrink-0" />
        <p className="text-sm font-semibold text-danger">This order was cancelled</p>
      </div>
    );
  }

  return (
    <div className="relative pt-1">
      {/* Background line */}
      <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" />
      {/* Progress line — smooth fill animation */}
      <div
        className="absolute top-5 left-5 h-0.5 bg-primary transition-all duration-700"
        style={{ width: `calc(${(activeStep / (TIMELINE.length - 1)) * 100}% - 2.5rem + ${activeStep === TIMELINE.length - 1 ? "1.25rem" : "0px"})` }}
      />
      <div className="relative flex justify-between">
        {TIMELINE.map((step, i) => {
          const completed = i < activeStep;
          const current   = i === activeStep;
          const done      = i <= activeStep;
          const isOFD     = i === 2; // "Out for Delivery" step index
          const Icon      = step.icon;
          return (
            <div key={i} className="flex flex-col items-center gap-2" style={{ flex: "1" }}>
              <div className="relative w-8 h-8 shrink-0">
                {/* Pulsing halo ring on the active step */}
                {current && (
                  <div className="absolute -inset-1.5 rounded-full bg-primary/25 animate-pulse" />
                )}
                <div className={`relative w-8 h-8 rounded-full flex items-center justify-center z-10 border-2
                                 transition-all duration-300
                                 ${done
                                   ? "bg-primary border-primary text-white"
                                   : "bg-white border-border text-muted"}`}>
                  {current && isOFD ? (
                    <span className="text-sm animate-bounce">🛵</span>
                  ) : completed ? (
                    /* Checkmark for fully-completed steps */
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3}
                         viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
              <span className={`text-[10px] text-center leading-tight px-1
                                ${done ? "text-primary" : "text-muted"}
                                ${current ? "font-bold" : "font-semibold"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Expanded Order Detail ──────────────────────────────────────────────────────

function OrderDetail({ orderId }: { orderId: string }) {
  const [order,   setOrder]   = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  // Live status via SSE — overrides the fetched status when received
  const liveStatus = useOrderTrack(orderId, true);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setOrder(d.data); })
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }
  if (!order) {
    return <p className="text-muted text-sm text-center py-4">Could not load order details.</p>;
  }

  const displayStatus = liveStatus ?? order.status;
  const showETA = displayStatus !== "delivered" && displayStatus !== "cancelled";

  return (
    <div className="space-y-5">
      {/* Timeline */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
          Delivery Progress
        </p>
        <DeliveryTimeline status={displayStatus} />
        {showETA && (
          <p className="text-xs text-muted text-center mt-3">
            Estimated: <strong className="text-dark">
              {order.estimatedDelivery.minHours}–{order.estimatedDelivery.maxHours} hours
            </strong>
          </p>
        )}
      </div>

      {/* Delivery partner stub — shown when out for delivery */}
      {displayStatus === "out_for_delivery" && (
        <div className="card p-4 mt-1 space-y-3">
          <p className="font-semibold text-dark text-sm">Delivery Partner</p>
          {order.deliveryPartner?.name ? (
            <p className="text-sm text-muted">
              {order.deliveryPartner.name}
              {order.deliveryPartner.phone && ` · ${order.deliveryPartner.phone}`}
            </p>
          ) : (
            <p className="text-sm text-muted">Assigning partner…</p>
          )}
          <div className="bg-gray-100 rounded-xl h-44 flex flex-col items-center justify-center gap-2">
            <span className="text-3xl">🗺️</span>
            <span className="text-sm text-muted">Live map tracking</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              Coming Soon
            </span>
          </div>
        </div>
      )}

      {/* Full items list */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Items Ordered</p>
        <div className="space-y-3">
          {order.items.map((item, i) => {
            const product = typeof item.productId === "object" ? item.productId : null;
            const imgSrc  = product?.images?.[0] ?? "";
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-accent shrink-0 border border-border">
                  {imgSrc ? (
                    <Image src={imgSrc} alt={item.name} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🛒</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark line-clamp-1">{item.name}</p>
                  <p className="text-xs text-muted mt-0.5 font-mono">{item.variantSku} · Qty {item.qty}</p>
                </div>
                <p className="text-sm font-bold text-dark shrink-0">
                  {formatPrice(item.price * item.qty)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery address */}
      <div className="bg-white rounded-xl p-4 border border-border">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2
                      flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> Delivery Address
        </p>
        <p className="text-sm text-dark">{order.deliveryAddress.street}</p>
        <p className="text-sm text-muted">
          {order.deliveryAddress.city}, {order.deliveryAddress.state} — {order.deliveryAddress.pincode}
        </p>
      </div>

      {/* Price breakdown */}
      <div className="bg-white rounded-xl p-4 border border-border space-y-2.5">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
          Price Breakdown
        </p>
        <div className="flex justify-between text-sm text-muted">
          <span>MRP Total</span><span>{formatPrice(order.totalMRP)}</span>
        </div>
        {order.totalDiscount > 0 && (
          <div className="flex justify-between text-sm text-success font-medium">
            <span>Discount</span><span>− {formatPrice(order.totalDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-muted">
          <span>Delivery</span>
          <span>{order.deliveryCharge > 0 ? formatPrice(order.deliveryCharge) : "Free"}</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-dark border-t border-border pt-2">
          <span>Grand Total</span>
          <span className="text-primary text-base">{formatPrice(order.grandTotal)}</span>
        </div>
        <p className="text-xs text-muted text-center pt-0.5">
          Payment: {order.billingType} (Cash on Delivery)
        </p>
      </div>
    </div>
  );
}

// ─── Main orders list ───────────────────────────────────────────────────────────

function OrdersContent() {
  const { data: session, status } = useSession();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const successNum   = searchParams.get("order");

  const [orders,     setOrders]     = useState<Order[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expanded,   setExpanded]   = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchOrders = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/orders?page=${page}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        setTotalPages(data.pagination?.totalPages ?? 1);
      }
    } finally {
      setLoading(false);
    }
  }, [session, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-dark mb-1">My Orders</h1>
      <p className="text-muted text-sm mb-6">Track and review your past orders</p>

      {/* Success banner */}
      {successNum && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6
                        flex items-center gap-3">
          <CheckCircle className="w-7 h-7 text-success shrink-0" />
          <div>
            <p className="font-bold text-dark">Order Placed!</p>
            <p className="text-sm text-muted">Order #{successNum} is confirmed.</p>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mx-auto mb-5">
            <Package className="w-10 h-10 text-primary" />
          </div>
          <p className="text-lg font-bold text-dark mb-2">No orders yet</p>
          <p className="text-muted mb-6 text-sm">Your order history will show up here.</p>
          <Link href="/" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const Icon       = STATUS_ICONS[order.status];
            const isExpanded = expanded === order._id;
            const first2     = order.items.slice(0, 2);
            const extra      = order.items.length - 2;
            const showETA    = order.status !== "delivered" && order.status !== "cancelled";

            return (
              <div key={order._id} className="card overflow-hidden">
                {/* Card body */}
                <div className="p-5">
                  {/* Order # + status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-bold text-dark font-mono text-sm">#{order.orderNumber}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {new Date(order.placedAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold
                                      px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLES[order.status]}`}>
                      <Icon className="w-3 h-3" />
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  {/* Item summary */}
                  <div className="space-y-1 mb-3">
                    {first2.map((item, i) => (
                      <p key={i} className="text-sm text-muted line-clamp-1">
                        {item.name}
                        <span className="text-xs opacity-75 ml-1">× {item.qty}</span>
                      </p>
                    ))}
                    {extra > 0 && (
                      <p className="text-xs text-muted italic">
                        and {extra} more item{extra > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>

                  {/* ETA */}
                  {showETA && (
                    <p className="text-xs text-muted flex items-center gap-1.5 mb-3">
                      <Truck className="w-3 h-3 text-primary" />
                      Est. {order.estimatedDelivery.minHours}–{order.estimatedDelivery.maxHours} hrs delivery
                    </p>
                  )}

                  {/* Total + toggle */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <p className="text-xs text-muted">Total</p>
                      <p className="font-bold text-primary">{formatPrice(order.grandTotal)}</p>
                    </div>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : order._id)}
                      className="flex items-center gap-1.5 text-sm font-semibold
                                 text-primary hover:opacity-75 transition-opacity"
                    >
                      {isExpanded
                        ? <><ChevronUp className="w-4 h-4" /> Hide Details</>
                        : <><ChevronDown className="w-4 h-4" /> View Details</>}
                    </button>
                  </div>
                </div>

                {/* Expandable detail panel */}
                {isExpanded && (
                  <div className="border-t border-border bg-gray-50/70 px-5 pb-5 pt-4">
                    <OrderDetail orderId={order._id} />
                  </div>
                )}
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
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
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}
