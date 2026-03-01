"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Leaf, Star, Minus, Plus, Heart, Flame, Sparkles } from "lucide-react";
import { ICategory, IProduct } from "@/types";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { trackAddToCart, trackWishlistAdd, trackWishlistRemove } from "@/lib/analytics";
import toast from "react-hot-toast";

interface ProductCardProps {
  product: IProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCartStore();
  const { toggle, has } = useWishlistStore();

  const v = product.variants[0];
  const discount = v ? calculateDiscount(v.mrp, v.sellingPrice) : 0;
  const isOutOfStock = !product.isAvailable || product.stockQty === 0;
  const effectivePrice = v?.sellingPrice ?? 0;
  const isWishlisted = has(product._id.toString());

  const cartItem = items.find(
    (i) => i.productId === product._id.toString() && i.variantSku === v?.sku
  );
  const qty = cartItem?.quantity ?? 0;

  const categoryName =
    product.category !== null &&
    typeof product.category === "object" &&
    "name" in product.category
      ? (product.category as ICategory).name
      : "";

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
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
    if (qty === 0) {
      toast.success(`${product.name} added to cart`);
      trackAddToCart(product._id.toString(), product.name, v.sellingPrice, 1);
    }
  }

  function handleDecrement(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product._id.toString(), qty - 1);
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle({
      productId: product._id.toString(),
      name: product.name,
      image: product.images[0] ?? "/placeholder.png",
      slug: product.slug,
      price: effectivePrice,
      mrp: v?.mrp ?? effectivePrice,
    });
    if (isWishlisted) {
      toast("Removed from wishlist");
      trackWishlistRemove(product._id.toString(), product.name);
    } else {
      toast.success("Added to wishlist");
      trackWishlistAdd(product._id.toString(), product.name);
    }
  }

  return (
    <Link href={`/product/${product.slug}`} className="block group">
      <div className="card-hover overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-square bg-accent overflow-hidden">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🛒</div>
          )}

          {/* Wishlist heart */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center
                        justify-center shadow transition-all duration-150 active:scale-90
                        ${isWishlisted
                          ? "bg-red-500 text-white"
                          : "bg-white/90 text-muted hover:text-red-500"}`}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-white" : ""}`} />
          </button>

          {/* Badges (top-left) */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isOrganic && (
              <span className="badge-organic flex items-center gap-1">
                <Leaf className="w-3 h-3" /> Organic
              </span>
            )}
            {product.isNewArrival && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5
                               rounded-full bg-blue-500 text-white">
                <Sparkles className="w-3 h-3" /> New
              </span>
            )}
            {product.isBestseller && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5
                               rounded-full bg-orange-500 text-white">
                <Flame className="w-3 h-3" /> Hot
              </span>
            )}
            {(product.isSale || discount > 0) && (
              <span className="badge-sale">{discount > 0 ? `${discount}% OFF` : "SALE"}</span>
            )}
          </div>

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="badge-oos text-sm font-bold px-3 py-1.5">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col flex-1 gap-2">
          <div>
            {categoryName && (
              <p className="text-xs text-muted mb-0.5 font-medium">{categoryName}</p>
            )}
            <h3 className="font-semibold text-dark text-sm leading-tight line-clamp-2
                           group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            {v && <p className="text-xs text-muted mt-0.5">{v.size}{v.unit}</p>}
          </div>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
              <span className="text-xs font-semibold text-dark">{product.rating.toFixed(1)}</span>
              <span className="text-xs text-muted">({product.reviewCount})</span>
            </div>
          )}

          {/* Price + cart controls */}
          <div className="flex items-center justify-between mt-auto pt-1 gap-2">
            <div className="min-w-0">
              <span className="price-current text-base">{formatPrice(effectivePrice)}</span>
              {v && v.sellingPrice < v.mrp && (
                <span className="price-original text-xs ml-1.5">{formatPrice(v.mrp)}</span>
              )}
            </div>

            {/* Cart button or qty controls */}
            {qty > 0 ? (
              <div
                className="flex items-center border-2 border-primary rounded-xl overflow-hidden shrink-0"
                onClick={(e) => e.preventDefault()}
              >
                <button
                  onClick={handleDecrement}
                  className="w-7 h-7 flex items-center justify-center text-primary
                             hover:bg-accent active:bg-accent/80 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center text-sm font-bold text-dark leading-none">
                  {qty}
                </span>
                <button
                  onClick={handleAdd}
                  disabled={qty >= product.stockQty}
                  className="w-7 h-7 flex items-center justify-center text-primary
                             hover:bg-accent active:bg-accent/80 transition-colors
                             disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                disabled={isOutOfStock}
                className="bg-primary text-white w-8 h-8 rounded-xl flex items-center
                           justify-center hover:bg-primary-600 active:scale-95
                           transition-all duration-150 disabled:opacity-40
                           disabled:cursor-not-allowed shrink-0"
                aria-label="Add to cart"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
