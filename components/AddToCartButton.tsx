"use client";

import { useState } from "react";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { IProduct } from "@/types";
import { useCartStore } from "@/store/cart";
import toast from "react-hot-toast";

export default function AddToCartButton({ product }: { product: IProduct }) {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.productId === product._id.toString());
  const quantity = cartItem?.quantity ?? 0;

  function handleAdd() {
    if (product.stock === 0) return;
    addItem({
      productId: product._id.toString(),
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      image: product.images[0] ?? "/placeholder.png",
      unit: product.unit,
      quantity: 1,
      stock: product.stock,
    });
    if (quantity === 0) toast.success("Added to cart!");
  }

  if (product.stock === 0) {
    return (
      <button disabled className="btn-primary w-full opacity-50 cursor-not-allowed">
        Out of Stock
      </button>
    );
  }

  if (quantity === 0) {
    return (
      <button onClick={handleAdd} className="btn-primary w-full flex items-center justify-center gap-2">
        <ShoppingCart className="w-5 h-5" />
        Add to Cart
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center border-2 border-primary rounded-xl overflow-hidden">
        <button
          onClick={() => updateQuantity(product._id.toString(), quantity - 1)}
          className="w-12 h-12 flex items-center justify-center text-primary hover:bg-accent transition-colors"
        >
          <Minus className="w-5 h-5" />
        </button>
        <span className="w-14 text-center font-bold text-dark text-lg">{quantity}</span>
        <button
          onClick={handleAdd}
          disabled={quantity >= product.stock}
          className="w-12 h-12 flex items-center justify-center text-primary hover:bg-accent
                     transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <button
        onClick={() => {
          useCartStore.getState().removeItem(product._id.toString());
          toast("Removed from cart");
        }}
        className="text-sm text-danger hover:underline"
      >
        Remove
      </button>
    </div>
  );
}
