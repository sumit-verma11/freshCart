"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ShoppingBag, Package, Home, User, BarChart2, X, Clock, ArrowRight } from "lucide-react";
import { IProduct } from "@/types";

const PAGES = [
  { label: "Home",        href: "/",          icon: Home },
  { label: "My Orders",   href: "/orders",     icon: Package },
  { label: "My Cart",     href: "/cart",       icon: ShoppingBag },
  { label: "Account",     href: "/account",    icon: User },
];

const RECENT_KEY = "fc-cmd-recent";
function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
function addRecent(q: string) {
  const r = [q, ...getRecent().filter((x) => x !== q)].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(r));
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Open on Cmd+K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setRecent(getRecent());
      setQuery("");
      setProducts([]);
      setFocused(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [open]);

  // Debounced product search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setProducts([]); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=5`);
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(query), 250);
    return () => clearTimeout(searchTimer.current);
  }, [query, doSearch]);

  function navigate(href: string, q?: string) {
    if (q) addRecent(q);
    setOpen(false);
    router.push(href);
  }

  // Build flat list of items for keyboard navigation
  const productItems = products.map((p) => ({
    type: "product" as const, label: p.name,
    href: `/products/${p.slug}`, image: p.images[0],
  }));
  const pageItems = query ? [] : PAGES.map((p) => ({ type: "page" as const, ...p, image: undefined }));
  const allItems = [...productItems, ...pageItems];

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setFocused((f) => Math.min(f + 1, allItems.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setFocused((f) => Math.max(f - 1, 0)); }
    if (e.key === "Enter" && allItems[focused]) {
      navigate(allItems[focused].href, query || undefined);
    }
    if (e.key === "Enter" && query && productItems.length === 0 && !loading) {
      navigate(`/search?q=${encodeURIComponent(query)}`, query);
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="cmd-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
              onClick={() => setOpen(false)}
            />
            <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[10vh] px-4">
              <motion.div
                key="cmd-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Command palette"
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                className="w-full max-w-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl
                           rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50
                           overflow-hidden"
                onKeyDown={handleKeyDown}
              >
                {/* Search input */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <Search className="w-5 h-5 text-gray-400 shrink-0" />
                  <input
                    ref={inputRef}
                    role="combobox"
                    aria-expanded={allItems.length > 0}
                    aria-autocomplete="list"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setFocused(0); }}
                    placeholder="Search products, pages…"
                    className="flex-1 bg-transparent text-gray-900 dark:text-white text-base
                               placeholder:text-gray-400 outline-none"
                  />
                  <div className="flex items-center gap-2">
                    {loading && (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent
                                      rounded-full animate-spin" />
                    )}
                    <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg
                                    bg-gray-100 dark:bg-gray-800 text-xs text-gray-500
                                    font-medium border border-gray-200 dark:border-gray-700">
                      esc
                    </kbd>
                    <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                  {/* Recent searches (no query) */}
                  {!query && recent.length > 0 && (
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
                        Recent searches
                      </p>
                      {recent.map((r) => (
                        <button
                          key={r}
                          onClick={() => navigate(`/search?q=${encodeURIComponent(r)}`, r)}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl
                                     hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                        >
                          <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{r}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Pages (no query) */}
                  {!query && (
                    <div className="px-4 pt-2 pb-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
                        Quick nav
                      </p>
                      {PAGES.map((p, i) => (
                        <button
                          key={p.href}
                          onClick={() => navigate(p.href)}
                          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl
                                      transition-colors text-left
                                      ${focused === i
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
                        >
                          <p.icon className="w-4 h-4 shrink-0" />
                          <span className="text-sm font-medium">{p.label}</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-auto text-gray-300" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Product results */}
                  {products.length > 0 && (
                    <div className="px-4 pt-2 pb-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
                        Products
                      </p>
                      {products.map((p, i) => (
                        <button
                          key={p._id.toString()}
                          onClick={() => navigate(`/products/${p.slug}`, query)}
                          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl
                                      transition-colors text-left
                                      ${focused === i
                                        ? "bg-primary/10"
                                        : "hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-accent overflow-hidden shrink-0">
                            {p.images[0] && (
                              <Image
                                src={p.images[0]}
                                alt={p.name}
                                width={40}
                                height={40}
                                className="w-full h-full object-contain"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {p.name}
                            </p>
                            <p className="text-xs text-primary font-bold">
                              ₹{p.variants[0]?.sellingPrice ?? 0}
                            </p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 ml-auto text-gray-300 shrink-0" />
                        </button>
                      ))}
                      {/* See all results */}
                      <button
                        onClick={() => navigate(`/search?q=${encodeURIComponent(query)}`, query)}
                        className="flex items-center gap-2 w-full px-3 py-2.5 mt-1 rounded-xl
                                   text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                      >
                        See all results for &ldquo;{query}&rdquo; <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                      </button>
                    </div>
                  )}

                  {/* No results */}
                  {query && !loading && products.length === 0 && (
                    <div className="px-6 py-10 text-center">
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No products found for &ldquo;{query}&rdquo;
                      </p>
                      <button
                        onClick={() => navigate(`/search?q=${encodeURIComponent(query)}`, query)}
                        className="mt-3 text-sm font-semibold text-primary hover:underline"
                      >
                        Search in all products →
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer hint */}
                <div className="flex items-center gap-4 px-5 py-2.5 border-t border-gray-100
                                dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 text-[10px] font-medium">↑↓</kbd> navigate
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 text-[10px] font-medium">↵</kbd> select
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 text-[10px] font-medium">esc</kbd> close
                  </span>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
