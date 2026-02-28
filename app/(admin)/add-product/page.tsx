"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Upload, X, Leaf } from "lucide-react";
import toast from "react-hot-toast";
import { ProductCategory } from "@/types";

const CATEGORIES: ProductCategory[] = [
  "Fruits & Vegetables",
  "Dairy & Eggs",
  "Bakery",
  "Beverages",
  "Snacks",
  "Meat & Seafood",
];

interface FormData {
  name: string;
  description: string;
  category: ProductCategory | "";
  price: string;
  salePrice: string;
  unit: string;
  stock: string;
  images: string[];
  tags: string;
  isOrganic: boolean;
  isFeatured: boolean;
  serviceablePincodes: string;
}

const INITIAL: FormData = {
  name: "", description: "", category: "",
  price: "", salePrice: "", unit: "",
  stock: "0", images: [], tags: "",
  isOrganic: false, isFeatured: false,
  serviceablePincodes: "",
};

export default function AddProductPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  function addImage() {
    if (!imageUrl.trim()) return;
    setForm((f) => ({ ...f, images: [...f.images, imageUrl.trim()] }));
    setImageUrl("");
  }

  function removeImage(idx: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category) {
      toast.error("Please select a category");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          price: parseFloat(form.price),
          salePrice: form.salePrice ? parseFloat(form.salePrice) : undefined,
          unit: form.unit,
          stock: parseInt(form.stock) || 0,
          images: form.images,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          isOrganic: form.isOrganic,
          isFeatured: form.isFeatured,
          serviceablePincodes: form.serviceablePincodes
            .split(",").map((p) => p.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create product");
      } else {
        toast.success("Product created successfully!");
        setForm(INITIAL);
        router.push("/dashboard");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-dark mb-2">Add New Product</h1>
      <p className="text-muted text-sm mb-8">Fill in the details below to add a product to FreshCart.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-dark">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Product Name *</label>
            <input
              required
              className="input"
              placeholder="e.g. Organic Alphonso Mangoes"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Description *</label>
            <textarea
              required
              rows={3}
              className="input resize-none"
              placeholder="Describe the product — taste, sourcing, benefits..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Category *</label>
              <select
                required
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ProductCategory })}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Unit *</label>
              <input
                required
                className="input"
                placeholder="e.g. 500g, 1L, 6 pcs"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-dark">Pricing & Stock</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">MRP (₹) *</label>
              <input
                required
                type="number"
                min="0"
                className="input"
                placeholder="299"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Sale Price (₹)</label>
              <input
                type="number"
                min="0"
                className="input"
                placeholder="249 (optional)"
                value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Stock Qty *</label>
              <input
                required
                type="number"
                min="0"
                className="input"
                placeholder="100"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-dark">Product Images</h2>
          <div className="flex gap-2">
            <input
              type="url"
              className="input"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImage())}
            />
            <button
              type="button"
              onClick={addImage}
              className="btn-outline shrink-0 flex items-center gap-2 px-4 py-3"
            >
              <Upload className="w-4 h-4" /> Add
            </button>
          </div>
          {form.images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.images.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt="" className="w-20 h-20 object-cover rounded-xl border border-border" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 bg-danger text-white rounded-full w-5 h-5
                               flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags & Options */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-dark">Tags & Options</h2>
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Tags (comma-separated)</label>
            <input
              className="input"
              placeholder="mango, fruit, seasonal, organic"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">
              Serviceable Pincodes (comma-separated)
            </label>
            <input
              className="input"
              placeholder="400001, 560001, 110001"
              value={form.serviceablePincodes}
              onChange={(e) => setForm({ ...form, serviceablePincodes: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isOrganic}
                onChange={(e) => setForm({ ...form, isOrganic: e.target.checked })}
                className="w-4 h-4 accent-primary rounded"
              />
              <Leaf className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-dark">Mark as Organic</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="w-4 h-4 accent-primary rounded"
              />
              <span className="text-sm font-medium text-dark">Mark as Featured</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><PlusCircle className="w-4 h-4" /> Create Product</>
            )}
          </button>
          <button
            type="button"
            onClick={() => setForm(INITIAL)}
            className="btn-ghost"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
