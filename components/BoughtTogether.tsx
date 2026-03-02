"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBasket } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { IProduct } from "@/types";

interface Props {
  productId: string;
}

export default function BoughtTogether({ productId }: Props) {
  const [products, setProducts] = useState<IProduct[]>([]);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    fetch(`/api/bought-together?productId=${productId}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setProducts(d.data); })
      .catch(() => {});
  }, [productId]);

  if (products.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBasket className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-dark">Pairs Well With…</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {products.map((product) => {
          const v0 = product.variants?.[0];
          if (!v0) return null;
          const discount = v0.mrp > v0.sellingPrice
            ? Math.round(((v0.mrp - v0.sellingPrice) / v0.mrp) * 100)
            : 0;

          return (
            <div key={product._id.toString()}
              className="card shrink-0 w-44 overflow-hidden hover:shadow-card-hover transition-shadow">
              <Link href={`/products/${product.slug}`}>
                <div className="relative aspect-square bg-accent">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-contain"
                      sizes="176px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🛒</div>
                  )}
                  {discount > 0 && (
                    <span className="absolute top-2 left-2 bg-danger text-white text-[10px]
                                     font-bold px-1.5 py-0.5 rounded-full">
                      -{discount}%
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-muted truncate">{product.name}</p>
                  <p className="text-xs text-muted">{v0.size}{v0.unit}</p>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="font-bold text-dark text-sm">{formatPrice(v0.sellingPrice)}</span>
                    {discount > 0 && (
                      <span className="text-xs text-muted line-through">{formatPrice(v0.mrp)}</span>
                    )}
                  </div>
                </div>
              </Link>
              <div className="px-3 pb-3">
                <button
                  onClick={() => addItem({
                    productId:    product._id.toString(),
                    variantSku:   v0.sku,
                    name:         product.name,
                    image:        product.images?.[0] ?? "",
                    unit:         `${v0.size}${v0.unit}`,
                    mrp:          v0.mrp,
                    sellingPrice: v0.sellingPrice,
                    quantity:     1,
                    stock:        product.stockQty,
                  })}
                  className="w-full btn-primary py-1.5 text-xs"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
