"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import {
  ShoppingCart, User, Search, Menu, X, Leaf, ChevronDown,
  MapPin, Loader2, CheckCircle2, AlertCircle, LayoutDashboard,
  Package, LogOut, Heart,
} from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { usePincodeStore } from "@/store/pincode";
import { useCartSidebarStore } from "@/store/cartSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { IProduct } from "@/types";
import { formatPrice } from "@/lib/utils";

// ─── Category quick links ─────────────────────────────────────────────────────

const CATEGORY_EMOJI_MAP: Record<string, string> = {
  "Fruits & Vegetables": "🥦",
  "Dairy & Eggs":        "🥛",
  "Bakery":              "🍞",
  "Beverages":           "🧃",
  "Snacks":              "🍿",
  "Meat & Seafood":      "🐟",
};

interface NavCategory { _id: string; name: string; label: string; emoji: string }

// Fallback shown while categories are being fetched (IDs will be replaced by real ones)
const FALLBACK_NAV_CATEGORIES: NavCategory[] = [
  { _id: "Fruits & Vegetables", name: "Fruits & Vegetables", label: "Fruits & Veggies", emoji: "🥦" },
  { _id: "Dairy & Eggs",        name: "Dairy & Eggs",        label: "Dairy & Eggs",     emoji: "🥛" },
  { _id: "Bakery",              name: "Bakery",              label: "Bakery",            emoji: "🍞" },
  { _id: "Beverages",           name: "Beverages",           label: "Beverages",         emoji: "🧃" },
  { _id: "Snacks",              name: "Snacks",              label: "Snacks",            emoji: "🍿" },
  { _id: "Meat & Seafood",      name: "Meat & Seafood",      label: "Meat & Seafood",    emoji: "🐟" },
];

