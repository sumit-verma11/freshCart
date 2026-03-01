"use client";

import { ShoppingCart, Minus, Plus } from "lucide-react";
import { IProduct } from "@/types";
import { useCartStore } from "@/store/cart";
import toast from "react-hot-toast";

export default function AddToCartButton({ product }: { product: IProduct }) {
  const { items, addItem, updateQuantity } = useCartStore();
  const v = product.variants[0];
  const cartItem = items.find(
    (i) => i.productId === product._id.toString() && i.variantSku === v?.sku
  );
  const quantity = cartItem?.quantity ?? 0;
  const isOutOfStock = !product.isAvailable || product.stockQty === 0;

  function handleAdd() {
    if (isOutOfStock || !v) return;
    addItem({
      productId: product._id.toString(),
      variantSku: v.sku,
      name: product.name,
      image: product.images[0] ?? "/placeholder.png",
      unit: `${v.size}${v.unit}`,
      mrp: v.mrp,
      sellingPrice: v.sellingPrice,
      quantity: 1,
      stock: product.stockQty,
    });
    if (quantity === 0) toast.success("Added to cart!");
  }

  if (isOutOfStock) {
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
          disabled={quantity >= product.stockQty}
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
