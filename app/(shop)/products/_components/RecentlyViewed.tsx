"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { IProduct } from "@/types";

const STORAGE_KEY = "freshcart-recently-viewed";
const MAX_STORED  = 10;
const MAX_SHOWN   = 4;

/** Call on product page mount to push this product to the front of the list. */
export function recordView(productId: string) {
  try {
    const raw:  string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    const next: string[] = [productId, ...raw.filter((id) => id !== productId)].slice(0, MAX_STORED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage may be blocked (SSR, private mode)
  }
}

interface Props {
  currentProductId: string;
}

export default function RecentlyViewed({ currentProductId }: Props) {
  const [products, setProducts] = useState<IProduct[]>([]);

  useEffect(() => {
    // 1. Record this page view
    recordView(currentProductId);

    // 2. Fetch the other recently-viewed products
    let cancelled = false;
    try {
      const stored: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      const toFetch = stored
        .filter((id) => id !== currentProductId)
        .slice(0, MAX_SHOWN);

      if (toFetch.length === 0) return;

      Promise.all(
        toFetch.map((id) =>
          fetch(`/api/products/${id}`)
            .then((r) => r.json())
            .then((d) => (d.success ? d.data : null))
            .catch(() => null)
        )
      ).then((results) => {
        if (!cancelled) {
          setProducts((results.filter(Boolean) as IProduct[]).slice(0, MAX_SHOWN));
        }
      });
    } catch {
      // ignore
    }

    return () => { cancelled = true; };
  }, [currentProductId]);

  if (products.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-bold text-dark mb-6">Recently Viewed</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product._id.toString()} product={product} />
        ))}
      </div>
    </section>
  );
}
