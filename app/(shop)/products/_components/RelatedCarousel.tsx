"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { IProduct } from "@/types";

interface Props {
  products: IProduct[];
  title?:   string;
  viewAllHref?: string;
}

export default function RelatedCarousel({
  products,
  title = "You might also like",
  viewAllHref,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({
      left:     dir === "left" ? -280 : 280,
      behavior: "smooth",
    });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-dark">{title}</h2>
        <div className="flex items-center gap-3">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-sm font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-9 h-9 rounded-xl border border-border flex items-center justify-center
                         text-muted hover:border-primary hover:text-primary transition-all"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-9 h-9 rounded-xl border border-border flex items-center justify-center
                         text-muted hover:border-primary hover:text-primary transition-all"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
      >
        {products.map((product) => (
          <div
            key={product._id.toString()}
            className="w-44 sm:w-52 shrink-0"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
