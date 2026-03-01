"use client";

import Image from "next/image";
import { Minus, Plus, Trash2, AlertTriangle } from "lucide-react";
import { IClientCartItem } from "@/types";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { useCartStore } from "@/store/cart";

interface CartItemProps {
  item: IClientCartItem;
  isUnavailable?: boolean;
}

export default function CartItem({ item, isUnavailable = false }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const discount  = calculateDiscount(item.mrp, item.sellingPrice);
  const lineTotal = item.sellingPrice * item.quantity;

  return (
    <div
      className={`card p-4 flex gap-4 items-start transition-all
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
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
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
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
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
            onClick={() => removeItem(item.productId)}
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
  );
}
