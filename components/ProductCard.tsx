"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Leaf, Star, Minus, Plus, Heart, Flame, Sparkles, RotateCcw, Zap, AlertTriangle } from "lucide-react";
import { ICategory, IProduct } from "@/types";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useUserActivity } from "@/store/userActivity";
import { trackAddToCart, trackWishlistAdd, trackWishlistRemove } from "@/lib/analytics";
import toast from "react-hot-toast";
import { haptic } from "@/lib/haptics";
import Tooltip from "@/components/Tooltip";

// Compute a simple Nutri-score (A–E) from calories per 100g
function getNutriScore(calories: number): { grade: string; color: string; bg: string } {
  if (calories < 80)  return { grade: "A", color: "text-green-700",  bg: "bg-green-100" };
  if (calories < 160) return { grade: "B", color: "text-lime-700",   bg: "bg-lime-100"  };
  if (calories < 240) return { grade: "C", color: "text-yellow-700", bg: "bg-yellow-100" };
  if (calories < 350) return { grade: "D", color: "text-orange-700", bg: "bg-orange-100" };
  return               { grade: "E", color: "text-red-700",    bg: "bg-red-100"   };
}

interface ProductCardProps {
  product: IProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCartStore();
  const { toggle, has } = useWishlistStore();
  const { hasOrdered, daysSinceOrder } = useUserActivity();

  const v = product.variants[0];
  const discount = v ? calculateDiscount(v.mrp, v.sellingPrice) : 0;
  const isOutOfStock = !product.isAvailable || product.stockQty === 0;
  const effectivePrice = v?.sellingPrice ?? 0;
  const isWishlisted = has(product._id.toString());

  const cartItem = items.find(
    (i) => i.productId === product._id.toString() && i.variantSku === v?.sku
  );
  const qty = cartItem?.quantity ?? 0;

  const pid = product._id.toString();
  const reordered = hasOrdered(pid);
  const daysAgo = daysSinceOrder(pid);

  // Flash sale
  const flashEndsAt = product.flashSale?.endsAt;
  const flashActive = !!(flashEndsAt && new Date(flashEndsAt) > new Date());
  const flashPrice = flashActive && v && product.flashSale
    ? Math.round(v.mrp * (1 - product.flashSale.discountPercent / 100))
    : effectivePrice;

  const [countdown, setCountdown] = useState<string | null>(null);
  useEffect(() => {
    if (!flashActive || !flashEndsAt) return;
    const tick = () => {
      const ms = new Date(flashEndsAt).getTime() - Date.now();
      if (ms <= 0) { setCountdown(null); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setCountdown([h, m, s].map((n) => String(n).padStart(2, "0")).join(":"));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashActive]);

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
    haptic(50);
    addItem({
      productId: product._id.toString(),
      variantSku: v.sku,
      name: product.name,
      image: product.images[0] ?? "/placeholder.png",
      unit: `${v.size}${v.unit}`,
      mrp: v.mrp,
      sellingPrice: flashPrice,
      quantity: 1,
      stock: product.stockQty,
    });
    if (qty === 0) {
      toast.success(`${product.name} added to cart`);
      trackAddToCart(pid, product.name, v.sellingPrice, 1);
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: pid, event: "cart" }),
      }).catch(() => {});
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
    <Link href={`/products/${product.slug}`} className="block group">
      <motion.div
        className={`card-hover overflow-hidden h-full flex flex-col${flashActive ? " ring-2 ring-red-500 animate-glow" : ""}`}
        whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Image */}
        <div className="relative aspect-square bg-accent overflow-hidden">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🛒</div>
          )}

          {/* Wishlist heart */}
          <motion.button
            onClick={handleWishlist}
            whileTap={{ scale: 0.8 }}
            className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center
                        justify-center shadow transition-all duration-150
                        ${isWishlisted
                          ? "bg-red-500 text-white"
                          : "bg-white/90 text-muted hover:text-red-500"}`}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-white" : ""}`} />
          </motion.button>

          {/* Badges (top-left) */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {flashActive && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5
                               rounded-full bg-red-500 text-white">
                <Zap className="w-3 h-3" /> FLASH
              </span>
            )}
            {reordered && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5
                               rounded-full bg-green-500 text-white">
                <RotateCcw className="w-3 h-3" /> Re-order
              </span>
            )}
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

          {/* Rating + info badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
                <span className="text-xs font-semibold text-dark dark:text-white">{product.rating.toFixed(1)}</span>
                <span className="text-xs text-muted">({product.reviewCount})</span>
              </div>
            )}

            {/* Allergen warning tooltip */}
            {product.allergyInfo && (
              <Tooltip
                content={<><span className="font-semibold block mb-0.5">Allergen Info</span>{product.allergyInfo}</>}
                side="top"
                maxWidth={200}
              >
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold
                             px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700
                             cursor-default"
                  aria-label={`Allergen information: ${product.allergyInfo}`}
                >
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Allergen
                </span>
              </Tooltip>
            )}

            {/* Nutri-score tooltip */}
            {product.nutritionFacts?.calories != null && (
              (() => {
                const ns = getNutriScore(product.nutritionFacts.calories as number);
                return (
                  <Tooltip
                    content={
                      <>
                        <span className="font-semibold block mb-1">Nutri-Score {ns.grade}</span>
                        <span className="block">{product.nutritionFacts!.calories} kcal / 100g</span>
                        {product.nutritionFacts!.protein != null && (
                          <span className="block text-gray-300">Protein: {product.nutritionFacts!.protein}g</span>
                        )}
                        {product.nutritionFacts!.fat != null && (
                          <span className="block text-gray-300">Fat: {product.nutritionFacts!.fat}g</span>
                        )}
                      </>
                    }
                    side="top"
                    maxWidth={180}
                  >
                    <span
                      className={`inline-flex items-center text-[10px] font-bold
                                 px-1.5 py-0.5 rounded-full cursor-default
                                 ${ns.bg} ${ns.color}`}
                      aria-label={`Nutri-score grade ${ns.grade}`}
                    >
                      {ns.grade}
                    </span>
                  </Tooltip>
                );
              })()
            )}
          </div>

          {/* Price + cart controls */}
          <div className="flex items-center justify-between mt-auto pt-1 gap-2">
            <div className="min-w-0">
              <span className="price-current text-base">{formatPrice(flashActive ? flashPrice : effectivePrice)}</span>
              {v && (flashActive ? flashPrice < v.mrp : v.sellingPrice < v.mrp) && (
                <span className="price-original text-xs ml-1.5">{formatPrice(v.mrp)}</span>
              )}
              {flashActive && countdown && (
                <p className="text-[10px] text-red-600 font-bold mt-0.5">⚡ {countdown}</p>
              )}
              {!flashActive && daysAgo !== null && (
                <p className="text-[10px] text-green-600 font-medium mt-0.5">
                  {daysAgo === 0 ? "Ordered today" : `Ordered ${daysAgo}d ago`}
                </p>
              )}
            </div>

            {/* Cart button or qty controls — AnimatePresence morph */}
            <AnimatePresence mode="wait" initial={false}>
              {qty > 0 ? (
                <motion.div
                  key="qty"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
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
                </motion.div>
              ) : (
                <motion.button
                  key="add"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                  className="bg-primary text-white w-8 h-8 rounded-xl flex items-center
                             justify-center hover:bg-primary-600 transition-all duration-150
                             disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
