"use client";

import Image from "next/image";
import { Minus, Plus, Trash2, AlertTriangle } from "lucide-react";
import { IClientCartItem } from "@/types";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useSwipeDelete } from "@/hooks/useSwipeDelete";
import { haptic } from "@/lib/haptics";
import toast from "react-hot-toast";

interface CartItemProps {
  item: IClientCartItem;
  isUnavailable?: boolean;
  lowStockCount?: number; // show "Only N left!" pill when > 0 and <= 5
}

export default function CartItem({ item, isUnavailable = false, lowStockCount }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const discount  = calculateDiscount(item.mrp, item.sellingPrice);
  const lineTotal = item.sellingPrice * item.quantity;

  const { dragX, swiped, handlers } = useSwipeDelete({
    onDelete: () => {
      haptic([50, 30, 50]);
      removeItem(item.productId);
      toast("Item removed from cart");
    },
  });

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Delete layer revealed on swipe */}
      <div
        className="absolute inset-y-0 right-0 w-24 bg-danger flex items-center justify-center rounded-2xl"
        style={{ opacity: Math.min(-dragX / 80, 1) }}
        aria-hidden="true"
      >
        <Trash2 className="w-6 h-6 text-white" />
      </div>

      {/* Card (slides left on swipe) */}
      <div
        {...handlers}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: swiped ? "none" : "transform 0.3s ease",
        }}
        className={`card p-4 flex gap-4 items-start
                    ${isUnavailable ? "border-red-200 bg-red-50/40" : ""}`}
      >
        {/* ── Product image ────────────────────────────────────────────────── */}
        <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-accent">
          <Image
            src={item.image || "/placeholder.png"}
            alt={item.name}
            fill
            className={`object-cover transition-opacity ${isUnavailable ? "opacity-50" : ""}`}
            sizes="80px"
          />
          {isUnavailable && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="text-white text-[10px] font-extrabold tracking-wide">OOS</span>
            </div>
          )}
        </div>

        {/* ── Details ─────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Unavailable badge */}
          {isUnavailable && (
            <div className="inline-flex items-center gap-1 text-xs text-danger font-semibold
                            bg-red-50 border border-red-200 rounded-full px-2 py-0.5 mb-1.5">
              <AlertTriangle className="w-3 h-3" /> No longer available
            </div>
          )}
          {/* Low stock badge */}
          {!isUnavailable && lowStockCount !== undefined && lowStockCount > 0 && lowStockCount <= 5 && (
            <div className="inline-flex items-center gap-1 text-xs text-amber-700 font-semibold
                            bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 mb-1.5">
              Only {lowStockCount} left!
            </div>
          )}

          <h3 className="font-semibold text-dark text-sm leading-snug line-clamp-2">{item.name}</h3>
          <p className="text-xs text-muted mt-0.5">{item.unit}</p>

          {/* Unit price */}
          <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
            <span className="font-bold text-dark text-sm">{formatPrice(item.sellingPrice)}</span>
            {item.sellingPrice < item.mrp && (
              <span className="text-xs text-muted line-through">{formatPrice(item.mrp)}</span>
            )}
            {discount > 0 && (
              <span className="text-xs text-success font-semibold">{discount}% off</span>
            )}
          </div>

          {/* Qty stepper + Remove */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center border-2 border-border rounded-xl overflow-hidden">
              <button
                onClick={() => { haptic(30); updateQuantity(item.productId, item.quantity - 1); }}
                disabled={isUnavailable}
                className="w-8 h-8 flex items-center justify-center text-primary
                           hover:bg-accent transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-dark">{item.quantity}</span>
              <button
                onClick={() => { haptic(30); updateQuantity(item.productId, item.quantity + 1); }}
                disabled={isUnavailable || item.quantity >= item.stock}
                className="w-8 h-8 flex items-center justify-center text-primary
                           hover:bg-accent transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => { haptic([50, 30, 50]); removeItem(item.productId); toast("Item removed from cart"); }}
              className="flex items-center gap-1 text-xs text-muted hover:text-danger transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
        </div>

        {/* ── Line total ───────────────────────────────────────────────────── */}
        <div className="text-right shrink-0 self-center">
          <p className="font-bold text-dark">{formatPrice(lineTotal)}</p>
          {item.quantity > 1 && (
            <p className="text-xs text-muted mt-0.5">
              {item.quantity} × {formatPrice(item.sellingPrice)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
