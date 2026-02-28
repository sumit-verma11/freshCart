"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Leaf, Star } from "lucide-react";
import { IProduct } from "@/types";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import toast from "react-hot-toast";

interface ProductCardProps {
  product: IProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const discount = calculateDiscount(product.price, product.salePrice);
  const isOutOfStock = product.stock === 0;
  const effectivePrice = product.salePrice ?? product.price;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (isOutOfStock) return;
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
    toast.success(`${product.name} added to cart`);
  }

  return (
    <Link href={`/product/${product.slug}`} className="block group">
      <div className="card-hover overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-square bg-accent overflow-hidden">
          <Image
            src={product.images[0] ?? "/placeholder.png"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isOrganic && (
              <span className="badge-organic flex items-center gap-1">
                <Leaf className="w-3 h-3" /> Organic
              </span>
            )}
            {discount > 0 && (
              <span className="badge-sale">{discount}% OFF</span>
            )}
            {isOutOfStock && (
              <span className="badge-oos">Out of Stock</span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col flex-1 gap-2">
          <div>
            <p className="text-xs text-muted mb-0.5 font-medium">{product.category}</p>
            <h3 className="font-semibold text-dark text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-xs text-muted mt-0.5">{product.unit}</p>
          </div>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
              <span className="text-xs font-semibold text-dark">{product.rating.toFixed(1)}</span>
              <span className="text-xs text-muted">({product.reviewCount})</span>
            </div>
          )}

          {/* Price + Add */}
          <div className="flex items-center justify-between mt-auto pt-1">
            <div>
              <span className="price-current">{formatPrice(effectivePrice)}</span>
              {product.salePrice && product.salePrice < product.price && (
                <span className="price-original ml-2">{formatPrice(product.price)}</span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="bg-primary text-white w-8 h-8 rounded-xl flex items-center justify-center
                         hover:bg-primary-600 active:scale-95 transition-all duration-150
                         disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Add to cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
