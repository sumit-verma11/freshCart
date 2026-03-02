"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, X, ChevronRight, Leaf, RotateCcw, MapPin, Loader2 } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { usePincodeStore } from "@/store/pincode";
import { useUserActivity } from "@/store/userActivity";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { IProduct } from "@/types";
import { formatPrice } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

interface Props {
  initialCategories: CategoryItem[];
}

const CATEGORY_EMOJI: Record<string, string> = {
  "Fruits & Vegetables": "🥦",
  "Dairy & Eggs":        "🥛",
  "Bakery":              "🍞",
  "Beverages":           "🧃",
  "Snacks":              "🍿",
  "Meat & Seafood":      "🐟",
};

const SORT_OPTIONS = [
  { value: "createdAt", label: "Newest First" },
  { value: "sellingPrice-asc", label: "Price: Low to High" },
  { value: "sellingPrice-desc", label: "Price: High to Low" },
  { value: "name", label: "Name A–Z" },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-square skeleton-shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 skeleton-shimmer rounded w-16" />
        <div className="h-3.5 skeleton-shimmer rounded w-full" />
        <div className="h-3.5 skeleton-shimmer rounded w-3/4" />
        <div className="h-2.5 skeleton-shimmer rounded w-12" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-5 skeleton-shimmer rounded w-20" />
          <div className="w-8 h-8 skeleton-shimmer rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── FilterPanel (shared between sidebar and bottom sheet) ────────────────────

interface FilterPanelProps {
  categories:       CategoryItem[];
  subcategories:    CategoryItem[];
  filters:          FilterState;
  onFilterChange:   (patch: Partial<FilterState>) => void;
  onReset:          () => void;
}

function FilterPanel({ categories, subcategories, filters, onFilterChange, onReset }: FilterPanelProps) {
  return (
    <div className="space-y-6">
      {/* Reset */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-dark">Filters</h3>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary
                     hover:underline"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset all
        </button>
      </div>

      {/* Sort */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Sort by</p>
        <div className="space-y-1.5">
          {SORT_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="radio"
                name="sort"
                value={opt.value}
                checked={filters.sortBy === opt.value}
                onChange={() => onFilterChange({ sortBy: opt.value })}
                className="accent-primary"
              />
              <span className="text-sm text-dark group-hover:text-primary transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Category</p>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name="category"
              checked={!filters.category}
              onChange={() => onFilterChange({ category: "", subcategory: "" })}
              className="accent-primary"
            />
            <span className="text-sm text-dark group-hover:text-primary transition-colors">All Categories</span>
          </label>
          {categories.map((cat) => (
            <label
              key={cat._id}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="radio"
                name="category"
                checked={filters.category === cat._id}
                onChange={() => onFilterChange({ category: cat._id, subcategory: "" })}
                className="accent-primary"
              />
              <span className="text-sm text-dark group-hover:text-primary transition-colors flex items-center gap-1.5">
                <span>{CATEGORY_EMOJI[cat.name] ?? "🛒"}</span>
                {cat.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Subcategory */}
      {subcategories.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Subcategory</p>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="subcategory"
                checked={!filters.subcategory}
                onChange={() => onFilterChange({ subcategory: "" })}
                className="accent-primary"
              />
              <span className="text-sm text-dark group-hover:text-primary transition-colors">All</span>
            </label>
            {subcategories.map((sub) => (
              <label key={sub._id} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="subcategory"
                  checked={filters.subcategory === sub._id}
                  onChange={() => onFilterChange({ subcategory: sub._id })}
                  className="accent-primary"
                />
                <span className="text-sm text-dark group-hover:text-primary transition-colors">
                  {sub.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price range */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
          Max Price: <span className="text-primary font-bold">{formatPrice(filters.maxPrice)}</span>
        </p>
        <input
          type="range"
          min={50}
          max={5000}
          step={50}
          value={filters.maxPrice}
          onChange={(e) => onFilterChange({ maxPrice: Number(e.target.value) })}
          className="w-full accent-primary"
          style={{
            background: `linear-gradient(to right, #1A6B3A ${((filters.maxPrice - 50) / (5000 - 50)) * 100}%, #E5E7EB ${((filters.maxPrice - 50) / (5000 - 50)) * 100}%)`,
          }}
        />
        <div className="flex justify-between text-xs text-muted mt-1">
          <span>₹50</span>
          <span>₹5,000</span>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide">Dietary</p>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-dark flex items-center gap-2">
            <span>📦</span> In Stock Only
          </span>
          <button
            role="switch"
            aria-checked={filters.inStockOnly}
            onClick={() => onFilterChange({ inStockOnly: !filters.inStockOnly })}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none
                        ${filters.inStockOnly ? "bg-primary" : "bg-gray-300"}`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
                          ${filters.inStockOnly ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-dark flex items-center gap-2">
            <Leaf className="w-4 h-4 text-success" /> Organic Only
          </span>
          <button
            role="switch"
            aria-checked={filters.organicOnly}
            onClick={() => onFilterChange({ organicOnly: !filters.organicOnly })}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none
                        ${filters.organicOnly ? "bg-primary" : "bg-gray-300"}`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
                          ${filters.organicOnly ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </label>
      </div>
    </div>
  );
}

// ─── Filter state ─────────────────────────────────────────────────────────────

interface FilterState {
  sortBy:      string;
  category:    string;
  subcategory: string;
  maxPrice:    number;
  inStockOnly: boolean;
  organicOnly: boolean;
}

const DEFAULT_FILTERS: FilterState = {
  sortBy:      "createdAt",
  category:    "",
  subcategory: "",
  maxPrice:    5000,
  inStockOnly: false,
  organicOnly: false,
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function ShopSection({ initialCategories }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { info: pincodeInfo } = usePincodeStore();
  const { preferredCategoryIds } = useUserActivity();

  // Init search from URL param
  const [searchInput, setSearchInput]   = useState(searchParams.get("search") ?? "");
  const [debouncedSearch, setDSearch]   = useState(searchParams.get("search") ?? "");
  const [filters, setFilters]           = useState<FilterState>({
    ...DEFAULT_FILTERS,
    category: searchParams.get("category") ?? "",
  });
  const [page, setPage]                 = useState(1);
  const [products, setProducts]         = useState<IProduct[]>([]);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [subcategories, setSubcategories] = useState<CategoryItem[]>([]);
  const [refreshKey, setRefreshKey]     = useState(0);

  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { isPulling, pullProgress, isRefreshing } = usePullToRefresh({
    onRefresh: () => setRefreshKey((k) => k + 1),
  });

  // Debounce search input → debouncedSearch
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput]);

  // Sync URL params whenever they change (covers Navbar category links + search)
  useEffect(() => {
    const q   = searchParams.get("search") ?? "";
    const cat = searchParams.get("category") ?? "";
    setSearchInput(q);
    setDSearch(q);
    setFilters((f) => ({ ...f, category: cat, subcategory: "" }));
    setPage(1);
    setProducts([]);
  }, [searchParams]);

  // Load subcategories when category changes
  useEffect(() => {
    if (!filters.category) { setSubcategories([]); return; }
    fetch(`/api/categories?parent=${filters.category}&active=true`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setSubcategories(d.data); })
      .catch(() => {});
  }, [filters.category]);

  // Fetch products when any filter/search/page changes
  const fetchProducts = useCallback(async () => {
    const isFirstPage = page === 1;
    if (isFirstPage) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "12");

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filters.category)    params.set("category", filters.category);
      if (filters.subcategory) params.set("subcategory", filters.subcategory);
      if (filters.maxPrice < 5000) params.set("maxPrice", String(filters.maxPrice));
      if (filters.inStockOnly) params.set("available", "true");
      if (filters.organicOnly) params.set("organic", "true");
      if (pincodeInfo?.pincode) params.set("pincode", pincodeInfo.pincode);

      // Sort
      const [sortField, sortOrder] = filters.sortBy.includes("-")
        ? filters.sortBy.split("-")
        : [filters.sortBy, "desc"];
      params.set("sort", sortField);
      if (sortOrder === "asc") params.set("order", "asc");

      const res  = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        if (isFirstPage) {
          setProducts(data.data);
        } else {
          setProducts((prev) => [...prev, ...data.data]);
        }
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch {
      // keep existing products on error
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters, page, pincodeInfo?.pincode, refreshKey]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // IntersectionObserver — load next page when sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && page < totalPages) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, loadingMore, page, totalPages]);

  function updateFilter(patch: Partial<FilterState>) {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
    setProducts([]);
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setSearchInput("");
    setDSearch("");
    setPage(1);
    router.replace("/");
  }

  const activeFilterCount = [
    filters.category,
    filters.subcategory,
    filters.maxPrice < 5000,
    filters.inStockOnly,
    filters.organicOnly,
  ].filter(Boolean).length;

  // Reorder categories: preferred ones float to the front
  const orderedCategories = preferredCategoryIds.length > 0
    ? [
        ...initialCategories.filter((c) => preferredCategoryIds.includes(c._id)),
        ...initialCategories.filter((c) => !preferredCategoryIds.includes(c._id)),
      ]
    : initialCategories;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Pull-to-refresh indicator */}
      <div
        className="flex justify-center overflow-hidden transition-all duration-300 lg:hidden"
        style={{ height: (isPulling || isRefreshing) ? 40 : 0, opacity: isPulling ? pullProgress : isRefreshing ? 1 : 0 }}
      >
        <Loader2 className="w-6 h-6 text-primary animate-spin mt-2" />
      </div>

      {/* Category Quick-Nav */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => updateFilter({ category: "", subcategory: "" })}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold
                      whitespace-nowrap transition-all shrink-0 border
                      ${!filters.category
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white dark:bg-gray-900 text-muted border-border hover:border-primary hover:text-primary"
                      }`}
        >
          🛒 All
        </button>
        {orderedCategories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => updateFilter({ category: cat._id, subcategory: "" })}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold
                        whitespace-nowrap transition-all shrink-0 border
                        ${filters.category === cat._id
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-white dark:bg-gray-900 text-muted border-border hover:border-primary hover:text-primary"
                        }`}
          >
            <span>{CATEGORY_EMOJI[cat.name] ?? "🛒"}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Pincode banner */}
      {pincodeInfo?.isServiceable && (
        <div className="flex items-center gap-3 bg-accent border border-primary/20 rounded-2xl
                        px-5 py-3 mb-6 text-sm animate-fade-in">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span className="text-dark font-medium">
            Showing products available in{" "}
            <span className="text-primary font-bold">
              {pincodeInfo.area}, {pincodeInfo.city}
            </span>
          </span>
          {pincodeInfo.estimatedDelivery && (
            <span className="ml-auto text-muted text-xs font-medium shrink-0">
              ⚡ {pincodeInfo.estimatedDelivery.min}–{pincodeInfo.estimatedDelivery.max}h delivery
            </span>
          )}
        </div>
      )}

      {/* Section header + search + mobile filter button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-dark">
            {debouncedSearch
              ? `Results for "${debouncedSearch}"`
              : filters.category
                ? (initialCategories.find((c) => c._id === filters.category)?.name ?? "Products")
                : "All Products"}
          </h2>
          {!loading && (
            <p className="text-sm text-muted mt-0.5">
              {total} {total === 1 ? "product" : "products"} found
            </p>
          )}
        </div>

        {/* Search bar */}
        <div className="relative sm:w-64">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products..."
            className="input py-2.5 pr-8"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(""); setDSearch(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted
                         hover:text-dark transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile filter button */}
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="lg:hidden flex items-center gap-2 btn-outline py-2.5 text-sm shrink-0 relative"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-secondary text-white text-xs
                             font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-8">
        {/* ── Desktop filter sidebar ───────────────────────────────────────── */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="card p-5 sticky top-28">
            <FilterPanel
              categories={initialCategories}
              subcategories={subcategories}
              filters={filters}
              onFilterChange={updateFilter}
              onReset={resetFilters}
            />
          </div>
        </aside>

        {/* ── Product grid ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="card p-12 text-center flex flex-col items-center">
              {/* Animated magnifying glass SVG */}
              <motion.div
                animate={{ rotate: [0, -8, 8, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                className="mb-5"
              >
                <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24" aria-hidden="true">
                  {/* Circle of magnifier */}
                  <circle cx="42" cy="42" r="26" stroke="#1A6B3A" strokeWidth="5" fill="#E8F5E9" />
                  {/* Lens glare */}
                  <path
                    d="M30 30 Q35 26 42 26"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                  {/* Handle */}
                  <line x1="61" y1="61" x2="80" y2="80" stroke="#1A6B3A" strokeWidth="5" strokeLinecap="round" />
                  {/* Question mark */}
                  <text x="34" y="52" fontFamily="Inter, sans-serif" fontSize="22" fontWeight="700" fill="#1A6B3A">
                    ?
                  </text>
                </svg>
              </motion.div>
              <h3 className="text-lg font-bold text-dark dark:text-white mb-2">No products found</h3>
              <p className="text-muted text-sm mb-6 max-w-xs">
                {debouncedSearch
                  ? `No results for "${debouncedSearch}". Try a different keyword.`
                  : "No products match the selected filters."}
              </p>
              <button onClick={resetFilters} className="btn-primary mx-auto w-fit">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <motion.div
                key={`${debouncedSearch}-${filters.category}-${filters.subcategory}`}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                variants={{
                  visible: { transition: { staggerChildren: 0.04 } },
                }}
                initial="hidden"
                animate="visible"
              >
                {products.map((product) => (
                  <motion.div
                    key={product._id.toString()}
                    variants={{
                      hidden:   { opacity: 0, y: 20 },
                      visible:  { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
                    }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="mt-8">
                {loadingMore && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
                  </div>
                )}
                {!loadingMore && page >= totalPages && products.length > 0 && (
                  <p className="text-center text-sm text-muted py-6">
                    🎉 You&apos;ve seen all {total} products
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Mobile Filter Bottom Sheet ───────────────────────────────────────── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-dark/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileFiltersOpen(false)}
          />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl
                          max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-dark">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="text-muted hover:text-dark transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-5">
              <FilterPanel
                categories={initialCategories}
                subcategories={subcategories}
                filters={filters}
                onFilterChange={(patch) => { updateFilter(patch); }}
                onReset={resetFilters}
              />
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-border p-4">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Show {loading ? "..." : total} Products <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
