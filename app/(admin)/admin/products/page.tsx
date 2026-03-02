"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus, Search, Edit2, Trash2, Loader2, RefreshCw, Package, ImageIcon, X, CheckCircle2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

interface Variant { mrp: number; sellingPrice: number; size: string; unit: string; }
interface Category { _id: string; name: string; }
interface Product {
  _id: string; name: string; slug: string;
  images: string[]; category: Category | null;
  variants: Variant[]; stockQty: number;
  isAvailable: boolean; isOrganic: boolean; isFeatured: boolean;
}

interface FixProgress {
  total: number;
  done: number;
  current: string;
  errors: string[];
  finished: boolean;
}

export default function AdminProductsPage() {
  const [products,    setProducts]    = useState<Product[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [catFilter,   setCatFilter]   = useState("");
  const [toggling,    setToggling]    = useState<string | null>(null);
  const [deleting,    setDeleting]    = useState<string | null>(null);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [fixProgress, setFixProgress] = useState<FixProgress | null>(null);
  const fixAbort                      = useRef(false);

  // Fetch categories once for filter dropdown
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => { if (d.success) setCategories(d.data); })
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (search)    params.set("search",   search);
    if (catFilter) params.set("category", catFilter);
    try {
      const res  = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        setTotalPages(data.pagination?.totalPages ?? 1);
      }
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, search, catFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function toggleAvailable(id: string, current: boolean) {
    setToggling(id);
    try {
      const res  = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isAvailable: !current }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => p._id === id ? { ...p, isAvailable: !current } : p)
        );
        toast.success(`Product ${!current ? "enabled" : "disabled"}`);
      }
    } catch {
      toast.error("Toggle failed");
    } finally {
      setToggling(null);
    }
  }

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p._id !== id));
        toast.success("Product deleted");
      } else {
        toast.error("Delete failed");
      }
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  async function fixAllImages() {
    // 1. Fetch the list of slugs with keyword mappings
    const metaRes = await fetch("/api/admin/fix-images");
    const meta    = await metaRes.json();
    if (!meta.success) { toast.error("Failed to load slug list"); return; }

    const slugs: string[] = meta.slugs;
    fixAbort.current = false;

    setFixProgress({ total: slugs.length, done: 0, current: "", errors: [], finished: false });

    let errors: string[] = [];

    for (let i = 0; i < slugs.length; i++) {
      if (fixAbort.current) break;

      const slug = slugs[i];
      setFixProgress((p) => p ? { ...p, done: i, current: slug } : p);

      try {
        const res  = await fetch("/api/admin/fix-images", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ slug }),
        });
        const data = await res.json();
        if (!data.success) errors = [...errors, `${slug}: ${data.error}`];
      } catch {
        errors = [...errors, `${slug}: network error`];
      }

      // Small client-side delay to avoid hammering Unsplash (API does 1 call per route invocation)
      await new Promise((r) => setTimeout(r, 200));
    }

    setFixProgress((p) =>
      p ? { ...p, done: slugs.length, current: "", errors, finished: true } : p
    );

    if (errors.length === 0) {
      toast.success(`All ${slugs.length} product images updated!`);
    } else {
      toast(`${slugs.length - errors.length} updated, ${errors.length} failed`);
    }

    // Reload products list to show new images
    fetchProducts();
  }

  return (
    <div className="space-y-6">
      {/* Fix-images progress modal */}
      {fixProgress && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-modal w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-dark text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" /> Fix All Images
              </h2>
              {fixProgress.finished && (
                <button
                  onClick={() => setFixProgress(null)}
                  className="text-muted hover:text-dark transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted">
                <span>{fixProgress.done} / {fixProgress.total} products</span>
                <span>{Math.round((fixProgress.done / fixProgress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${(fixProgress.done / fixProgress.total) * 100}%` }}
                />
              </div>
              {fixProgress.current && !fixProgress.finished && (
                <p className="text-xs text-muted truncate">Updating: {fixProgress.current}</p>
              )}
            </div>

            {fixProgress.finished ? (
              <div className="flex items-center gap-2 text-success text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                Done! {fixProgress.total - fixProgress.errors.length} images updated.
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching from Unsplash… this takes ~{Math.ceil((fixProgress.total * 1.3) / 60)} min
              </div>
            )}

            {fixProgress.errors.length > 0 && (
              <details className="text-xs text-danger">
                <summary className="cursor-pointer font-semibold">
                  {fixProgress.errors.length} failed
                </summary>
                <ul className="mt-1 space-y-0.5 list-disc list-inside opacity-80">
                  {fixProgress.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </details>
            )}

            {!fixProgress.finished && (
              <button
                onClick={() => { fixAbort.current = true; }}
                className="btn-outline text-sm py-1.5 w-full"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dark">Products</h1>
          <p className="text-muted text-sm mt-0.5">Manage your product catalogue</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fixAllImages}
            disabled={!!fixProgress && !fixProgress.finished}
            className="btn-outline flex items-center gap-2 text-sm py-2 disabled:opacity-50"
            title="Auto-assign relevant images to all products using Unsplash"
          >
            <ImageIcon className="w-4 h-4" /> Fix All Images
          </button>
          <Link href="/admin/products/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            className="input pl-10 py-2.5"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input py-2.5 w-auto pr-8"
          value={catFilter}
          onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <button
          onClick={() => fetchProducts()}
          className="btn-ghost flex items-center gap-1.5 text-sm py-2.5"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="font-semibold text-dark">No products found</p>
          <p className="text-muted text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-border">
                <tr>
                  {["Product", "Category", "Price", "Stock", "Available", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold
                                           text-muted uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => {
                  const v0 = product.variants[0];
                  return (
                    <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      {/* Product */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-accent shrink-0">
                            {product.images[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-dark text-sm line-clamp-1">{product.name}</p>
                            <div className="flex gap-1.5 mt-0.5">
                              {product.isOrganic && (
                                <span className="text-[10px] bg-green-100 text-success
                                                 font-semibold px-1.5 rounded">Organic</span>
                              )}
                              {product.isFeatured && (
                                <span className="text-[10px] bg-amber-100 text-amber-700
                                                 font-semibold px-1.5 rounded">Featured</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Category */}
                      <td className="px-5 py-4 text-muted text-sm">
                        {product.category?.name ?? "—"}
                      </td>
                      {/* Price */}
                      <td className="px-5 py-4">
                        {v0 ? (
                          <div>
                            <p className="font-bold text-dark">{formatPrice(v0.sellingPrice)}</p>
                            {v0.sellingPrice < v0.mrp && (
                              <p className="text-xs text-muted line-through">{formatPrice(v0.mrp)}</p>
                            )}
                          </div>
                        ) : "—"}
                      </td>
                      {/* Stock */}
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full
                                          ${product.stockQty === 0
                                            ? "bg-red-100 text-danger"
                                            : product.stockQty < 10
                                              ? "bg-amber-100 text-amber-700"
                                              : "bg-green-100 text-success"}`}>
                          {product.stockQty === 0 ? "Out of Stock" : `${product.stockQty} units`}
                        </span>
                      </td>
                      {/* Available toggle */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleAvailable(product._id, product.isAvailable)}
                          disabled={toggling === product._id}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full
                                      transition-colors duration-200 focus:outline-none
                                      ${product.isAvailable ? "bg-success" : "bg-gray-300"}`}
                        >
                          {toggling === product._id ? (
                            <Loader2 className="w-3 h-3 animate-spin text-white absolute left-1/2 -translate-x-1/2" />
                          ) : (
                            <span
                              className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm
                                          transform transition-transform duration-200
                                          ${product.isAvailable ? "translate-x-6" : "translate-x-1"}`}
                            />
                          )}
                        </button>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/products/${product._id}/edit`}
                            className="p-2 text-muted hover:text-primary hover:bg-accent
                                       rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => deleteProduct(product._id, product.name)}
                            disabled={deleting === product._id}
                            className="p-2 text-muted hover:text-danger hover:bg-red-50
                                       rounded-lg transition-colors disabled:opacity-40"
                            title="Delete"
                          >
                            {deleting === product._id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-gray-50 dark:bg-gray-800/50">
              <p className="text-sm text-muted">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-outline py-1.5 px-4 text-sm disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-outline py-1.5 px-4 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
