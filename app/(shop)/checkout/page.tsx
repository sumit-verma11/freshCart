"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, CreditCard, Truck, CheckCircle, ArrowRight, Lock } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { PaymentMethod } from "@/types";
import toast from "react-hot-toast";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: "cod", label: "Cash on Delivery", icon: "💵" },
  { value: "upi", label: "UPI (GPay / PhonePe / Paytm)", icon: "📱" },
  { value: "card", label: "Credit / Debit Card", icon: "💳" },
  { value: "netbanking", label: "Net Banking", icon: "🏦" },
];

type Step = "address" | "payment" | "review";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, subtotal, deliveryCharge, total, clearCart } = useCartStore();
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<Step>("address");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");

  const [address, setAddress] = useState({
    label: "Home",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: true,
  });

  useEffect(() => {
    setHydrated(true);
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
    }
  }, [status, router]);

  if (!hydrated || status === "loading") {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-2xl font-bold text-dark mb-4">Your cart is empty</p>
        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          Shop Now <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const sub = subtotal();
  const delivery = deliveryCharge();
  const tot = total();

  async function placeOrder() {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          shippingAddress: address,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to place order");
        return;
      }
      clearCart();
      toast.success("Order placed successfully! 🎉");
      router.push(`/orders?success=true&order=${data.data.orderNumber}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: "address", label: "Address", icon: <MapPin className="w-4 h-4" /> },
    { key: "payment", label: "Payment", icon: <CreditCard className="w-4 h-4" /> },
    { key: "review", label: "Review", icon: <CheckCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-dark mb-8">Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10">
        {steps.map((s, idx) => (
          <div key={s.key} className="flex items-center gap-2">
            <button
              onClick={() => {
                if (s.key === "payment" && !address.line1) return;
                setStep(s.key);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                         transition-all ${step === s.key
                           ? "bg-primary text-white"
                           : "bg-gray-100 text-muted"
                         }`}
            >
              {s.icon} {s.label}
            </button>
            {idx < steps.length - 1 && (
              <div className="w-8 h-0.5 bg-border" />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {step === "address" && (
            <div className="card p-6">
              <h2 className="font-bold text-dark text-lg mb-5 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Delivery Address
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-dark mb-1.5">Address Line 1 *</label>
                  <input
                    className="input"
                    placeholder="Flat/House No, Building Name, Street"
                    value={address.line1}
                    onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-dark mb-1.5">Address Line 2</label>
                  <input
                    className="input"
                    placeholder="Area, Locality (optional)"
                    value={address.line2}
                    onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">City *</label>
                  <input
                    className="input"
                    placeholder="Mumbai"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">State *</label>
                  <input
                    className="input"
                    placeholder="Maharashtra"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">Pincode *</label>
                  <input
                    className="input"
                    placeholder="400001"
                    maxLength={6}
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, "") })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">Label</label>
                  <select
                    className="input"
                    value={address.label}
                    onChange={(e) => setAddress({ ...address, label: e.target.value })}
                  >
                    <option>Home</option>
                    <option>Work</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!address.line1 || !address.city || !address.state || !address.pincode) {
                    toast.error("Please fill all required fields");
                    return;
                  }
                  setStep("payment");
                }}
                className="btn-primary mt-6 flex items-center gap-2"
              >
                Continue to Payment <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === "payment" && (
            <div className="card p-6">
              <h2 className="font-bold text-dark text-lg mb-5 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> Payment Method
              </h2>
              <div className="space-y-3">
                {PAYMENT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer
                                transition-all ${paymentMethod === opt.value
                                  ? "border-primary bg-accent"
                                  : "border-border hover:border-primary/40"
                                }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={opt.value}
                      checked={paymentMethod === opt.value}
                      onChange={() => setPaymentMethod(opt.value)}
                      className="accent-primary"
                    />
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="font-medium text-dark">{opt.label}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={() => setStep("review")}
                className="btn-primary mt-6 flex items-center gap-2"
              >
                Review Order <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === "review" && (
            <div className="card p-6">
              <h2 className="font-bold text-dark text-lg mb-5 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" /> Review & Place Order
              </h2>

              {/* Delivery address summary */}
              <div className="bg-accent rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-muted uppercase mb-2">Delivery Address</p>
                <p className="text-sm text-dark font-medium">{address.label}</p>
                <p className="text-sm text-muted">
                  {address.line1}{address.line2 ? `, ${address.line2}` : ""},{" "}
                  {address.city}, {address.state} — {address.pincode}
                </p>
              </div>

              {/* Payment summary */}
              <div className="bg-accent rounded-xl p-4 mb-6">
                <p className="text-xs font-semibold text-muted uppercase mb-2">Payment Method</p>
                <p className="text-sm text-dark font-medium">
                  {PAYMENT_OPTIONS.find((o) => o.value === paymentMethod)?.label}
                </p>
              </div>

              {/* Items */}
              <div className="space-y-2 mb-6">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between text-sm">
                    <span className="text-dark">
                      {item.name} <span className="text-muted">× {item.quantity}</span>
                    </span>
                    <span className="font-semibold text-dark">
                      {formatPrice((item.salePrice ?? item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={placeOrder}
                disabled={loading}
                className="btn-secondary w-full flex items-center justify-center gap-2 text-base"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Place Order — {formatPrice(tot)}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-24">
            <h3 className="font-bold text-dark mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-muted">
                  <span className="truncate max-w-[130px]">{item.name}</span>
                  <span className="font-medium text-dark ml-2">
                    {formatPrice((item.salePrice ?? item.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <hr className="border-border mb-3" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span><span className="text-dark font-medium">{formatPrice(sub)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Delivery</span>
                <span className={delivery === 0 ? "text-success font-semibold" : "text-dark font-medium"}>
                  {delivery === 0 ? "FREE" : formatPrice(delivery)}
                </span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between font-bold text-dark text-base">
                <span>Total</span>
                <span className="text-primary">{formatPrice(tot)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-muted">
              <Truck className="w-4 h-4 text-primary" />
              Estimated delivery: 2–4 hours
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
