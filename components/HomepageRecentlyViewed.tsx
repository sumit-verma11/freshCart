"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { IProduct } from "@/types";

const STORAGE_KEY = "freshcart-recently-viewed";

export default function HomepageRecentlyViewed() {
  const [products, setProducts] = useState<IProduct[]>([]);

  useEffect(() => {
    let cancelled = false;
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (ids.length < 2) return; // not worth showing

      Promise.all(
        ids.slice(0, 4).map((id) =>
          fetch(`/api/products/${id}`)
            .then((r) => r.json())
            .then((d) => (d.success ? d.data : null))
            .catch(() => null)
        )
      ).then((results) => {
        if (!cancelled) {
          setProducts(results.filter(Boolean) as IProduct[]);
        }
      });
    } catch {
      // localStorage blocked
    }
    return () => { cancelled = true; };
  }, []);

  if (products.length < 2) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-5 h-5 text-muted" />
        <h2 className="text-xl font-bold text-dark">Pick Up Where You Left Off</h2>
      </div>
      <p className="text-sm text-muted mb-6">Products you viewed recently</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product._id.toString()} product={product} />
        ))}
      </div>
    </section>
  );
}
