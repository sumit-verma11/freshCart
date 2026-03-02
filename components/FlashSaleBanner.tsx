"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, X } from "lucide-react";
import { IProduct } from "@/types";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function FlashSaleBanner() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [tick, setTick]           = useState(0);

  useEffect(() => {
    fetch("/api/flash-sale")
      .then((r) => r.json())
      .then((d) => { if (d.success) setProducts(d.data); })
      .catch(() => {});
  }, []);

  // Tick every second for countdown
  useEffect(() => {
    if (products.length === 0) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [products.length]);

  // Remove expired products from the list
  const active = products.filter(
    (p) => p.flashSale?.endsAt && new Date(p.flashSale.endsAt) > new Date()
  );

  if (active.length === 0 || dismissed) return null;

  const featured = active[0];
  const remaining = new Date(featured.flashSale!.endsAt).getTime() - Date.now();

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 font-bold text-sm">
            <Zap className="w-4 h-4 fill-white" /> Flash Sale!
          </span>
          <Link
            href={`/products/${featured.slug}`}
            className="font-semibold text-sm hover:underline"
          >
            {featured.name}
          </Link>
          <span className="text-sm font-bold bg-white/20 px-2 py-0.5 rounded-full">
            {featured.flashSale!.discountPercent}% OFF
          </span>
          <span className="text-sm flex items-center gap-1.5">
            Ends in{" "}
            <span className="font-mono font-bold bg-black/20 px-2 py-0.5 rounded-lg text-xs tracking-widest">
              {formatCountdown(remaining)}
            </span>
          </span>
          {active.length > 1 && (
            <span className="text-xs opacity-80">+{active.length - 1} more deals</span>
          )}
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-white/70 hover:text-white transition-colors shrink-0"
          aria-label="Dismiss flash sale banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suppress unused tick warning */}
      <span className="hidden">{tick}</span>
    </div>
  );
}
