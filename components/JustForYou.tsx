"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Sparkles } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { IProduct } from "@/types";

export default function JustForYou() {
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    fetch("/api/recommendations")
      .then((r) => r.json())
      .then((d) => { if (d.success) setProducts(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="skeleton h-6 w-48 rounded mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="skeleton aspect-square" />
              <div className="p-3 space-y-2">
                <div className="skeleton h-3 w-16 rounded" />
                <div className="skeleton h-4 rounded" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  const heading = session?.user ? "Just For You" : "Popular Picks";
  const sub = session?.user
    ? "Based on your order history"
    : "Top-rated products loved by our customers";

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-secondary" />
        <h2 className="text-xl font-bold text-dark">{heading}</h2>
      </div>
      <p className="text-sm text-muted mb-6">{sub}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product._id.toString()} product={product} />
        ))}
      </div>
    </section>
  );
}
