"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Loader2, Tag, ChevronRight, X, Check } from "lucide-react";
import toast from "react-hot-toast";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  parentCategory: { _id: string; name: string; slug: string } | null;
}

const BLANK_FORM = {
  name: "", slug: "", image: "", description: "", parentCategory: "", isActive: true, sortOrder: 0,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState<string | null>(null);

  // Form state
  const [showForm,   setShowForm]   = useState(false);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [form,       setForm]       = useState({ ...BLANK_FORM });

  const topCategories = categories.filter((c) => !c.parentCategory);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  function openAddForm() {
    setEditId(null);
    setForm({ ...BLANK_FORM });
    setShowForm(true);
  }

  function openEditForm(cat: Category) {
    setEditId(cat._id);
    setForm({
      name:           cat.name,
      slug:           cat.slug,
      image:          cat.image ?? "",
      description:    cat.description ?? "",
      parentCategory: cat.parentCategory?._id ?? "",
      isActive:       cat.isActive,
      sortOrder:      cat.sortOrder,
    });
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditId(null); }

  // Auto-generate slug from name when adding (not editing)
  function handleNameChange(val: string) {
    setForm((prev) => ({
      ...prev,
      name: val,
      slug: editId ? prev.slug : val.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }

    setSaving(true);
    try {
      const payload = {
        name:           form.name.trim(),
        slug:           form.slug.trim() || undefined,
        image:          form.image.trim() || undefined,
        description:    form.description.trim() || undefined,
        parentCategory: form.parentCategory || null,
        isActive:       form.isActive,
        sortOrder:      Number(form.sortOrder),
        ...(editId ? { id: editId } : {}),
      };

      const res  = await fetch("/api/admin/categories", {
        method:  editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || (editId ? "Update failed" : "Create failed"));
      } else {
        toast.success(editId ? "Category updated!" : "Category created!");
        closeForm();
        fetchCategories();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? Products in this category will lose their category.`)) return;
    setDeleting(id);
    try {
      const res  = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Delete failed");
      } else {
        toast.success("Category deleted");
        setCategories((prev) => prev.filter((c) => c._id !== id));
      }
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  // Group subcategories under their parents
  const grouped = topCategories.map((parent) => ({
    parent,
    children: categories.filter((c) => c.parentCategory?._id === parent._id),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dark">Categories</h1>
          <p className="text-muted text-sm mt-0.5">Manage product categories and subcategories</p>
        </div>
        <button onClick={openAddForm} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Form card */}
      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-dark">{editId ? "Edit Category" : "New Category"}</h2>
            <button onClick={closeForm} className="text-muted hover:text-dark transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Name *</label>
                <input required className="input" placeholder="e.g. Fresh Fruits"
                  value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Slug</label>
                <input className="input font-mono text-sm" placeholder="auto-generated"
                  value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Parent Category</label>
                <select className="input" value={form.parentCategory}
                  onChange={(e) => setForm((p) => ({ ...p, parentCategory: e.target.value }))}>
                  <option value="">None (top-level)</option>
                  {topCategories
                    .filter((c) => c._id !== editId)
                    .map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Image URL</label>
                <input type="url" className="input" placeholder="https://…"
                  value={form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Description</label>
                <input className="input" placeholder="Short description…"
                  value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                    className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-medium text-dark">Active</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-muted uppercase tracking-wide">Sort Order</label>
                  <input type="number" min="0" className="input w-20 py-1.5 text-sm"
                    value={form.sortOrder}
                    onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><Check className="w-4 h-4" /> {editId ? "Save Changes" : "Create Category"}</>}
              </button>
              <button type="button" onClick={closeForm} className="btn-ghost">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Category list */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="card p-12 text-center">
          <Tag className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="font-semibold text-dark">No categories yet</p>
          <p className="text-muted text-sm mt-1">Add your first category to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ parent, children }) => (
            <div key={parent._id} className="card overflow-hidden">
              {/* Parent row */}
              <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-dark">{parent.name}</p>
                    <p className="text-xs text-muted font-mono">{parent.slug}</p>
                  </div>
                  {!parent.isActive && (
                    <span className="text-xs bg-gray-200 text-muted font-semibold px-2 py-0.5 rounded-full">Inactive</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">{children.length} sub</span>
                  <button onClick={() => openEditForm(parent)}
                    className="p-2 text-muted hover:text-primary hover:bg-accent rounded-lg transition-colors"
                    title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(parent._id, parent.name)}
                    disabled={deleting === parent._id}
                    className="p-2 text-muted hover:text-danger hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                    title="Delete">
                    {deleting === parent._id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Children rows */}
              {children.map((child) => (
                <div key={child._id} className="flex items-center justify-between px-5 py-3.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-3 pl-8">
                    <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-dark">{child.name}</p>
                      <p className="text-xs text-muted font-mono">{child.slug}</p>
                    </div>
                    {!child.isActive && (
                      <span className="text-xs bg-gray-200 text-muted font-semibold px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditForm(child)}
                      className="p-2 text-muted hover:text-primary hover:bg-accent rounded-lg transition-colors"
                      title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(child._id, child.name)}
                      disabled={deleting === child._id}
                      className="p-2 text-muted hover:text-danger hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      title="Delete">
                      {deleting === child._id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Orphan subcategories (parent was deleted) */}
          {categories
            .filter((c) => c.parentCategory && !topCategories.find((p) => p._id === c.parentCategory?._id))
            .map((orphan) => (
              <div key={orphan._id} className="card px-5 py-4 flex items-center justify-between border-amber-200">
                <div>
                  <p className="text-sm font-medium text-dark">{orphan.name}</p>
                  <p className="text-xs text-amber-600">Orphan subcategory</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditForm(orphan)}
                    className="p-2 text-muted hover:text-primary hover:bg-accent rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(orphan._id, orphan.name)}
                    disabled={deleting === orphan._id}
                    className="p-2 text-muted hover:text-danger hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40">
                    {deleting === orphan._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
