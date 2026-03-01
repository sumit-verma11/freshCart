"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2, ArrowLeft } from "lucide-react";
import { useWishlistStore } from "@/store/wishlist";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

export default function WishlistPage() {
  const { items, remove, clear } = useWishlistStore();
  const { items: cartItems, addItem } = useCartStore();

  function moveToCart(item: typeof items[0]) {
    const alreadyInCart = cartItems.some((c) => c.productId === item.productId);
    if (!alreadyInCart) {
      addItem({
        productId: item.productId,
        variantSku: "",
        name: item.name,
        image: item.image,
        unit: "",
        mrp: item.mrp,
        sellingPrice: item.price,
        quantity: 1,
        stock: 99,
      });
    }
    remove(item.productId);
    toast.success(`${item.name} moved to cart`);
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="w-12 h-12 text-red-300" />
        </div>
        <h1 className="text-2xl font-bold text-dark mb-2">Your wishlist is empty</h1>
        <p className="text-muted mb-8">Save items you love by tapping the heart icon on any product.</p>
        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          <h1 className="text-2xl font-bold text-dark">Wishlist</h1>
          <span className="text-sm text-muted">({items.length} items)</span>
        </div>
        <button
          onClick={() => { clear(); toast("Wishlist cleared"); }}
          className="text-sm text-danger hover:underline"
        >
          Clear all
        </button>
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.productId} className="card overflow-hidden flex flex-col">
            {/* Image */}
            <Link href={`/product/${item.slug}`} className="block">
              <div className="relative aspect-square bg-accent">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
              </div>
            </Link>

            {/* Info */}
            <div className="p-3 flex flex-col flex-1 gap-2">
              <Link href={`/product/${item.slug}`}>
                <h3 className="text-sm font-semibold text-dark line-clamp-2 hover:text-primary transition-colors">
                  {item.name}
                </h3>
              </Link>

              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-primary">{formatPrice(item.price)}</span>
                {item.mrp > item.price && (
                  <span className="text-xs text-muted line-through">{formatPrice(item.mrp)}</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-auto pt-1">
                <button
                  onClick={() => moveToCart(item)}
                  className="flex-1 flex items-center justify-center gap-1 bg-primary text-white
                             text-xs font-semibold py-1.5 rounded-lg hover:bg-primary-600
                             active:scale-95 transition-all"
                >
                  <ShoppingCart className="w-3 h-3" /> Cart
                </button>
                <button
                  onClick={() => { remove(item.productId); toast("Removed from wishlist"); }}
                  className="w-8 flex items-center justify-center border border-border rounded-lg
                             text-muted hover:text-danger hover:border-danger transition-colors"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
