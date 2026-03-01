"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart, Minus, Plus, MapPin,
  Loader2, CheckCircle2, XCircle, Truck,
} from "lucide-react";
import { useCartStore } from "@/store/cart";
import { usePincodeStore } from "@/store/pincode";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import toast from "react-hot-toast";

// ─── Types (serialised from server, all IDs are plain strings) ────────────────

export interface SerializedVariant {
  _id?: string;
  size: string;
  unit: string;
  mrp: number;
  sellingPrice: number;
  sku: string;
}

export interface SerializedProduct {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  variants: SerializedVariant[];
  stockQty: number;
  isAvailable: boolean;
}

interface PincodeResult {
  serviceable: boolean;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  estimatedDelivery?: { min: number; max: number };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductActions({ product }: { product: SerializedProduct }) {
  const { items, addItem, updateQuantity } = useCartStore();
  const { info: globalPincode } = usePincodeStore();

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [qty, setQty] = useState(1);

  // Delivery check
  const [pincodeInput, setPincodeInput]   = useState(globalPincode?.pincode ?? "");
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeResult, setPincodeResult]  = useState<PincodeResult | null>(
    globalPincode
      ? {
          serviceable: globalPincode.isServiceable,
          area:        globalPincode.area,
          city:        globalPincode.city,
          estimatedDelivery: globalPincode.estimatedDelivery,
          pincode:     globalPincode.pincode,
        }
      : null
  );

  // Sync if global pincode changes elsewhere
  useEffect(() => {
    if (globalPincode && !pincodeResult) {
      setPincodeInput(globalPincode.pincode);
      setPincodeResult({
        serviceable:       globalPincode.isServiceable,
        area:              globalPincode.area,
        city:              globalPincode.city,
        estimatedDelivery: globalPincode.estimatedDelivery,
        pincode:           globalPincode.pincode,
      });
    }
  }, [globalPincode, pincodeResult]);

  const variant      = product.variants[selectedIdx];
  const isOutOfStock = !product.isAvailable || product.stockQty === 0;
  const discount     = variant ? calculateDiscount(variant.mrp, variant.sellingPrice) : 0;
  const savings      = variant ? variant.mrp - variant.sellingPrice : 0;
  const maxQty       = Math.min(10, product.stockQty);

  // Cart state for this product+variant
  const cartItem = items.find(
    (i) => i.productId === product._id && i.variantSku === variant?.sku
  );
  const cartQty  = cartItem?.quantity ?? 0;
  const isInCart = cartQty > 0;

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function checkDelivery() {
    if (!/^\d{6}$/.test(pincodeInput)) return;
    setPincodeLoading(true);
    setPincodeResult(null);
    try {
      const res  = await fetch(`/api/pincode/check?pincode=${pincodeInput}`);
      const data = await res.json();
      if (data.success) setPincodeResult(data.data);
    } catch {
      // silent
    } finally {
      setPincodeLoading(false);
    }
  }

