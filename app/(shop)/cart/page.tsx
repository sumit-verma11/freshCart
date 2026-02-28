"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, ArrowRight, Package } from "lucide-react";
import CartItem from "@/components/CartItem";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, subtotal, deliveryCharge, total } = useCartStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const sub = subtotal();
  const delivery = deliveryCharge();
  const tot = total();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="text-8xl mb-6">🛒</div>
        <h2 className="text-2xl font-bold text-dark mb-3">Your cart is empty</h2>
        <p className="text-muted mb-8">Add fresh groceries to get started!</p>
        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          Start Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-dark mb-8 flex items-center gap-3">
        <ShoppingCart className="w-6 h-6 text-primary" />
        My Cart
        <span className="text-muted font-normal text-base">
          ({items.reduce((n, i) => n + i.quantity, 0)} items)
        </span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <CartItem key={item.productId} item={item} />
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="font-bold text-dark text-lg mb-5">Order Summary</h2>
            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span className="text-dark font-medium">{formatPrice(sub)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Delivery</span>
                <span className={delivery === 0 ? "text-success font-semibold" : "text-dark font-medium"}>
                  {delivery === 0 ? "FREE" : formatPrice(delivery)}
                </span>
              </div>
              {delivery === 0 && (
                <p className="text-xs text-success font-medium flex items-center gap-1">
                  🎉 You saved ₹40 on delivery!
                </p>
              )}
              {delivery > 0 && (
                <p className="text-xs text-muted bg-amber-50 rounded-lg px-3 py-2">
                  Add {formatPrice(499 - sub)} more for free delivery
                </p>
              )}
              <hr className="border-border" />
              <div className="flex justify-between text-dark font-bold text-base">
                <span>Total</span>
                <span className="text-primary">{formatPrice(tot)}</span>
              </div>
            </div>

            <Link href="/checkout" className="btn-primary w-full flex items-center justify-center gap-2">
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="mt-4 flex items-center gap-2 justify-center text-xs text-muted">
              <Package className="w-4 h-4" />
              Secure checkout — 100% safe payments
            </div>

            <Link href="/" className="block text-center text-primary text-sm font-semibold mt-4 hover:underline">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
