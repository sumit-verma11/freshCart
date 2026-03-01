"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";

interface Props {
  images:      string[];
  name:        string;
  isOutOfStock: boolean;
  discount:    number;
}

export default function ImageGallery({ images, name, isOutOfStock, discount }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const mainImage = images[activeIdx] || "/placeholder.png";

  return (
    <div className="space-y-4">
      {/* Main image with CSS zoom on hover */}
      <div className="relative aspect-square bg-accent rounded-3xl overflow-hidden group cursor-zoom-in">
        <Image
          src={mainImage}
          alt={`${name} — view ${activeIdx + 1}`}
          fill
          priority
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-125"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />

        {/* OOS overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white/90 rounded-2xl px-6 py-3 shadow-xl">
              <p className="font-bold text-dark text-lg tracking-tight">Out of Stock</p>
            </div>
          </div>
        )}

        {/* Discount badge */}
        {discount > 0 && !isOutOfStock && (
          <div className="absolute top-4 left-4">
            <span className="badge-sale text-sm px-3 py-1.5 shadow-sm">{discount}% OFF</span>
          </div>
        )}

        {/* Zoom hint */}
        {images.length > 0 && !isOutOfStock && (
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/50
                          text-white text-xs px-3 py-1.5 rounded-full
                          opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ZoomIn className="w-3.5 h-3.5" /> Hover to zoom
          </div>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs
                          px-2.5 py-1 rounded-full">
            {activeIdx + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail carousel */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2
                          transition-all duration-200
                          ${i === activeIdx
                            ? "border-primary scale-105 shadow-md"
                            : "border-border hover:border-primary/50 opacity-70 hover:opacity-100"
                          }`}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={img}
                alt={`${name} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