// ─── Text highlighter ─────────────────────────────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-secondary/25 text-dark rounded-sm not-italic px-0.5">
            {p}
          </mark>
        ) : (
          p
        )
      )}
    </>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar() {
  const { data: session } = useSession();
  const cartCount     = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const { info: pincodeInfo, setPincode, clearPincode } = usePincodeStore();
  const toggleCartSidebar = useCartSidebarStore((s) => s.toggle);

  // ── Shrink header on scroll ───────────────────────────────────────────────
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Fetched categories (real IDs from API) ────────────────────────────────
  const [navCategories, setNavCategories] = useState<NavCategory[]>(FALLBACK_NAV_CATEGORIES);

  useEffect(() => {
    fetch("/api/categories?active=true")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const topLevel = d.data.filter((c: { parentCategory: unknown }) => !c.parentCategory);
        if (topLevel.length > 0) {
          setNavCategories(
            topLevel.map((c: { _id: string; name: string }) => ({
              _id:   c._id,
              name:  c.name,
              label: c.name.replace("Fruits & Vegetables", "Fruits & Veggies"),
              emoji: CATEGORY_EMOJI_MAP[c.name] ?? "🛒",
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // ── Mobile menu ──────────────────────────────────────────────────────────
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // ── Search ───────────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<IProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Pincode modal ─────────────────────────────────────────────────────────
  const [pincodeOpen, setPincodeOpen] = useState(false);
  const [pincodeInput, setPincodeInput] = useState("");
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [pincodeSuccess, setPincodeSuccess] = useState(false);
  const pincodeInputRef = useRef<HTMLInputElement>(null);

  // ── Debounced search ──────────────────────────────────────────────────────
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    setSearchLoading(true);
    try {
      const res  = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=6`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setSearchResults(data.data);
        setSearchOpen(true);
      } else {
        setSearchResults([]);
        setSearchOpen(!!q.trim()); // keep open to show "no results"
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!searchInput.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    searchTimer.current = setTimeout(() => doSearch(searchInput), 300);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput, doSearch]);

  // Close search on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Focus pincode input when modal opens
  useEffect(() => {
    if (pincodeOpen) {
      setPincodeInput(pincodeInfo?.pincode ?? "");
      setPincodeError("");
      setPincodeSuccess(false);
      setTimeout(() => pincodeInputRef.current?.focus(), 100);
    }
  }, [pincodeOpen, pincodeInfo]);

  // ── Pincode check ─────────────────────────────────────────────────────────
  async function checkPincode() {
    if (!/^\d{6}$/.test(pincodeInput)) {
      setPincodeError("Please enter a valid 6-digit pincode");
      return;
    }
    setPincodeLoading(true);
    setPincodeError("");
    try {
      const res  = await fetch(`/api/pincode/check?pincode=${pincodeInput}`);
      const data = await res.json();
      if (data.success) {
        setPincode(data.data);
        setPincodeSuccess(true);
        setTimeout(() => { setPincodeOpen(false); setPincodeSuccess(false); }, 1200);
      } else {
        setPincodeError(data.error || "Failed to check pincode");
      }
    } catch {
      setPincodeError("Network error. Please try again.");
    } finally {
      setPincodeLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchOpen(false);
      window.location.href = `/?search=${encodeURIComponent(searchInput.trim())}`;
    }
  }

  return (
    <>
      <header className={`sticky top-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-border dark:border-gray-800 transition-all duration-300 ${scrolled ? "shadow-md dark:shadow-gray-900/50" : "shadow-sm"}`}>
        {/* Top promo strip — marquee */}
        <div className="bg-primary text-white text-xs py-1.5 font-medium overflow-hidden">
          <div className="animate-marquee inline-flex gap-16 whitespace-nowrap">
            <span>🚚 Free delivery on orders above ₹499</span>
            <span>⚡ Same-day delivery available</span>
            <span>🌿 Fresh organic produce daily</span>
            <span>🎉 New users get ₹100 off first order</span>
            <span>🚚 Free delivery on orders above ₹499</span>
            <span>⚡ Same-day delivery available</span>
            <span>🌿 Fresh organic produce daily</span>
            <span>🎉 New users get ₹100 off first order</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center gap-3 transition-all duration-300 ${scrolled ? "h-12" : "h-16"}`}>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="bg-primary rounded-xl p-1.5">
                <Leaf className="w-5 h-5 text-white" />
              </span>
              <span className="text-xl font-bold text-dark hidden sm:block">
                Fresh<span className="text-primary">Cart</span>
              </span>
            </Link>

            {/* Pincode detector */}
            <button
              onClick={() => setPincodeOpen(true)}
              className="hidden md:flex items-center gap-1.5 shrink-0 text-sm font-medium
                         text-muted hover:text-primary transition-colors px-3 py-1.5
                         rounded-lg hover:bg-accent border border-border"
              title="Set delivery location"
            >
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="max-w-[110px] truncate">
                {pincodeInfo?.area
                  ? `${pincodeInfo.area}, ${pincodeInfo.city}`
                  : "Enter Pincode"}
              </span>
            </button>

            {/* Search bar */}
            <div ref={searchRef} className="hidden md:block flex-1 relative">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onFocus={() => searchInput.trim() && setSearchOpen(true)}
                    placeholder="Search vegetables, fruits, dairy... (⌘K)"
                    className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-border bg-gray-50
                               dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400
                               text-sm focus:outline-none focus:ring-2 focus:ring-primary/30
                               focus:border-primary focus:bg-white dark:focus:bg-gray-800 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5
                                   text-[10px] text-muted bg-gray-100 px-1.5 py-0.5 rounded font-mono pointer-events-none">
                    ⌘K
                  </span>
                  {searchLoading && (
                    <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4
                                        text-muted animate-spin" />
                  )}
                </div>
              </form>

              {/* Search dropdown */}
              {searchOpen && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-gray-900 rounded-2xl
                                shadow-modal dark:shadow-black/40 border border-border dark:border-gray-800 overflow-hidden z-50 animate-slide-down">
                  {searchResults.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="text-2xl mb-2">🔍</p>
                      <p className="font-semibold text-dark text-sm">No results found</p>
                      <p className="text-xs text-muted mt-1">
                        Try a different keyword or browse categories below
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="divide-y divide-border">
                        {searchResults.map((product) => {
                          const v = product.variants?.[0];
                          return (
                            <Link
                              key={product._id.toString()}
                              href={`/product/${product.slug}`}
                              onClick={() => { setSearchOpen(false); setSearchInput(""); }}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-accent dark:hover:bg-gray-800 transition-colors"
                            >
                              <div className="w-11 h-11 rounded-xl bg-accent overflow-hidden shrink-0">
                                {product.images?.[0] ? (
                                  <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    width={44}
                                    height={44}
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <span className="w-full h-full flex items-center justify-center text-lg">🛒</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-dark truncate">
                                  <Highlight text={product.name} query={searchInput} />
                                </p>
                                {v && (
                                  <p className="text-xs text-muted mt-0.5">
                                    {v.size}{v.unit}
                                  </p>
                                )}
                              </div>
                              {v && (
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-bold text-primary">
                                    {formatPrice(v.sellingPrice)}
                                  </p>
                                  {v.sellingPrice < v.mrp && (
                                    <p className="text-xs text-muted line-through">
                                      {formatPrice(v.mrp)}
                                    </p>
                                  )}
                                </div>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                      <Link
                        href={`/?search=${encodeURIComponent(searchInput)}`}
                        onClick={() => { setSearchOpen(false); setSearchInput(""); }}
                        className="flex items-center justify-center gap-2 px-4 py-3
                                   text-sm font-semibold text-primary hover:bg-accent
                                   border-t border-border transition-colors"
                      >
                        <Search className="w-4 h-4" />
                        View all results for &ldquo;{searchInput}&rdquo;
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 ml-auto md:ml-0">

              {/* Theme toggle */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              {/* Wishlist */}
              <Link href="/wishlist" className="relative btn-ghost p-2 hidden sm:flex">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px]
                                   font-bold w-4 h-4 rounded-full flex items-center justify-center
                                   leading-none">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart → opens sidebar */}
              <button
                onClick={toggleCartSidebar}
                className="relative flex items-center gap-2 btn-ghost"
                aria-label="Open cart"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Cart</span>
                {cartCount > 0 && (
                  <span
                    key={cartCount}
                    className="absolute -top-1 -right-1 bg-secondary text-white text-xs
                               font-bold w-5 h-5 rounded-full flex items-center justify-center
                               leading-none animate-badge-bounce"
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>

              {/* Auth */}
              {session ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((o) => !o)}
                    className="flex items-center gap-1.5 btn-ghost text-sm"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="hidden sm:inline font-medium max-w-[70px] truncate">
                      {session.user.name?.split(" ")[0]}
                    </span>
                    {session.user.role === "admin" && (
                      <span className="hidden sm:inline text-xs bg-secondary text-white
                                       px-1.5 py-0.5 rounded-full font-bold">
                        Admin
                      </span>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-52 card shadow-modal py-1.5 z-50 animate-slide-down">
                        <div className="px-4 py-2 border-b border-border mb-1">
                          <p className="text-sm font-semibold text-dark truncate">{session.user.name}</p>
                          <p className="text-xs text-muted truncate">{session.user.email}</p>
                        </div>
                        {session.user.role === "admin" && (
                          <Link
                            href="/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm
                                       hover:bg-accent dark:hover:bg-gray-800 text-dark transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-primary" />
                            Admin Dashboard
                          </Link>
                        )}
                        <Link
                          href="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm
                                     hover:bg-accent dark:hover:bg-gray-800 text-dark transition-colors"
                        >
                          <Package className="w-4 h-4 text-muted" />
                          My Orders
                        </Link>
                        <hr className="my-1 border-border" />
                        <button
                          onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm
                                     text-danger hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link href="/login" className="btn-primary text-sm px-4 py-2">
                  Login
                </Link>
              )}

              {/* Mobile toggle */}
              <button
                className="md:hidden btn-ghost p-2"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Desktop category nav */}
          <nav className="hidden md:flex items-center gap-1 pb-2 overflow-x-auto scrollbar-hide">
            {navCategories.map(({ _id, label, emoji }) => (
              <Link
                key={_id}
                href={`/?category=${_id}`}
                className="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap
                           px-3 py-1.5 rounded-lg text-muted hover:text-primary
                           hover:bg-accent dark:hover:bg-gray-800 transition-colors"
              >
                <span>{emoji}</span> {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-4 space-y-3
                          animate-slide-down">
            {/* Mobile search */}
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search groceries..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-gray-50
                             dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400
                             text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </form>

            {/* Mobile pincode */}
            <button
              onClick={() => { setPincodeOpen(true); setMobileOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg
                         bg-accent text-sm font-medium text-primary"
            >
              <MapPin className="w-4 h-4" />
              {pincodeInfo?.area
                ? `Delivering to: ${pincodeInfo.area}, ${pincodeInfo.city}`
                : "Set delivery location"}
            </button>

            {/* Mobile categories */}
            <div className="grid grid-cols-2 gap-1">
              {navCategories.map(({ _id, label, emoji }) => (
                <Link
                  key={_id}
                  href={`/?category=${_id}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium
                             text-dark hover:text-primary hover:bg-accent rounded-lg transition-colors"
                >
                  <span>{emoji}</span> {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ── Pincode Modal ─────────────────────────────────────────────────────── */}
      {pincodeOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-dark/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setPincodeOpen(false)}
          />

          {/* Sheet */}
          <div className="relative bg-white dark:bg-gray-900 w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl
                          p-6 shadow-modal dark:shadow-black/50 animate-slide-up sm:animate-fade-in-up">
            <button
              onClick={() => setPincodeOpen(false)}
              className="absolute right-5 top-5 text-muted hover:text-dark transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 bg-accent rounded-2xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-dark">Delivery Location</h2>
                <p className="text-sm text-muted">Enter your pincode to check delivery</p>
              </div>
            </div>

            {pincodeSuccess ? (
              <div className="flex flex-col items-center py-6 gap-3">
                <CheckCircle2 className="w-14 h-14 text-success" />
                <p className="font-bold text-dark">
                  {pincodeInfo?.isServiceable
                    ? `We deliver to ${pincodeInfo.area}!`
                    : "Pincode saved"}
                </p>
                {pincodeInfo?.isServiceable && pincodeInfo.estimatedDelivery && (
                  <p className="text-sm text-muted">
                    Delivery in {pincodeInfo.estimatedDelivery.min}–{pincodeInfo.estimatedDelivery.max} hours
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="flex gap-3">
                  <input
                    ref={pincodeInputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pincodeInput}
                    onChange={(e) => {
                      setPincodeInput(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setPincodeError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && checkPincode()}
                    placeholder="e.g. 400001"
                    className="input flex-1 text-lg font-mono tracking-widest"
                  />
                  <button
                    onClick={checkPincode}
                    disabled={pincodeLoading || pincodeInput.length !== 6}
                    className="btn-primary px-5 shrink-0"
                  >
                    {pincodeLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Check"
                    )}
                  </button>
                </div>

                {pincodeError && (
                  <div className="flex items-center gap-2 mt-3 text-danger text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {pincodeError}
                  </div>
                )}

                {pincodeInfo && !pincodeError && (
                  <div className="mt-3 p-3 bg-accent rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-dark">
                        Current: {pincodeInfo.area}, {pincodeInfo.city}
                      </p>
                      <p className="text-xs text-muted">{pincodeInfo.pincode}</p>
                    </div>
                    <button
                      onClick={clearPincode}
                      className="text-xs text-danger hover:underline font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <p className="text-xs text-muted mt-4 text-center">
                  We&apos;ll show you products available in your area
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
