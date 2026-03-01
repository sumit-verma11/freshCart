"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Edit2, Trash2, Loader2, RefreshCw, MapPin, X, Check,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PincodeDoc {
  _id: string;
  pincode: string;
  area: string;
  city: string;
  state: string;
  isServiceable: boolean;
  estimatedDeliveryHours: { min: number; max: number };
}

const BLANK_FORM = {
  pincode: "", area: "", city: "", state: "", isServiceable: true,
  minHours: 2, maxHours: 4,
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PincodesPage() {
  const [pincodes,  setPincodes]  = useState<PincodeDoc[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);
  const [totalPages,setTotalPages]= useState(1);

  // Form state
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [form,      setForm]      = useState({ ...BLANK_FORM });

  const fetchPincodes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    try {
      const res  = await fetch(`/api/admin/pincodes?${params}`);
      const data = await res.json();
      if (data.success) {
        setPincodes(data.data);
        setTotalPages(data.pagination?.totalPages ?? 1);
      }
    } catch {
      toast.error("Failed to load pincodes");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchPincodes(); }, [fetchPincodes]);

  // Debounce search → reset page
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(t);
  }, [search]);

  function openAddForm() {
    setEditId(null);
    setForm({ ...BLANK_FORM });
    setShowForm(true);
  }

  function openEditForm(doc: PincodeDoc) {
    setEditId(doc._id);
    setForm({
      pincode:      doc.pincode,
      area:         doc.area,
      city:         doc.city,
      state:        doc.state,
      isServiceable:doc.isServiceable,
      minHours:     doc.estimatedDeliveryHours.min,
      maxHours:     doc.estimatedDeliveryHours.max,
    });
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditId(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(form.pincode)) { toast.error("Pincode must be exactly 6 digits"); return; }
    if (!form.area.trim() || !form.city.trim() || !form.state.trim()) {
      toast.error("Area, city and state are required");
      return;
    }
    if (form.minHours > form.maxHours) { toast.error("Min hours must be ≤ max hours"); return; }

    setSaving(true);
    try {
      const payload = {
        pincode:      form.pincode,
        area:         form.area.trim(),
        city:         form.city.trim(),
        state:        form.state.trim(),
        isServiceable:form.isServiceable,
        estimatedDeliveryHours: { min: form.minHours, max: form.maxHours },
        ...(editId ? { id: editId } : {}),
      };

      const res  = await fetch("/api/admin/pincodes", {
        method:  editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || (editId ? "Update failed" : "Create failed"));
      } else {
        toast.success(editId ? "Pincode updated!" : "Pincode added!");
        closeForm();
        fetchPincodes();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, code: string) {
    if (!confirm(`Delete pincode ${code}?`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/pincodes?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Pincode deleted");
        setPincodes((prev) => prev.filter((p) => p._id !== id));
      } else {
        toast.error("Delete failed");
      }
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dark">Pincodes</h1>
          <p className="text-muted text-sm mt-0.5">Manage delivery serviceable areas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchPincodes()}
            className="btn-ghost flex items-center gap-1.5 text-sm py-2.5">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={openAddForm} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Pincode
          </button>
        </div>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-dark">{editId ? "Edit Pincode" : "Add New Pincode"}</h2>
            <button onClick={closeForm} className="text-muted hover:text-dark transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Pincode *</label>
                <input required maxLength={6} inputMode="numeric" className="input font-mono"
                  placeholder="6-digit code"
                  value={form.pincode}
                  onChange={(e) => setForm((p) => ({
                    ...p, pincode: e.target.value.replace(/\D/g, "").slice(0, 6)
                  }))}
                  disabled={!!editId}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Area *</label>
                <input required className="input" placeholder="e.g. Baner"
                  value={form.area}
                  onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">City *</label>
                <input required className="input" placeholder="e.g. Pune"
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">State *</label>
                <input required className="input" placeholder="e.g. Maharashtra"
                  value={form.state}
                  onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} />
              </div>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isServiceable}
                  onChange={(e) => setForm((p) => ({ ...p, isServiceable: e.target.checked }))}
                  className="w-4 h-4 accent-primary" />
                <span className="text-sm font-medium text-dark">Serviceable</span>
              </label>
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Min Hours</label>
                  <input type="number" min="0" className="input w-24 py-1.5 text-sm"
                    value={form.minHours}
                    onChange={(e) => setForm((p) => ({ ...p, minHours: Number(e.target.value) }))} />
                </div>
                <span className="text-muted mt-4">–</span>
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Max Hours</label>
                  <input type="number" min="0" className="input w-24 py-1.5 text-sm"
                    value={form.maxHours}
                    onChange={(e) => setForm((p) => ({ ...p, maxHours: Number(e.target.value) }))} />
                </div>
                <span className="text-xs text-muted mt-5">hrs delivery</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><Check className="w-4 h-4" /> {editId ? "Save Changes" : "Add Pincode"}</>}
              </button>
              <button type="button" onClick={closeForm} className="btn-ghost">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input className="input pl-10 py-2.5" placeholder="Search pincode, area or city…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : pincodes.length === 0 ? (
        <div className="card p-12 text-center">
          <MapPin className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="font-semibold text-dark">No pincodes found</p>
          <p className="text-muted text-sm mt-1">
            {search ? "Try a different search" : "Add your first serviceable pincode"}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  {["Pincode", "Area", "City", "State", "Delivery", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold
                                           text-muted uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pincodes.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-dark">{doc.pincode}</td>
                    <td className="px-5 py-4 text-dark">{doc.area}</td>
                    <td className="px-5 py-4 text-muted">{doc.city}</td>
                    <td className="px-5 py-4 text-muted">{doc.state}</td>
                    <td className="px-5 py-4 text-muted whitespace-nowrap">
                      {doc.estimatedDeliveryHours.min}–{doc.estimatedDeliveryHours.max}h
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                                        ${doc.isServiceable
                                          ? "bg-green-100 text-success"
                                          : "bg-gray-100 text-muted"}`}>
                        {doc.isServiceable ? "Serviceable" : "Not Serviceable"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditForm(doc)}
                          className="p-2 text-muted hover:text-primary hover:bg-accent
                                     rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(doc._id, doc.pincode)}
                          disabled={deleting === doc._id}
                          className="p-2 text-muted hover:text-danger hover:bg-red-50
                                     rounded-lg transition-colors disabled:opacity-40" title="Delete">
                          {deleting === doc._id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-gray-50">
              <p className="text-sm text-muted">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-outline py-1.5 px-4 text-sm disabled:opacity-40">Prev</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="btn-outline py-1.5 px-4 text-sm disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
