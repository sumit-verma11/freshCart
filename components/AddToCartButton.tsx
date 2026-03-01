"use client";

import { useState } from "react";
import { ShoppingCart, Minus, Plus, Heart, Bell, CheckCircle } from "lucide-react";
import { IProduct } from "@/types";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { trackAddToCart, trackWishlistAdd, trackWishlistRemove } from "@/lib/analytics";
import toast from "react-hot-toast";

export default function AddToCartButton({ product }: { product: IProduct }) {
  const { items, addItem, updateQuantity } = useCartStore();
  const { toggle, has } = useWishlistStore();
  const [notifyEmail, setNotifyEmail]   = useState("");
  const [notifySent, setNotifySent]     = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);

  const v = product.variants[0];
  const cartItem = items.find(
    (i) => i.productId === product._id.toString() && i.variantSku === v?.sku
  );
  const quantity      = cartItem?.quantity ?? 0;
  const isOutOfStock  = !product.isAvailable || product.stockQty === 0;
  const isWishlisted  = has(product._id.toString());

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
    if (quantity === 0) {
      toast.success("Added to cart!");
      trackAddToCart(product._id.toString(), product.name, v.sellingPrice, 1);
    }
  }

  function handleWishlist() {
    toggle({
      productId: product._id.toString(),
      name: product.name,
      image: product.images[0] ?? "/placeholder.png",
      slug: product.slug,
      price: v?.sellingPrice ?? 0,
      mrp: v?.mrp ?? 0,
    });
    if (isWishlisted) {
      toast("Removed from wishlist");
      trackWishlistRemove(product._id.toString(), product.name);
    } else {
      toast.success("Added to wishlist ♥");
      trackWishlistAdd(product._id.toString(), product.name);
    }
  }

  async function handleNotify() {
    if (!notifyEmail.trim()) return;
    setNotifyLoading(true);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: notifyEmail, productId: product._id.toString() }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifySent(true);
        toast.success("We'll notify you when it's back!");
      } else {
        toast.error(data.error ?? "Something went wrong");
      }
    } catch {
      toast.error("Failed to register. Please try again.");
    } finally {
      setNotifyLoading(false);
    }
  }

  // ── Out of stock — show Notify Me form ──────────────────────────────────────
  if (isOutOfStock) {
    return (
      <div className="space-y-3">
        <button disabled className="btn-primary w-full opacity-40 cursor-not-allowed">
          Out of Stock
        </button>

        {/* Wishlist button even when OOS */}
        <button
          onClick={handleWishlist}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2
                      font-semibold text-sm transition-all duration-150 active:scale-95
                      ${isWishlisted
                        ? "border-red-400 text-red-500 bg-red-50"
                        : "border-border text-muted hover:border-red-400 hover:text-red-500"}`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500" : ""}`} />
          {isWishlisted ? "Saved to Wishlist" : "Save to Wishlist"}
        </button>

        {/* Notify Me */}
        {notifySent ? (
          <div className="flex items-center gap-2 text-success text-sm font-medium p-3
                          bg-green-50 rounded-xl border border-green-200">
            <CheckCircle className="w-4 h-4 shrink-0" />
            You&apos;re on the list! We&apos;ll email you when it&apos;s back.
          </div>
        ) : (
          <div className="border border-border rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-dark flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Notify me when available
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleNotify(); }}
                placeholder="your@email.com"
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleNotify}
                disabled={notifyLoading || !notifyEmail.trim()}
                className="bg-primary text-white text-sm font-semibold px-4 rounded-lg
                           hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
              >
                {notifyLoading ? "…" : "Notify"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── In stock — show add-to-cart + wishlist ──────────────────────────────────
  return (
    <div className="space-y-3">
      {quantity === 0 ? (
        <button
          onClick={handleAdd}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-5 h-5" />
          Add to Cart
        </button>
      ) : (
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
      )}

      {/* Wishlist */}
      <button
        onClick={handleWishlist}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2
                    font-semibold text-sm transition-all duration-150 active:scale-95
                    ${isWishlisted
                      ? "border-red-400 text-red-500 bg-red-50"
                      : "border-border text-muted hover:border-red-400 hover:text-red-500"}`}
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500" : ""}`} />
        {isWishlisted ? "Saved to Wishlist" : "Save to Wishlist"}
      </button>
    </div>
  );
}
