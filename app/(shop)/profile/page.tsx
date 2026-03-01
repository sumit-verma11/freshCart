"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User, Phone, MapPin, Lock, Plus, Trash2, CheckCircle,
  Loader2, Edit2, X, Home, Briefcase, MoreHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Address {
  _id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  addresses: Address[];
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const LABEL_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Home:  Home,
  Work:  Briefcase,
  Other: MoreHorizontal,
};

const BLANK_ADDR = { label: "Home", street: "", city: "", state: "", pincode: "" };

// ─── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: {
  title: string;
  icon: React.FC<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h2 className="font-bold text-dark">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile,    setProfile]    = useState<UserProfile | null>(null);
  const [loading,    setLoading]    = useState(true);

  // Personal info
  const [name,       setName]       = useState("");
  const [phone,      setPhone]      = useState("");
  const [infoSaving, setInfoSaving] = useState(false);

  // Address form
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrForm,     setAddrForm]     = useState({ ...BLANK_ADDR });
  const [addrSaving,   setAddrSaving]   = useState(false);
  const [addrDeleting, setAddrDeleting] = useState<string | null>(null);

  // Password
  const [pwForm,    setPwForm]    = useState({ current: "", next: "", confirm: "" });
  const [pwSaving,  setPwSaving]  = useState(false);

  // ── Load profile ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;

    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setProfile(d.data);
          setName(d.data.name ?? "");
          setPhone(d.data.phone ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, [status, router]);

  // ── Save personal info ──────────────────────────────────────────────────────

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name is required"); return; }
    setInfoSaving(true);
    try {
      const res  = await fetch("/api/user/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: name.trim(), phone: phone.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Update failed"); return; }
      setProfile(data.data);
      toast.success("Profile updated!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setInfoSaving(false);
    }
  }

  // ── Address helpers ─────────────────────────────────────────────────────────

  async function patchAddresses(addresses: Omit<Address, "_id">[]) {
    const res  = await fetch("/api/user/profile", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ addresses }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    setProfile(data.data);
    return data.data as UserProfile;
  }

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    const { label, street, city, state, pincode } = addrForm;
    if (!street.trim() || !city.trim() || !state.trim()) {
      toast.error("Street, city and state are required");
      return;
    }
    if (!/^\d{6}$/.test(pincode)) { toast.error("Pincode must be 6 digits"); return; }

    setAddrSaving(true);
    try {
      const current  = profile?.addresses ?? [];
      const newAddrs = [
        ...current.map((a) => ({ ...a, isDefault: false })),
        { label, street: street.trim(), city: city.trim(), state: state.trim(), pincode, isDefault: current.length === 0 },
      ];
      await patchAddresses(newAddrs);
      setAddrForm({ ...BLANK_ADDR });
      setShowAddrForm(false);
      toast.success("Address added!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add address");
    } finally {
      setAddrSaving(false);
    }
  }

  async function deleteAddress(id: string) {
    if (!confirm("Remove this address?")) return;
    setAddrDeleting(id);
    try {
      const remaining = (profile?.addresses ?? []).filter((a) => a._id !== id);
      // If we deleted the default, make the first one default
      if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
        remaining[0].isDefault = true;
      }
      await patchAddresses(remaining);
      toast.success("Address removed");
    } catch {
      toast.error("Failed to remove address");
    } finally {
      setAddrDeleting(null);
    }
  }

  async function setDefaultAddress(id: string) {
    try {
      const updated = (profile?.addresses ?? []).map((a) => ({ ...a, isDefault: a._id === id }));
      await patchAddresses(updated);
      toast.success("Default address updated");
    } catch {
      toast.error("Failed to update default");
    }
  }

  // ── Change password ─────────────────────────────────────────────────────────

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      toast.error("All fields are required");
      return;
    }
    if (pwForm.next.length < 6) { toast.error("New password must be ≥ 6 characters"); return; }
    if (pwForm.next !== pwForm.confirm) { toast.error("Passwords do not match"); return; }

    setPwSaving(true);
    try {
      const res  = await fetch("/api/user/password", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Password change failed"); return; }
      toast.success("Password changed successfully!");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch {
      toast.error("Something went wrong");
    } finally {
      setPwSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading || status === "loading") {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const addresses = profile?.addresses ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Page header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-2xl font-extrabold text-primary">
            {session?.user.name?.[0]?.toUpperCase() ?? "U"}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark">{session?.user.name}</h1>
          <p className="text-muted text-sm">{session?.user.email}</p>
        </div>
      </div>

      {/* ── Personal Info ─────────────────────────────────────────────── */}
      <Section title="Personal Information" icon={User}>
        <form onSubmit={saveInfo} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                Full Name *
              </label>
              <input required className="input" placeholder="Your name"
                value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Phone Number
                </span>
              </label>
              <input
                className="input"
                placeholder="10-digit mobile"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              Email Address
            </label>
            <input disabled className="input opacity-60 cursor-not-allowed"
              value={profile?.email ?? session?.user.email ?? ""} />
            <p className="text-xs text-muted mt-1">Email cannot be changed</p>
          </div>
          <button type="submit" disabled={infoSaving}
            className="btn-primary flex items-center gap-2">
            {infoSaving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : "Save Changes"}
          </button>
        </form>
      </Section>

      {/* ── Addresses ─────────────────────────────────────────────────── */}
      <Section title="Saved Addresses" icon={MapPin}>
        {addresses.length === 0 && !showAddrForm && (
          <p className="text-muted text-sm mb-4">No addresses saved yet.</p>
        )}

        <div className="space-y-3 mb-4">
          {addresses.map((addr) => {
            const LabelIcon = LABEL_ICONS[addr.label] ?? MoreHorizontal;
            return (
              <div key={addr._id}
                className={`relative p-4 rounded-xl border transition-colors
                             ${addr.isDefault
                               ? "border-primary bg-primary/5"
                               : "border-border bg-gray-50/50"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                                     ${addr.isDefault ? "bg-primary text-white" : "bg-accent text-muted"}`}>
                      <LabelIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-dark">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-primary text-white font-bold
                                           px-2 py-0.5 rounded-full">Default</span>
                        )}
                      </div>
                      <p className="text-sm text-muted mt-0.5">{addr.street}</p>
                      <p className="text-xs text-muted">
                        {addr.city}, {addr.state} — {addr.pincode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!addr.isDefault && (
                      <button
                        onClick={() => setDefaultAddress(addr._id)}
                        className="text-xs text-primary font-semibold px-2.5 py-1
                                   rounded-lg hover:bg-accent transition-colors"
                        title="Set as default"
                      >
                        Set default
                      </button>
                    )}
                    <button
                      onClick={() => deleteAddress(addr._id)}
                      disabled={addrDeleting === addr._id}
                      className="p-1.5 text-muted hover:text-danger hover:bg-red-50
                                 rounded-lg transition-colors disabled:opacity-40"
                      title="Remove"
                    >
                      {addrDeleting === addr._id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add address form */}
        {showAddrForm ? (
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-dark text-sm">New Address</p>
              <button onClick={() => setShowAddrForm(false)}
                className="text-muted hover:text-dark transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={addAddress} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Label</label>
                <div className="flex gap-2">
                  {["Home", "Work", "Other"].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddrForm((p) => ({ ...p, label: lbl }))}
                      className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-colors
                                  ${addrForm.label === lbl
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-border text-muted hover:border-primary/40"}`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Street *</label>
                <input required className="input" placeholder="House/flat no., street name"
                  value={addrForm.street}
                  onChange={(e) => setAddrForm((p) => ({ ...p, street: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">City *</label>
                  <input required className="input" placeholder="City"
                    value={addrForm.city}
                    onChange={(e) => setAddrForm((p) => ({ ...p, city: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">State *</label>
                  <input required className="input" placeholder="State"
                    value={addrForm.state}
                    onChange={(e) => setAddrForm((p) => ({ ...p, state: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Pincode *</label>
                <input required maxLength={6} inputMode="numeric" className="input w-36 font-mono"
                  placeholder="6-digit"
                  value={addrForm.pincode}
                  onChange={(e) => setAddrForm((p) => ({
                    ...p, pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                  }))} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={addrSaving}
                  className="btn-primary flex items-center gap-2 text-sm">
                  {addrSaving
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding…</>
                    : <><CheckCircle className="w-3.5 h-3.5" /> Save Address</>}
                </button>
                <button type="button" onClick={() => setShowAddrForm(false)} className="btn-ghost text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setShowAddrForm(true)}
            className="flex items-center gap-2 text-sm font-semibold text-primary
                       border-2 border-dashed border-primary/30 rounded-xl px-4 py-3 w-full
                       hover:border-primary/60 hover:bg-primary/5 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add New Address
          </button>
        )}
      </Section>

      {/* ── Change Password ───────────────────────────────────────────── */}
      <Section title="Change Password" icon={Lock}>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              Current Password
            </label>
            <input
              required
              type="password"
              className="input"
              placeholder="••••••••"
              value={pwForm.current}
              onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                New Password
              </label>
              <input
                required
                type="password"
                className="input"
                placeholder="Min 6 characters"
                value={pwForm.next}
                onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                Confirm New Password
              </label>
              <input
                required
                type="password"
                className="input"
                placeholder="Repeat password"
                value={pwForm.confirm}
                onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
              />
            </div>
          </div>
          {pwForm.next && pwForm.confirm && pwForm.next !== pwForm.confirm && (
            <p className="text-xs text-danger flex items-center gap-1">
              <X className="w-3 h-3" /> Passwords do not match
            </p>
          )}
          <button type="submit" disabled={pwSaving}
            className="btn-primary flex items-center gap-2">
            {pwSaving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
              : <><Lock className="w-4 h-4" /> Update Password</>}
          </button>
        </form>
      </Section>
    </div>
  );
}
