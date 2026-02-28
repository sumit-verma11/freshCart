"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { ICartItem } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";

interface CartItemProps {
  item: ICartItem;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const effectivePrice = item.salePrice ?? item.price;

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-border">
      {/* Image */}
      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-accent shrink-0">
        <Image
          src={item.image || "/placeholder.png"}
          alt={item.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-dark text-sm leading-tight line-clamp-2">
          {item.name}
        </h4>
        <p className="text-xs text-muted mt-0.5">{item.unit}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-primary font-bold text-sm">{formatPrice(effectivePrice)}</span>
          {item.salePrice && item.salePrice < item.price && (
            <span className="text-muted text-xs line-through">{formatPrice(item.price)}</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-end gap-3">
        {/* Qty control */}
        <div className="flex items-center border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
            className="w-8 h-8 flex items-center justify-center text-muted
                       hover:bg-gray-50 hover:text-danger transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-8 text-center text-sm font-semibold text-dark">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
            disabled={item.quantity >= item.stock}
            className="w-8 h-8 flex items-center justify-center text-muted
                       hover:bg-gray-50 hover:text-primary transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Item total + remove */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-dark">
            {formatPrice(effectivePrice * item.quantity)}
          </span>
          <button
            onClick={() => removeItem(item.productId)}
            className="text-muted hover:text-danger transition-colors"
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
