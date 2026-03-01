"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, X, Trash2, ArrowLeft, Loader2, Leaf, Star } from "lucide-react";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Variant {
  size: string;
  unit: string;
  mrp: string;
  sellingPrice: string;
  sku: string;
}

interface Category { _id: string; name: string; parentCategory: string | null; }

export interface ProductInitialData {
  _id:                string;
  name:               string;
  slug:               string;
  description:        string;
  subDescription?:    string;
  additionalInfo?:    string;
  allergyInfo?:       string;
  ingredients?:       string;
  category:           { _id: string; name: string } | null;
  subCategory?:       { _id: string; name: string } | null;
  variants:           { size: string; unit: string; mrp: number; sellingPrice: number; sku: string }[];
  stockQty:           number;
  isAvailable:        boolean;
  isOrganic:          boolean;
  isFeatured:         boolean;
  images:             string[];
  tags:               string[];
  serviceablePincodes: string[];
}

const UNITS = ["g", "kg", "ml", "L", "pcs", "dozen", "pack"];
const BLANK_VARIANT: Variant = { size: "", unit: "g", mrp: "", sellingPrice: "", sku: "" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function autoSku(name: string, size: string, unit: string) {
  return `${slugify(name).toUpperCase()}-${size.toUpperCase()}${unit.toUpperCase()}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  initialData?: ProductInitialData;
  productId?:   string;
}

export default function ProductForm({ initialData, productId }: Props) {
  const router  = useRouter();
  const isEdit  = !!productId;
  const [loading, setLoading] = useState(false);

  // ── Basic fields ─────────────────────────────────────────────────────────────
  const [name,           setName]           = useState(initialData?.name           ?? "");
  const [description,    setDescription]    = useState(initialData?.description    ?? "");
  const [subDescription, setSubDescription] = useState(initialData?.subDescription ?? "");
  const [additionalInfo, setAdditionalInfo] = useState(initialData?.additionalInfo ?? "");
  const [allergyInfo,    setAllergyInfo]    = useState(initialData?.allergyInfo    ?? "");
  const [ingredients,    setIngredients]    = useState(initialData?.ingredients    ?? "");

  // ── Category ─────────────────────────────────────────────────────────────────
  const [allCategories, setAllCategories]   = useState<Category[]>([]);
  const [catId,         setCatId]           = useState(initialData?.category?._id   ?? "");
  const [subCatId,      setSubCatId]        = useState(initialData?.subCategory?._id ?? "");
  const topCategories = allCategories.filter((c) => !c.parentCategory);
  const subCategories = allCategories.filter((c) => c.parentCategory === catId);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => { if (d.success) setAllCategories(d.data); })
      .catch(() => {});
  }, []);

  // ── Variants ──────────────────────────────────────────────────────────────────
  const [variants, setVariants] = useState<Variant[]>(
    initialData?.variants.map((v) => ({
      size: v.size, unit: v.unit,
      mrp: String(v.mrp), sellingPrice: String(v.sellingPrice), sku: v.sku,
    })) ?? [{ ...BLANK_VARIANT }]
  );

  function updateVariant(idx: number, field: keyof Variant, val: string) {
    setVariants((prev) => {
      const next = prev.map((v, i) => i === idx ? { ...v, [field]: val } : v);
      // Auto-generate SKU when size or unit changes
      if ((field === "size" || field === "unit") && name) {
        const v = next[idx];
        if (!isEdit) next[idx].sku = autoSku(name, v.size, v.unit);
      }
      return next;
    });
  }

  function addVariant() { setVariants((prev) => [...prev, { ...BLANK_VARIANT }]); }
  function removeVariant(idx: number) {
    if (variants.length === 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  }

  // ── Stock / flags ─────────────────────────────────────────────────────────────
  const [stockQty,     setStockQty]     = useState(String(initialData?.stockQty ?? 0));
  const [isAvailable,  setIsAvailable]  = useState(initialData?.isAvailable  ?? true);
  const [isOrganic,    setIsOrganic]    = useState(initialData?.isOrganic    ?? false);
  const [isFeatured,   setIsFeatured]   = useState(initialData?.isFeatured   ?? false);

  // ── Images ────────────────────────────────────────────────────────────────────
  const [images,    setImages]    = useState<string[]>(initialData?.images ?? []);
  const [imageUrl,  setImageUrl]  = useState("");

  function addImage() {
    const url = imageUrl.trim();
    if (!url) return;
    setImages((prev) => [...prev, url]);
    setImageUrl("");
  }

  // ── Tags ──────────────────────────────────────────────────────────────────────
  const [tags,    setTags]    = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t || tags.includes(t)) return;
    setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  // ── Pincodes ──────────────────────────────────────────────────────────────────
  const [pincodes,      setPincodes]      = useState<string[]>(initialData?.serviceablePincodes ?? []);
  const [pincodeInput,  setPincodeInput]  = useState("");
  const [allPincodes,   setAllPincodes]   = useState(false);

  function addPincode() {
    const p = pincodeInput.trim();
    if (!/^\d{6}$/.test(p) || pincodes.includes(p)) return;
    setPincodes((prev) => [...prev, p]);
    setPincodeInput("");
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!catId)             { toast.error("Please select a category"); return; }
    if (variants.length === 0) { toast.error("At least one variant is required"); return; }
    for (const v of variants) {
      if (!v.size || !v.unit || !v.mrp) { toast.error("All variant fields are required"); return; }
      if (Number(v.sellingPrice || v.mrp) > Number(v.mrp)) {
        toast.error("Selling price cannot exceed MRP"); return;
      }
    }

    const payload = {
      name:        name.trim(),
      description: description.trim(),
      subDescription:  subDescription  || undefined,
      additionalInfo:  additionalInfo  || undefined,
      allergyInfo:     allergyInfo     || undefined,
      ingredients:     ingredients     || undefined,
      category:    catId,
      subCategory: subCatId || undefined,
      variants:    variants.map((v) => ({
        size:         v.size,
        unit:         v.unit,
        mrp:          Number(v.mrp),
        sellingPrice: Number(v.sellingPrice || v.mrp),
        sku:          v.sku || autoSku(name, v.size, v.unit),
      })),
      stockQty:    parseInt(stockQty) || 0,
      isAvailable,
      isOrganic,
      isFeatured,
      images,
      tags,
      serviceablePincodes: allPincodes ? [] : pincodes,
    };

    setLoading(true);
    try {
      const url    = isEdit ? `/api/products/${productId}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || (isEdit ? "Update failed" : "Create failed"));
      } else {
        toast.success(isEdit ? "Product updated!" : "Product created!");
        router.push("/admin/products");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="text-muted hover:text-dark transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-dark">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h1>
          <p className="text-muted text-sm mt-0.5">
            {isEdit ? "Update the product details below" : "Fill in the details to list a new product"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Basic Info ──────────────────────────────────────────────────────── */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-dark">Basic Information</h2>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Product Name *</label>
            <input required className="input" placeholder="e.g. Organic Alphonso Mangoes" value={name}
              onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Description *</label>
            <textarea required rows={3} className="input resize-none"
              placeholder="Main marketing copy — taste, sourcing, benefits…"
              value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              Sub Description <span className="normal-case font-normal text-muted">(optional)</span>
            </label>
            <textarea rows={2} className="input resize-none"
              placeholder="Secondary descriptive blurb…"
              value={subDescription} onChange={(e) => setSubDescription(e.target.value)} />
          </div>

          {/* Category + Subcategory */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Category *</label>
              <select required className="input" value={catId}
                onChange={(e) => { setCatId(e.target.value); setSubCatId(""); }}>
                <option value="">Select category…</option>
                {topCategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                Subcategory <span className="normal-case font-normal text-muted">(optional)</span>
              </label>
              <select className="input" value={subCatId}
                onChange={(e) => setSubCatId(e.target.value)}
                disabled={!catId || subCategories.length === 0}>
                <option value="">None</option>
                {subCategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Flags */}
          <div className="flex items-center gap-6 flex-wrap pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isOrganic}
                onChange={(e) => setIsOrganic(e.target.checked)}
                className="w-4 h-4 accent-primary rounded" />
              <Leaf className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-dark">Organic</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-primary rounded" />
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-dark">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setIsAvailable((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer
                            transition-colors ${isAvailable ? "bg-success" : "bg-gray-300"}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform
                                  transition-transform ${isAvailable ? "translate-x-6" : "translate-x-1"}`} />
              </div>
              <span className="text-sm font-medium text-dark">
                {isAvailable ? "Available for sale" : "Hidden from shop"}
              </span>
            </label>
          </div>
        </div>

        {/* ── Variants ────────────────────────────────────────────────────────── */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-dark">Variants & Pricing</h2>
            <button type="button" onClick={addVariant}
              className="btn-outline text-sm py-1.5 px-3 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Variant
            </button>
          </div>

          {/* Header row */}
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted uppercase tracking-wide px-1">
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Unit</div>
            <div className="col-span-2">MRP (₹) *</div>
            <div className="col-span-2">Sale Price (₹)</div>
            <div className="col-span-3">SKU</div>
            <div className="col-span-1" />
          </div>

          {variants.map((v, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-xl p-3">
              <input required className="input py-2 text-sm col-span-2" placeholder="500"
                value={v.size} onChange={(e) => updateVariant(idx, "size", e.target.value)} />
              <select className="input py-2 text-sm col-span-2" value={v.unit}
                onChange={(e) => updateVariant(idx, "unit", e.target.value)}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <input required type="number" min="0" step="0.01"
                className="input py-2 text-sm col-span-2" placeholder="299"
                value={v.mrp} onChange={(e) => updateVariant(idx, "mrp", e.target.value)} />
              <input type="number" min="0" step="0.01"
                className="input py-2 text-sm col-span-2" placeholder="Same as MRP"
                value={v.sellingPrice} onChange={(e) => updateVariant(idx, "sellingPrice", e.target.value)} />
              <input className="input py-2 text-sm font-mono col-span-3" placeholder="auto"
                value={v.sku} onChange={(e) => updateVariant(idx, "sku", e.target.value)} />
              <button type="button" onClick={() => removeVariant(idx)}
                disabled={variants.length === 1}
                className="col-span-1 p-2 text-muted hover:text-danger transition-colors
                           disabled:opacity-30 disabled:cursor-not-allowed flex justify-center">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Stock Quantity *</label>
            <input required type="number" min="0" className="input w-40" placeholder="100"
              value={stockQty} onChange={(e) => setStockQty(e.target.value)} />
          </div>
        </div>

        {/* ── Images ──────────────────────────────────────────────────────────── */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-dark">Product Images</h2>
          <div className="flex gap-2">
            <input type="url" className="input flex-1" placeholder="https://example.com/image.jpg"
              value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImage(); } }} />
            <button type="button" onClick={addImage}
              className="btn-outline shrink-0 px-4">Add</button>
          </div>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
                    <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                  </div>
                  <button type="button" onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -top-2 -right-2 bg-danger text-white rounded-full w-5 h-5
                               flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Additional Info ──────────────────────────────────────────────────── */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-dark">Additional Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Additional Info</label>
              <textarea rows={3} className="input resize-none" placeholder="Storage, usage notes…"
                value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Ingredients</label>
              <textarea rows={3} className="input resize-none" placeholder="For packaged goods…"
                value={ingredients} onChange={(e) => setIngredients(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Allergy Info</label>
              <input className="input" placeholder="Contains: nuts, gluten, dairy…"
                value={allergyInfo} onChange={(e) => setAllergyInfo(e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Tags ────────────────────────────────────────────────────────────── */}
        <div className="card p-6 space-y-3">
          <h2 className="font-bold text-dark">Tags</h2>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Type a tag and press Enter"
              value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
            <button type="button" onClick={addTag} className="btn-outline px-4">Add</button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1.5 bg-accent text-primary text-xs
                                         font-semibold px-3 py-1.5 rounded-full">
                  #{t}
                  <button type="button" onClick={() => setTags((prev) => prev.filter((x) => x !== t))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Serviceable Pincodes ─────────────────────────────────────────────── */}
        <div className="card p-6 space-y-3">
          <h2 className="font-bold text-dark">Serviceable Pincodes</h2>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={allPincodes} onChange={(e) => setAllPincodes(e.target.checked)}
              className="w-4 h-4 accent-primary rounded" />
            <span className="text-sm font-medium text-dark">Apply to all pincodes (serviceable everywhere)</span>
          </label>
          {!allPincodes && (
            <>
              <div className="flex gap-2">
                <input className="input flex-1 font-mono" placeholder="6-digit pincode, then Enter"
                  maxLength={6} inputMode="numeric"
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPincode(); } }} />
                <button type="button" onClick={addPincode} className="btn-outline px-4">Add</button>
              </div>
              {pincodes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pincodes.map((p) => (
                    <span key={p} className="flex items-center gap-1.5 bg-gray-100 text-dark text-xs
                                             font-mono font-semibold px-3 py-1.5 rounded-full">
                      {p}
                      <button type="button" onClick={() => setPincodes((prev) => prev.filter((x) => x !== p))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Submit ──────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 pb-8">
          <button type="submit" disabled={loading}
            className="btn-primary flex items-center gap-2 px-8">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {isEdit ? "Saving…" : "Creating…"}</>
              : (isEdit ? "Save Changes" : "Create Product")}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-ghost">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
