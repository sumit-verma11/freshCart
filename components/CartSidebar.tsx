"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import { useCartSidebarStore } from "@/store/cartSidebar";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";

export default function CartSidebar() {
  const { open, close } = useCartSidebarStore();
  const { items, updateQuantity, removeItem, subtotal } = useCartStore();
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // Focus trap and keyboard close
  useEffect(() => {
    if (!open) return;
    firstFocusRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]"
            onClick={close}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-96 max-w-[92vw] z-[90]
                       flex flex-col
                       bg-white/85 dark:bg-gray-900/85
                       backdrop-blur-xl border-l border-white/30 dark:border-white/10
                       shadow-glass"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4
                            border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-gray-900 dark:text-white text-base">
                  Cart
                  {items.length > 0 && (
                    <span className="ml-2 text-xs font-semibold bg-primary text-white
                                     rounded-full px-2 py-0.5">
                      {items.length}
                    </span>
                  )}
                </h2>
              </div>
              <button
                ref={firstFocusRef}
                onClick={close}
                aria-label="Close cart"
                className="w-8 h-8 rounded-full flex items-center justify-center
                           bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                           text-gray-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
                  {/* Animated empty cart illustration */}
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <svg viewBox="0 0 120 110" fill="none" className="w-32 h-28" aria-hidden="true">
                      {/* Cart shadow */}
                      <ellipse cx="62" cy="103" rx="28" ry="5" fill="#E8F5E9" />
                      {/* Cart body */}
                      <path
                        d="M28 38h64l-9 42H37L28 38z"
                        fill="#E8F5E9"
                        stroke="#1A6B3A"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                      />
                      {/* Cart handle */}
                      <path
                        d="M18 22h12l6 16"
                        stroke="#1A6B3A"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Front wheel */}
                      <circle cx="44" cy="88" r="8" fill="white" stroke="#1A6B3A" strokeWidth="2.5" />
                      <circle cx="44" cy="88" r="3" fill="#1A6B3A" />
                      {/* Back wheel */}
                      <circle cx="78" cy="88" r="8" fill="white" stroke="#1A6B3A" strokeWidth="2.5" />
                      <circle cx="78" cy="88" r="3" fill="#1A6B3A" />
                      {/* Sad face */}
                      <circle cx="51" cy="57" r="2.5" fill="#1A6B3A" />
                      <circle cx="71" cy="57" r="2.5" fill="#1A6B3A" />
                      <path
                        d="M51 68 Q61 63 71 68"
                        stroke="#1A6B3A"
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill="none"
                      />
                      {/* Floating leaf */}
                      <motion.g
                        animate={{ rotate: [0, 15, -10, 0], y: [0, -4, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        style={{ transformOrigin: "95px 20px" }}
                      >
                        <path
                          d="M90 28 Q95 14 108 18 Q100 28 90 28z"
                          fill="#1A6B3A"
                          opacity="0.6"
                        />
                      </motion.g>
                    </svg>
                  </motion.div>
                  <div className="text-center">
                    <p className="text-gray-800 dark:text-gray-200 text-base font-semibold">
                      Your cart is empty
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                      Add some fresh items to get started!
                    </p>
                  </div>
                  <button
                    onClick={close}
                    className="btn-primary text-sm px-6 py-2.5"
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 p-3 rounded-2xl
                               bg-white dark:bg-gray-800
                               border border-gray-100 dark:border-gray-700
                               shadow-sm"
                  >
                    {/* Image */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-accent">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white
                                   line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.unit}</p>
                      <p className="text-sm font-bold text-primary mt-0.5">
                        {formatPrice(item.sellingPrice * item.quantity)}
                      </p>
                    </div>

                    {/* Qty + Remove */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-gray-300 dark:text-gray-600 hover:text-danger
                                   transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center border-2 border-primary rounded-xl overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-primary
                                     hover:bg-accent transition-colors"
                          aria-label="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-gray-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="w-6 h-6 flex items-center justify-center text-primary
                                     hover:bg-accent transition-colors disabled:opacity-30"
                          aria-label="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 p-5 space-y-3
                              bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Subtotal
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatPrice(subtotal())}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/cart"
                    onClick={close}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5
                               border-2 border-primary text-primary font-semibold
                               rounded-xl text-sm hover:bg-primary hover:text-white
                               transition-all"
                  >
                    View Cart
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={close}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5
                               bg-primary text-white font-semibold rounded-xl text-sm
                               hover:bg-primary-600 transition-colors"
                  >
                    Checkout <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
