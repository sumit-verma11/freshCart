"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X, Clock, TrendingUp } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { ProductCardSkeleton, ProductGridSkeleton } from "@/components/Skeleton";
import { IProduct } from "@/types";
import { trackSearch } from "@/lib/analytics";

const SORT_OPTIONS = [
  { label: "Relevance",       value: "createdAt:desc" },
  { label: "Price: Low → High", value: "sellingPrice:asc" },
  { label: "Price: High → Low", value: "sellingPrice:desc" },
  { label: "Newest",          value: "createdAt:asc" },
];

const POPULAR_SEARCHES = [
  "Fresh vegetables", "Organic milk", "Brown bread", "Basmati rice",
  "Paneer", "Eggs", "Green tea", "Almonds",
];

const HISTORY_KEY = "freshcart-search-history";

function getHistory(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); } catch { return []; }
}

function saveHistory(query: string) {
  const prev = getHistory().filter((h) => h !== query);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([query, ...prev].slice(0, 8)));
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") ?? "";
  const initialSort  = searchParams.get("sort") ?? "createdAt:desc";

  const [input, setInput]       = useState(initialQuery);
  const [query, setQuery]       = useState(initialQuery);
  const [sort, setSort]         = useState(initialSort);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading]   = useState(false);
  const [total, setTotal]       = useState(0);
  const [history, setHistory]   = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load history on mount
  useEffect(() => { setHistory(getHistory()); }, []);

  const fetchResults = useCallback(async (q: string, s: string) => {
    if (!q.trim()) { setProducts([]); setTotal(0); return; }
    setLoading(true);
    try {
      const [sortField, sortOrder] = s.split(":");
      const res = await fetch(
        `/api/products?search=${encodeURIComponent(q)}&sort=${sortField}&order=${sortOrder}&limit=24`
      );
      const data = await res.json();
      setProducts(data.data ?? []);
      setTotal(data.pagination?.total ?? 0);
      trackSearch(q, data.pagination?.total ?? 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when query or sort changes
  useEffect(() => {
    fetchResults(query, sort);
  }, [query, sort, fetchResults]);

  function handleSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setInput(trimmed);
    setShowSuggestions(false);
    saveHistory(trimmed);
    setHistory(getHistory());
    router.replace(`/search?q=${encodeURIComponent(trimmed)}&sort=${sort}`, { scroll: false });
  }

  function handleSortChange(newSort: string) {
    setSort(newSort);
    if (query) {
      router.replace(`/search?q=${encodeURIComponent(query)}&sort=${newSort}`, { scroll: false });
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Search bar */}
      <div className="relative mb-6">
        <div className="flex items-center gap-3 bg-white border-2 border-primary rounded-2xl
                        px-4 py-3 shadow-sm">
          <Search className="w-5 h-5 text-primary shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(input); }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search for fruits, vegetables, dairy..."
            className="flex-1 outline-none text-dark placeholder:text-muted text-sm bg-transparent"
            autoFocus
          />
          {input && (
            <button onClick={() => { setInput(""); setQuery(""); setShowSuggestions(false); }}>
              <X className="w-4 h-4 text-muted" />
            </button>
          )}
          <button
            onClick={() => handleSearch(input)}
            className="bg-primary text-white text-sm font-semibold px-4 py-1.5 rounded-xl
                       hover:bg-primary-600 transition-colors"
          >
            Search
          </button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && !query && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border
                          rounded-2xl shadow-lg z-30 overflow-hidden">
            {history.length > 0 && (
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Recent
                  </span>
                  <button
                    onClick={() => { clearHistory(); setHistory([]); }}
                    className="text-xs text-danger hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.map((h) => (
                    <button
                      key={h}
                      onClick={() => handleSearch(h)}
                      className="text-xs px-3 py-1 bg-gray-100 hover:bg-accent rounded-full
                                 text-dark transition-colors"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="p-3">
              <span className="text-xs font-semibold text-muted flex items-center gap-1 mb-2">
                <TrendingUp className="w-3 h-3" /> Popular
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSearch(s)}
                    className="text-xs px-3 py-1 bg-primary/10 hover:bg-primary/20 rounded-full
                               text-primary font-medium transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results header + sort */}
      {query && (
        <div className="flex items-center justify-between mb-4 gap-4">
          <p className="text-sm text-muted">
            {loading ? "Searching…" : `${total} result${total !== 1 ? "s" : ""} for `}
            {!loading && <span className="font-semibold text-dark">"{query}"</span>}
          </p>

          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-muted" />
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="text-sm border border-border rounded-lg px-2 py-1.5 bg-white
                         text-dark focus:outline-none focus:border-primary"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* No query state */}
      {!query && !showSuggestions && (
        <div className="text-center py-16">
          <Search className="w-16 h-16 text-muted/30 mx-auto mb-4" />
          <p className="text-muted">Type something to search for products</p>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      )}

      {/* Results */}
      {!loading && query && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p._id.toString()} product={p} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && query && products.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-dark mb-2">No results found</h2>
          <p className="text-muted mb-6">
            We couldn&apos;t find anything for &quot;{query}&quot;. Try different keywords.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {POPULAR_SEARCHES.slice(0, 4).map((s) => (
              <button
                key={s}
                onClick={() => handleSearch(s)}
                className="text-sm px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-full
                           text-primary font-medium transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-14 bg-gray-200 animate-pulse rounded-2xl mb-6" />
        <ProductGridSkeleton count={8} />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
