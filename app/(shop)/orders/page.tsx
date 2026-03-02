"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  CheckCircle, Clock, Truck, XCircle, ShoppingBag,
  ChevronDown, ChevronUp, MapPin, Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { OrderStatus } from "@/types";
import { useOrderTrack } from "@/hooks/useOrderTrack";
import PushPermissionPrompt from "@/components/PushPermissionPrompt";

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
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl h-44 flex flex-col items-center justify-center gap-2">
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
      <div className="bg-surface rounded-xl p-4 border border-border">
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

  // Confetti on new order success
  useEffect(() => {
    if (!successNum) return;
    const fire = () => {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.5, x: 0.3 }, colors: ["#1A6B3A", "#F5A623", "#22c55e", "#fff"] });
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.5, x: 0.7 }, colors: ["#1A6B3A", "#F5A623", "#22c55e", "#fff"] });
    };
    const t = setTimeout(fire, 200);
    return () => clearTimeout(t);
  }, [successNum]);

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

      {/* Push notification permission — shown once after first order */}
      {successNum && <PushPermissionPrompt />}

      {orders.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center">
          {/* Animated delivery scooter SVG */}
          <motion.div
            animate={{ x: [0, 8, -4, 8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
            className="mb-6"
          >
            <svg viewBox="0 0 160 100" fill="none" className="w-44 h-28" aria-hidden="true">
              {/* Road shadow */}
              <ellipse cx="80" cy="96" rx="55" ry="5" fill="#E8F5E9" />
              {/* Scooter body */}
              <path d="M50 65 Q50 40 70 38 L110 38 Q120 38 125 48 L130 65 Z" fill="#1A6B3A" />
              {/* Seat */}
              <rect x="72" y="30" width="36" height="10" rx="5" fill="#0E4520" />
              {/* Handlebar post */}
              <rect x="112" y="32" width="5" height="18" rx="2" fill="#0E4520" />
              {/* Handlebar */}
              <path d="M109 34 Q115 30 122 34" stroke="#0E4520" strokeWidth="3" strokeLinecap="round" fill="none" />
              {/* Basket/front fairing */}
              <path d="M118 48 L135 55 L130 65 L118 65 Z" fill="#166330" />
              {/* Front windshield glare */}
              <path d="M122 50 L130 55" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
              {/* Delivery box */}
              <rect x="54" y="38" width="30" height="26" rx="4" fill="#F5A623" />
              <rect x="64" y="38" width="10" height="4" rx="2" fill="#CC7A07" />
              {/* Box logo leaf */}
              <path d="M62 53 Q66 46 73 49 Q67 54 62 53z" fill="#1A6B3A" opacity="0.9" />
              {/* Rear wheel */}
              <circle cx="58" cy="72" r="14" fill="white" stroke="#1A6B3A" strokeWidth="3" />
              <circle cx="58" cy="72" r="8" fill="#E8F5E9" stroke="#1A6B3A" strokeWidth="2" />
              <circle cx="58" cy="72" r="3" fill="#1A6B3A" />
              {/* Front wheel */}
              <circle cx="122" cy="72" r="14" fill="white" stroke="#1A6B3A" strokeWidth="3" />
              <circle cx="122" cy="72" r="8" fill="#E8F5E9" stroke="#1A6B3A" strokeWidth="2" />
              <circle cx="122" cy="72" r="3" fill="#1A6B3A" />
              {/* Exhaust puffs */}
              <motion.circle
                cx="40" cy="65"
                r="4"
                fill="#D1FAE5"
                opacity="0.7"
                animate={{ cx: [40, 25, 10], opacity: [0.7, 0.4, 0], r: [4, 7, 10] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              />
            </svg>
          </motion.div>
          <p className="text-lg font-bold text-dark dark:text-white mb-2">No orders yet</p>
          <p className="text-muted dark:text-gray-400 mb-6 text-sm max-w-xs">
            Your order history will show up here once you place your first order.
          </p>
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
