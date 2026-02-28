"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart, User, Search, Menu, X, Leaf, ChevronDown } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Fruits & Vegetables",
  "Dairy & Eggs",
  "Bakery",
  "Beverages",
  "Snacks",
  "Meat & Seafood",
];

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-border">
      {/* Top strip */}
      <div className="bg-primary text-white text-xs text-center py-1.5 font-medium">
        🚚 Free delivery on orders above ₹499 &nbsp;|&nbsp; Same-day delivery available
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="bg-primary rounded-xl p-1.5">
              <Leaf className="w-5 h-5 text-white" />
            </span>
            <span className="text-xl font-bold text-dark">
              Fresh<span className="text-primary">Cart</span>
            </span>
          </Link>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search for groceries, brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
                  }
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-gray-50
                           text-sm focus:outline-none focus:ring-2 focus:ring-primary/30
                           focus:border-primary focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center gap-2 btn-ghost text-sm"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs
                                 font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {session ? (
              <div className="relative group">
                <button className="flex items-center gap-1.5 btn-ghost text-sm">
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline font-medium max-w-[80px] truncate">
                    {session.user.name?.split(" ")[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 card shadow-modal py-1
                                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                                transition-all duration-150">
                  {session.user.role === "admin" && (
                    <Link href="/dashboard" className="block px-4 py-2.5 text-sm hover:bg-accent">
                      Admin Dashboard
                    </Link>
                  )}
                  <Link href="/orders" className="block px-4 py-2.5 text-sm hover:bg-accent">
                    My Orders
                  </Link>
                  <Link href="/profile" className="block px-4 py-2.5 text-sm hover:bg-accent">
                    Profile
                  </Link>
                  <hr className="my-1 border-border" />
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="block w-full text-left px-4 py-2.5 text-sm text-danger hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="btn-primary text-sm px-4 py-2.5">
                Login
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden btn-ghost p-2"
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Category nav */}
        <nav className="hidden md:flex items-center gap-1 pb-2 overflow-x-auto scrollbar-hide">
          <div className="relative">
            <button
              onMouseEnter={() => setCatOpen(true)}
              onMouseLeave={() => setCatOpen(false)}
              className="flex items-center gap-1 text-sm font-medium text-dark
                         hover:text-primary transition-colors px-3 py-1.5 rounded-lg
                         hover:bg-accent"
            >
              All Categories <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {catOpen && (
              <div
                className="absolute left-0 top-full w-56 card shadow-modal py-1 z-50"
                onMouseEnter={() => setCatOpen(true)}
                onMouseLeave={() => setCatOpen(false)}
              >
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat}
                    href={`/category/${encodeURIComponent(cat)}`}
                    className="block px-4 py-2.5 text-sm hover:bg-accent hover:text-primary"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/category/${encodeURIComponent(cat)}`}
              className={cn(
                "text-sm font-medium whitespace-nowrap px-3 py-1.5 rounded-lg",
                "text-muted hover:text-primary hover:bg-accent transition-colors"
              )}
            >
              {cat}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 py-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search groceries..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div className="space-y-1">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/category/${encodeURIComponent(cat)}`}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-dark hover:text-primary
                           hover:bg-accent rounded-lg transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
