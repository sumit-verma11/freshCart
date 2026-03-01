"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, ArrowRight, Package, AlertTriangle, Tag } from "lucide-react";
import CartItem from "@/components/CartItem";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, subtotal, deliveryCharge, total } = useCartStore();
  const [hydrated,       setHydrated]       = useState(false);
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set());
  const [checking,       setChecking]       = useState(false);

  // Wait for Zustand hydration
  useEffect(() => { setHydrated(true); }, []);

  // Check live availability for every cart item
  useEffect(() => {
    if (!hydrated || items.length === 0) return;

    setChecking(true);
    Promise.allSettled(
      items.map((item) =>
        fetch(`/api/products/${item.productId}`)
          .then((r) => r.json())
          .then((d) => ({
            id:        item.productId,
            available: d.success && d.data.isAvailable && d.data.stockQty > 0,
          }))
          .catch(() => ({ id: item.productId, available: true })) // optimistic on error
      )
    ).then((results) => {
      const ids = new Set<string>();
      results.forEach((r) => {
        if (r.status === "fulfilled" && !r.value.available) ids.add(r.value.id);
      });
      setUnavailableIds(ids);
      setChecking(false);
    });
  }, [hydrated, items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (!hydrated) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // ── Empty cart ───────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <div className="text-8xl mb-6">🛒</div>
        <h2 className="text-2xl font-bold text-dark mb-3">Your cart is empty</h2>
        <p className="text-muted mb-8">Add fresh groceries to get started!</p>
        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          Start Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const sub         = subtotal();
  const delivery    = deliveryCharge();
  const tot         = total();
  const mrpTotal    = items.reduce((sum, i) => sum + i.mrp * i.quantity, 0);
  const discount    = Math.max(0, mrpTotal - sub);
  const totalQty    = items.reduce((n, i) => n + i.quantity, 0);
  const hasUnavail  = unavailableIds.size > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* ── Page heading ──────────────────────────────────────────────────────── */}
      <h1 className="text-2xl font-bold text-dark flex items-center gap-3">
        <ShoppingCart className="w-6 h-6 text-primary" />
        My Cart
        <span className="text-muted font-normal text-base">({totalQty} item{totalQty !== 1 ? "s" : ""})</span>
      </h1>

      {/* ── Unavailable banner ─────────────────────────────────────────────────── */}
      {hasUnavail && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-danger text-sm">
              {unavailableIds.size} item{unavailableIds.size > 1 ? "s are" : " is"} no longer available
            </p>
            <p className="text-xs text-muted mt-0.5">
              Remove unavailable items before proceeding to checkout.
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8 items-start">

        {/* ── Cart items list ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <CartItem
              key={`${item.productId}-${item.variantSku}`}
              item={item}
              isUnavailable={unavailableIds.has(item.productId)}
            />
          ))}

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold
                       hover:underline mt-2"
          >
            ← Continue Shopping
          </Link>
        </div>

        {/* ── Order Summary ────────────────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24 space-y-5">
            <h2 className="font-bold text-dark text-lg">Order Summary</h2>

            {/* Line items */}
            <div className="space-y-3 text-sm">

              {/* MRP total */}
              <div className="flex justify-between text-muted">
                <span>MRP Total</span>
                <span className="text-dark font-medium">{formatPrice(mrpTotal)}</span>
              </div>

              {/* Discount */}
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Discount
                  </span>
                  <span className="font-semibold">− {formatPrice(discount)}</span>
                </div>
              )}

              {/* Delivery */}
              <div className="flex justify-between text-muted">
                <span>Delivery</span>
                <span
                  className={
                    delivery === 0 ? "text-success font-semibold" : "text-dark font-medium"
                  }
                >
                  {delivery === 0 ? "FREE" : formatPrice(delivery)}
                </span>
              </div>

              {/* Free-delivery helper text */}
              {delivery === 0 && (
                <p className="text-xs text-success font-medium">🎉 You saved ₹40 on delivery!</p>
              )}
              {delivery > 0 && (
                <p className="text-xs text-muted bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  Add <span className="font-semibold">{formatPrice(499 - sub)}</span> more for free delivery
                </p>
              )}

              <hr className="border-border" />

              {/* Grand total */}
              <div className="flex justify-between text-dark font-bold text-base">
                <span>Grand Total</span>
                <span className="text-primary">{formatPrice(tot)}</span>
              </div>

              {/* Savings callout */}
              {discount > 0 && (
                <p className="text-xs text-center text-success font-semibold
                               bg-green-50 border border-green-100 rounded-xl py-2">
                  🎉 You save {formatPrice(discount)} on this order!
                </p>
              )}
            </div>

            {/* CTA */}
            {hasUnavail || checking ? (
              <button
                disabled
                className="w-full btn-primary opacity-50 cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                {checking ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                    rounded-full animate-spin" />
                    Checking availability…
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" /> Remove unavailable items
                  </>
                )}
              </button>
            ) : (
              <Link
                href="/checkout"
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <div className="flex items-center gap-2 justify-center text-xs text-muted">
              <Package className="w-4 h-4" />
              Secure checkout — 100% safe payments
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
