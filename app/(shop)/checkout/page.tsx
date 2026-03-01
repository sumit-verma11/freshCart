"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  MapPin, CreditCard, ClipboardList, CheckCircle2,
  ArrowRight, ArrowLeft, Plus, Truck, Loader2,
  CheckCircle, XCircle, Lock, Home, Briefcase,
} from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "address" | "summary" | "payment" | "confirmation";

interface AddressForm {
  name:     string;
  phone:    string;
  street:   string;
  landmark: string;
  city:     string;
  state:    string;
  pincode:  string;
}

interface SavedAddress {
  _id:       string;
  label:     string;
  street:    string;
  city:      string;
  state:     string;
  pincode:   string;
  isDefault: boolean;
}

interface PincodeResult {
  serviceable:       boolean;
  area?:             string;
  city?:             string;
  state?:            string;
  estimatedDelivery?: { min: number; max: number };
}

interface PlacedOrder {
  orderNumber:       string;
  grandTotal:        number;
  totalMRP:          number;
  totalDiscount:     number;
  deliveryCharge:    number;
  estimatedDelivery: { minHours: number; maxHours: number };
  items:             { name: string; qty: number; price: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDelivery(est: { min: number; max: number } | { minHours: number; maxHours: number }): string {
  const min = "min" in est ? est.min : est.minHours;
  const max = "max" in est ? est.max : est.maxHours;
  if (max <= 24) return `Today, ${min}–${max} hours`;
  return "Delivered by Tomorrow";
}

const LABEL_ICONS: Record<string, React.ReactNode> = {
  Home:  <Home      className="w-4 h-4" />,
  Work:  <Briefcase className="w-4 h-4" />,
  Other: <MapPin    className="w-4 h-4" />,
};

// ─── Stepper ──────────────────────────────────────────────────────────────────

const STEPS: { key: Step; label: string }[] = [
  { key: "address",      label: "Address"      },
  { key: "summary",      label: "Order Summary" },
  { key: "payment",      label: "Payment"       },
  { key: "confirmation", label: "Confirmation"  },
];

function Stepper({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center mb-10 overflow-x-auto pb-1">
      {STEPS.map((s, idx) => {
        const done   = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={s.key} className="flex items-center shrink-0">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                            transition-all shrink-0
                            ${done   ? "bg-success text-white"
                            : active ? "bg-primary text-white shadow-md shadow-primary/30"
                                     : "bg-gray-100 text-muted"}`}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className={`text-sm font-semibold whitespace-nowrap
                            ${active ? "text-dark" : done ? "text-success" : "text-muted"}`}
              >
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`mx-3 h-0.5 w-8 sm:w-12 transition-all shrink-0
                            ${done ? "bg-success" : "bg-border"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Sidebar summary ──────────────────────────────────────────────────────────

function OrderSummaryCard({
  sub, mrpTotal, discount, delivery, tot,
}: {
  sub: number; mrpTotal: number; discount: number; delivery: number; tot: number;
}) {
  return (
    <div className="card p-5 sticky top-24">
      <h3 className="font-bold text-dark mb-4">Order Summary</h3>
      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between text-muted">
          <span>MRP Total</span>
          <span className="text-dark font-medium">{formatPrice(mrpTotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-success">
            <span>Discount</span>
            <span className="font-semibold">− {formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted">
          <span>Delivery</span>
          <span className={delivery === 0 ? "text-success font-semibold" : "text-dark font-medium"}>
            {delivery === 0 ? "FREE" : formatPrice(delivery)}
          </span>
        </div>
        <hr className="border-border" />
        <div className="flex justify-between font-bold text-dark text-base">
          <span>Grand Total</span>
          <span className="text-primary">{formatPrice(tot)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 text-xs text-muted">
        <Truck className="w-4 h-4 text-primary" />
        Free delivery on orders above ₹499
      </div>
      {sub < 499 && sub > 0 && (
        <p className="text-xs text-muted bg-amber-50 border border-amber-100
                      rounded-xl px-3 py-2 mt-3">
          Add <span className="font-semibold">{formatPrice(499 - sub)}</span> more for free delivery
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, subtotal, deliveryCharge, total, clearCart } = useCartStore();

  const [hydrated,      setHydrated]      = useState(false);
  const [step,          setStep]          = useState<Step>("address");
  const [loading,       setLoading]       = useState(false);

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null);
  const [showNewForm,    setShowNewForm]    = useState(false);

  // New address form
  const [form, setForm] = useState<AddressForm>({
    name:     "",
    phone:    "",
    street:   "",
    landmark: "",
    city:     "",
    state:    "",
    pincode:  "",
  });

  // Pincode validation
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeResult,  setPincodeResult]  = useState<PincodeResult | null>(null);

  // Active delivery address snapshot (for order placement + confirmation)
  const [deliverySnapshot, setDeliverySnapshot] = useState<{
    name: string; phone: string; street: string; city: string; state: string; pincode: string;
  } | null>(null);

  // Placed order data (for confirmation step)
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);

  // ── On mount ────────────────────────────────────────────────────────────────

  useEffect(() => {
    setHydrated(true);
    if (status === "unauthenticated") router.push("/login?callbackUrl=/checkout");
  }, [status, router]);

  // Pre-fill name/phone from session
  useEffect(() => {
    if (session?.user?.name) {
      setForm((f) => ({ ...f, name: f.name || session.user.name }));
    }
  }, [session]);

  // Fetch saved addresses
  const fetchAddresses = useCallback(async () => {
    if (!session) return;
    try {
      const res  = await fetch("/api/users/me/addresses");
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setSavedAddresses(data.data);
        // Auto-select default
        const def = data.data.find((a: SavedAddress) => a.isDefault) ?? data.data[0];
        setSelectedAddrId(def._id);
      } else {
        setShowNewForm(true);
      }
    } catch {
      setShowNewForm(true);
    }
  }, [session]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  // ── Pincode check on blur ────────────────────────────────────────────────────

  async function checkPincode(pin: string) {
    if (!/^\d{6}$/.test(pin)) return;
    setPincodeLoading(true);
    setPincodeResult(null);
    try {
      const res  = await fetch(`/api/pincode/check?pincode=${pin}`);
      const data = await res.json();
      if (data.success) {
        setPincodeResult(data.data);
        if (data.data.city && !form.city) setForm((f) => ({ ...f, city: data.data.city }));
        if (data.data.state && !form.state) setForm((f) => ({ ...f, state: data.data.state }));
      }
    } catch {
      // silent
    } finally {
      setPincodeLoading(false);
    }
  }

  // Also check pincode when selecting a saved address
  async function checkSavedAddressPincode(addr: SavedAddress) {
    setPincodeLoading(true);
    setPincodeResult(null);
    try {
      const res  = await fetch(`/api/pincode/check?pincode=${addr.pincode}`);
      const data = await res.json();
      if (data.success) setPincodeResult(data.data);
    } catch {
      // silent
    } finally {
      setPincodeLoading(false);
    }
  }

  // ── Address step → next ──────────────────────────────────────────────────────

  function handleAddressNext() {
    if (showNewForm || savedAddresses.length === 0) {
      // Validate new form
      if (!form.name || !form.street || !form.city || !form.state || !form.pincode) {
        toast.error("Please fill in all required fields");
        return;
      }
      if (!/^\d{6}$/.test(form.pincode)) {
        toast.error("Enter a valid 6-digit pincode");
        return;
      }
      if (pincodeResult && !pincodeResult.serviceable) {
        toast.error("Delivery is not available at this pincode");
        return;
      }
      const fullStreet = form.street + (form.landmark ? `, near ${form.landmark}` : "");
      setDeliverySnapshot({
        name: form.name, phone: form.phone,
        street: fullStreet, city: form.city, state: form.state, pincode: form.pincode,
      });
    } else {
      const addr = savedAddresses.find((a) => a._id === selectedAddrId);
      if (!addr) { toast.error("Please select a delivery address"); return; }
      setDeliverySnapshot({
        name: session?.user?.name ?? "", phone: "",
        street: addr.street, city: addr.city, state: addr.state, pincode: addr.pincode,
      });
    }
    setStep("summary");
  }

  // ── Place order ──────────────────────────────────────────────────────────────

  async function placeOrder() {
    if (!deliverySnapshot) return;
    setLoading(true);
    try {
      const estimatedDelivery = pincodeResult?.estimatedDelivery
        ? { minHours: pincodeResult.estimatedDelivery.min, maxHours: pincodeResult.estimatedDelivery.max }
        : { minHours: 2, maxHours: 4 };

      const res = await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId:  i.productId,
            variantSku: i.variantSku,
            qty:        i.quantity,
          })),
          deliveryAddress: {
            street:  deliverySnapshot.street,
            city:    deliverySnapshot.city,
            state:   deliverySnapshot.state,
            pincode: deliverySnapshot.pincode,
          },
          estimatedDelivery,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to place order. Please try again.");
        return;
      }

      // Build placed order snapshot for confirmation screen
      setPlacedOrder({
        orderNumber:       data.data.orderNumber,
        grandTotal:        data.data.grandTotal,
        totalMRP:          data.data.totalMRP,
        totalDiscount:     data.data.totalDiscount,
        deliveryCharge:    data.data.deliveryCharge,
        estimatedDelivery: data.data.estimatedDelivery,
        items:             data.data.items.map((i: { name: string; qty: number; price: number }) => ({
          name: i.name, qty: i.qty, price: i.price,
        })),
      });

      clearCart();
      toast.success("Order placed successfully! 🎉");
      setStep("confirmation");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Guards ───────────────────────────────────────────────────────────────────

  if (!hydrated || status === "loading") {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0 && step !== "confirmation") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-7xl mb-4">🛒</div>
        <p className="text-2xl font-bold text-dark mb-4">Your cart is empty</p>
        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          Shop Now <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const sub      = subtotal();
  const delivery = deliveryCharge();
  const tot      = total();
  const mrpTotal = items.reduce((s, i) => s + i.mrp * i.quantity, 0);
  const discount = Math.max(0, mrpTotal - sub);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-dark mb-8">Checkout</h1>

      <Stepper current={step} />

      <div className="grid lg:grid-cols-3 gap-8 items-start">

        {/* ── Main content ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* ═══════════════════════════════ STEP 1: ADDRESS ═══════════════════ */}
          {step === "address" && (
            <div className="card p-6">
              <h2 className="font-bold text-dark text-lg mb-5 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Delivery Address
              </h2>

              {/* Saved address cards */}
              {savedAddresses.length > 0 && !showNewForm && (
                <div className="space-y-3 mb-5">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr._id}
                      onClick={() => {
                        setSelectedAddrId(addr._id);
                        setPincodeResult(null);
                        checkSavedAddressPincode(addr);
                      }}
                      className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer
                                  transition-all
                                  ${selectedAddrId === addr._id
                                    ? "border-primary bg-accent"
                                    : "border-border hover:border-primary/40"}`}
                    >
                      <input
                        type="radio"
                        name="savedAddr"
                        checked={selectedAddrId === addr._id}
                        onChange={() => {}}
                        className="mt-0.5 accent-primary shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-primary">
                            {LABEL_ICONS[addr.label] ?? <MapPin className="w-4 h-4" />}
                          </span>
                          <span className="font-semibold text-dark text-sm">{addr.label}</span>
                          {addr.isDefault && (
                            <span className="text-xs bg-primary/10 text-primary font-semibold
                                             px-2 py-0.5 rounded-full">Default</span>
                          )}
                        </div>
                        <p className="text-sm text-muted">
                          {addr.street}, {addr.city}, {addr.state} — {addr.pincode}
                        </p>
                      </div>
                    </label>
                  ))}

                  {/* Pincode result for selected saved address */}
                  {pincodeLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted px-1">
                      <Loader2 className="w-4 h-4 animate-spin" /> Checking delivery availability…
                    </div>
                  )}
                  {pincodeResult && !pincodeLoading && (
                    <PincodeResultBadge result={pincodeResult} />
                  )}

                  <button
                    onClick={() => { setShowNewForm(true); setSelectedAddrId(null); setPincodeResult(null); }}
                    className="flex items-center gap-2 text-primary text-sm font-semibold
                               hover:underline mt-1"
                  >
                    <Plus className="w-4 h-4" /> Add a new address
                  </button>
                </div>
              )}

              {/* New address form */}
              {(showNewForm || savedAddresses.length === 0) && (
                <>
                  {savedAddresses.length > 0 && (
                    <button
                      onClick={() => { setShowNewForm(false); setSelectedAddrId(savedAddresses[0]._id); setPincodeResult(null); }}
                      className="flex items-center gap-1.5 text-sm text-muted hover:text-dark
                                 mb-5 font-semibold"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to saved addresses
                    </button>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                        Full Name *
                      </label>
                      <input
                        className="input"
                        placeholder="Sumit Verma"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                        Phone Number
                      </label>
                      <input
                        className="input"
                        placeholder="10-digit mobile number"
                        inputMode="tel"
                        maxLength={10}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      />
                    </div>
                    {/* Street */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                        Street Address *
                      </label>
                      <input
                        className="input"
                        placeholder="Flat/House No, Building, Street, Area"
                        value={form.street}
                        onChange={(e) => setForm({ ...form, street: e.target.value })}
                      />
                    </div>
                    {/* Landmark */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                        Landmark <span className="normal-case font-normal">(optional)</span>
                      </label>
                      <input
                        className="input"
                        placeholder="Near bus stop, next to school…"
                        value={form.landmark}
                        onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                      />
                    </div>
                    {/* Pincode */}
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                        Pincode *
                      </label>
                      <div className="relative">
                        <input
                          className="input font-mono tracking-wider pr-10"
                          placeholder="400001"
                          inputMode="numeric"
                          maxLength={6}
                          value={form.pincode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                            setForm({ ...form, pincode: val });
                            if (val.length < 6) setPincodeResult(null);
                          }}
                          onBlur={() => checkPincode(form.pincode)}
                        />
                        {pincodeLoading && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2
                                             w-4 h-4 text-muted animate-spin" />
                        )}
                      </div>
                    </div>
                    {/* City */}
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                        City *
                      </label>
                      <input
                        className="input"
                        placeholder="Mumbai"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                      />
                    </div>
                    {/* State */}
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                        State *
                      </label>
                      <input
                        className="input"
                        placeholder="Maharashtra"
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Pincode result */}
                  {pincodeResult && !pincodeLoading && (
                    <div className="mt-4">
                      <PincodeResultBadge result={pincodeResult} />
                    </div>
                  )}
                </>
              )}

              <button
                onClick={handleAddressNext}
                className="btn-primary mt-6 flex items-center gap-2"
              >
                Continue to Order Summary <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ═══════════════════════════════ STEP 2: SUMMARY ═══════════════════ */}
          {step === "summary" && (
            <div className="card p-6">
              <h2 className="font-bold text-dark text-lg mb-5 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" /> Review Your Order
              </h2>

              {/* Delivery address chip */}
              {deliverySnapshot && (
                <div className="bg-accent rounded-2xl p-4 mb-5 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-0.5">
                      Delivering to
                    </p>
                    <p className="text-sm font-semibold text-dark">{deliverySnapshot.name}</p>
                    <p className="text-sm text-muted">
                      {deliverySnapshot.street}, {deliverySnapshot.city},{" "}
                      {deliverySnapshot.state} — {deliverySnapshot.pincode}
                    </p>
                    {pincodeResult?.estimatedDelivery && (
                      <p className="text-xs text-success font-semibold mt-1 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        Estimated delivery: {formatDelivery(pincodeResult.estimatedDelivery)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantSku}`}
                    className="flex items-center gap-3"
                  >
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-accent">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-dark truncate">{item.name}</p>
                      <p className="text-xs text-muted">{item.unit} × {item.quantity}</p>
                    </div>
                    <p className="font-bold text-dark text-sm shrink-0">
                      {formatPrice(item.sellingPrice * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                <Link href="/cart" className="hover:text-primary transition-colors">
                  Go back to cart to make changes
                </Link>
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep("address")}
                  className="btn-outline flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep("payment")}
                  className="btn-primary flex items-center gap-2 flex-1 justify-center"
                >
                  Continue to Payment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════ STEP 3: PAYMENT ═══════════════════ */}
          {step === "payment" && (
            <div className="card p-6">
              <h2 className="font-bold text-dark text-lg mb-5 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> Payment Method
              </h2>

              {/* COD card */}
              <div className="p-5 rounded-2xl border-2 border-primary bg-accent flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-2xl shrink-0">
                  💵
                </div>
                <div className="flex-1">
                  <p className="font-bold text-dark">Cash on Delivery</p>
                  <p className="text-xs text-muted mt-0.5">
                    Pay in cash when your order arrives at your doorstep.
                    No advance payment required.
                  </p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary
                                flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>

              <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
                💡 Keep exact change ready to speed up delivery. Our delivery partner
                may not carry change for large denominations.
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep("summary")}
                  className="btn-outline flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={placeOrder}
                  disabled={loading}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2 text-base"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Place Order — {formatPrice(tot)}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════ STEP 4: CONFIRMATION ════════════════ */}
          {step === "confirmation" && placedOrder && (
            <div className="card p-8 text-center">
              {/* Animated checkmark */}
              <div className="flex justify-center mb-6">
                <svg viewBox="0 0 52 52" className="w-24 h-24">
                  <circle
                    cx="26" cy="26" r="24"
                    fill="none"
                    stroke="#1A6B3A"
                    strokeWidth="2.5"
                    className="animate-circle-draw"
                  />
                  <path
                    fill="none"
                    stroke="#1A6B3A"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 27l8 8 16-16"
                    className="animate-check-draw"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-extrabold text-dark mb-1">Order Placed!</h2>
              <p className="text-muted text-sm mb-2">
                Thank you for shopping with FreshCart 🛒
              </p>
              <div className="inline-flex items-center gap-2 bg-accent px-4 py-2 rounded-xl
                              text-sm font-mono font-semibold text-primary mb-6">
                Order ID: {placedOrder.orderNumber}
              </div>

              {/* Delivery address */}
              {deliverySnapshot && (
                <div className="text-left bg-accent rounded-2xl p-4 mb-5">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Delivering to
                  </p>
                  <p className="text-sm font-semibold text-dark">{deliverySnapshot.name}</p>
                  <p className="text-sm text-muted">
                    {deliverySnapshot.street}, {deliverySnapshot.city},{" "}
                    {deliverySnapshot.state} — {deliverySnapshot.pincode}
                  </p>
                  <p className="text-xs text-success font-semibold mt-2 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    Estimated delivery: {formatDelivery(placedOrder.estimatedDelivery)}
                  </p>
                </div>
              )}

              {/* Items */}
              <div className="text-left space-y-2 mb-5">
                {placedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-dark">
                      {item.name} <span className="text-muted">× {item.qty}</span>
                    </span>
                    <span className="font-semibold text-dark">
                      {formatPrice(item.price * item.qty)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial summary */}
              <div className="text-left space-y-2 text-sm border-t border-border pt-4 mb-6">
                {placedOrder.totalDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount saved</span>
                    <span className="font-semibold">− {formatPrice(placedOrder.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted">
                  <span>Delivery</span>
                  <span className={placedOrder.deliveryCharge === 0 ? "text-success font-semibold" : ""}>
                    {placedOrder.deliveryCharge === 0 ? "FREE" : formatPrice(placedOrder.deliveryCharge)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-dark text-base">
                  <span>Grand Total</span>
                  <span className="text-primary">{formatPrice(placedOrder.grandTotal)}</span>
                </div>
                <p className="text-xs text-muted">Payment: Cash on Delivery</p>
              </div>

              <Link
                href="/"
                className="btn-primary inline-flex items-center gap-2"
              >
                Continue Shopping <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* ── Sidebar summary (hidden on confirmation) ──────────────────────── */}
        {step !== "confirmation" && (
          <div className="lg:col-span-1">
            <OrderSummaryCard
              sub={sub}
              mrpTotal={mrpTotal}
              discount={discount}
              delivery={delivery}
              tot={tot}
            />
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Pincode result badge ─────────────────────────────────────────────────────

function PincodeResultBadge({ result }: { result: PincodeResult }) {
  if (result.serviceable) {
    return (
      <div className="flex items-start gap-2.5 bg-green-50 border border-green-100
                      rounded-xl p-3 text-sm">
        <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-success">
            Delivery available — {result.area}{result.city ? `, ${result.city}` : ""}
          </p>
          {result.estimatedDelivery && (
            <p className="text-xs text-success/80 mt-0.5 flex items-center gap-1">
              <Truck className="w-3 h-3" />
              Estimated delivery: {formatDelivery(result.estimatedDelivery)}
            </p>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5 bg-red-50 border border-red-100
                    rounded-xl p-3 text-sm">
      <XCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-danger">Not serviceable at this pincode</p>
        <p className="text-xs text-muted mt-0.5">
          We&apos;re working on expanding to more areas. Try a nearby pincode.
        </p>
      </div>
    </div>
  );
}