  function handleAddToCart() {
    if (isOutOfStock || !variant) return;
    addItem({
      productId:    product._id,
      variantSku:   variant.sku,
      name:         product.name,
      image:        product.images[0] ?? "/placeholder.png",
      unit:         `${variant.size}${variant.unit}`,
      mrp:          variant.mrp,
      sellingPrice: variant.sellingPrice,
      quantity:     1,
      stock:        product.stockQty,
    });
    // Set the exact qty the user chose
    if (qty > 1) updateQuantity(product._id, qty);
    toast.success(`${product.name} added to cart!`);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Variant pills ──────────────────────────────────────────────────── */}
      {product.variants.length > 1 && (
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
            Select Pack Size
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v, i) => (
              <button
                key={v.sku}
                onClick={() => { setSelectedIdx(i); setQty(1); }}
                className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold
                            transition-all duration-150
                            ${i === selectedIdx
                              ? "border-primary bg-primary text-white shadow-sm"
                              : "border-border text-dark hover:border-primary hover:text-primary"
                            }`}
              >
                {v.size}{v.unit}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Price display ──────────────────────────────────────────────────── */}
      {variant && (
        <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
          <div className="flex items-baseline gap-4 flex-wrap">
            <span className="text-4xl font-extrabold text-primary">
              {formatPrice(variant.sellingPrice)}
            </span>
            {variant.sellingPrice < variant.mrp && (
              <span className="text-xl text-muted line-through">
                {formatPrice(variant.mrp)}
              </span>
            )}
          </div>

          {savings > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-secondary/15 text-secondary
                               font-bold text-sm px-3 py-1.5 rounded-full">
                🎉 You save {formatPrice(savings)}
              </span>
              {discount > 0 && (
                <span className="text-success font-semibold text-sm">{discount}% off MRP</span>
              )}
            </div>
          )}

          <p className="text-xs text-muted">Inclusive of all taxes</p>
        </div>
      )}

      {/* ── Availability ────────────────────────────────────────────────────── */}
      <div>
        {isOutOfStock ? (
          <div className="inline-flex items-center gap-2 bg-red-50 text-danger
                          font-semibold text-sm px-4 py-2.5 rounded-xl border border-red-100">
            <XCircle className="w-4 h-4" /> Out of Stock
          </div>
        ) : product.stockQty <= 10 ? (
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700
                          font-semibold text-sm px-4 py-2.5 rounded-xl border border-amber-100">
            ⚠️ Only {product.stockQty} left in stock — order soon
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 bg-green-50 text-success
                          font-semibold text-sm px-4 py-2.5 rounded-xl border border-green-100">
            <CheckCircle2 className="w-4 h-4" /> In Stock
          </div>
        )}
      </div>

      {/* ── Qty selector + Add to Cart ─────────────────────────────────────── */}
      {isOutOfStock ? (
        <div className="relative group">
          <button
            disabled
            className="w-full btn-primary opacity-40 cursor-not-allowed flex items-center
                       justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" /> Out of Stock
          </button>
          {/* Tooltip */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-dark text-white
                          text-xs px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none
                          opacity-0 group-hover:opacity-100 transition-opacity">
            This product is currently unavailable
          </div>
        </div>
      ) : isInCart ? (
        /* ── Already in cart: show qty controls + Go to Cart ────────────── */
        <div className="flex items-center gap-3">
          <div className="flex items-center border-2 border-primary rounded-xl overflow-hidden">
            <button
              onClick={() => updateQuantity(product._id, cartQty - 1)}
              className="w-12 h-12 flex items-center justify-center text-primary
                         hover:bg-accent transition-colors"
              aria-label="Decrease"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center font-bold text-dark text-lg">{cartQty}</span>
            <button
              onClick={() => {
                if (cartQty < product.stockQty) updateQuantity(product._id, cartQty + 1);
              }}
              disabled={cartQty >= product.stockQty}
              className="w-12 h-12 flex items-center justify-center text-primary
                         hover:bg-accent transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Increase"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/cart"
            className="flex-1 btn-secondary flex items-center justify-center gap-2 text-center"
          >
            <ShoppingCart className="w-5 h-5" /> Go to Cart
          </Link>
        </div>
      ) : (
        /* ── Not in cart: qty selector + Add to Cart ──────────────────── */
        <div className="flex items-center gap-3">
          <div className="flex items-center border-2 border-border rounded-xl overflow-hidden shrink-0">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="w-12 h-12 flex items-center justify-center text-muted
                         hover:bg-gray-50 hover:text-dark transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center font-bold text-dark text-lg">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              disabled={qty >= maxQty}
              className="w-12 h-12 flex items-center justify-center text-muted
                         hover:bg-gray-50 hover:text-dark transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" /> Add to Cart
          </button>
        </div>
      )}

      {/* ── Delivery check ─────────────────────────────────────────────────── */}
      <div className="border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-primary" />
          <p className="text-sm font-bold text-dark">Check Delivery</p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pincodeInput}
              onChange={(e) => {
                setPincodeInput(e.target.value.replace(/\D/g, "").slice(0, 6));
                setPincodeResult(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && pincodeInput.length === 6 && checkDelivery()}
              placeholder="Enter 6-digit pincode"
              className="input pl-10 py-2.5 text-sm font-mono tracking-wider"
            />
          </div>
          <button
            onClick={checkDelivery}
            disabled={pincodeInput.length !== 6 || pincodeLoading}
            className="btn-outline py-2.5 px-5 text-sm shrink-0 disabled:opacity-50"
          >
            {pincodeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}
          </button>
        </div>

        {pincodeResult && (
          <div
            className={`flex items-start gap-3 p-4 rounded-xl text-sm
                        ${pincodeResult.serviceable
                          ? "bg-green-50 border border-green-100"
                          : "bg-red-50 border border-red-100"
                        }`}
          >
            {pincodeResult.serviceable ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-success">
                    Delivery available in {pincodeResult.area}, {pincodeResult.city}
                  </p>
                  {pincodeResult.estimatedDelivery && (
                    <p className="text-xs text-success/80 mt-1">
                      ⚡ Estimated delivery: {pincodeResult.estimatedDelivery.min}–
                      {pincodeResult.estimatedDelivery.max} hours
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-danger mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-danger">Not serviceable in your area</p>
                  <p className="text-xs text-muted mt-1">
                    We&apos;re working on expanding delivery to more areas.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Trust badges ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 pt-1">
        {[
          { emoji: "🚚", label: "Free delivery", sub: "on orders ₹499+" },
          { emoji: "🔄", label: "Easy returns",  sub: "within 7 days" },
          { emoji: "✅", label: "100% authentic", sub: "quality guaranteed" },
        ].map(({ emoji, label, sub }) => (
          <div key={label} className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-2xl mb-1">{emoji}</p>
            <p className="text-xs font-semibold text-dark leading-tight">{label}</p>
            <p className="text-xs text-muted mt-0.5 leading-tight">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
