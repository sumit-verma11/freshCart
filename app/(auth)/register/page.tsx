"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Leaf, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";

// ─── Client-side validation rules (mirrors the Zod registerSchema) ────────────

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0)  return { label: "",        color: "bg-border",   width: "w-0"    };
  if (pw.length < 6)   return { label: "Too short", color: "bg-danger",  width: "w-1/4"  };
  if (pw.length < 8)   return { label: "Weak",      color: "bg-amber-400", width: "w-2/4" };
  if (/[^a-zA-Z0-9]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw))
                        return { label: "Strong",    color: "bg-success",  width: "w-full" };
  return               { label: "Fair",            color: "bg-yellow-400", width: "w-3/4" };
}

function validate(form: {
  name: string; email: string; password: string; confirmPassword: string; phone: string;
}): string | null {
  if (form.name.trim().length < 2)   return "Name must be at least 2 characters";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email address";
  if (form.password.length < 6)      return "Password must be at least 6 characters";
  if (form.password !== form.confirmPassword) return "Passwords do not match";
  if (form.phone && !/^[6-9]\d{9}$/.test(form.phone))
    return "Enter a valid 10-digit Indian mobile number";
  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name:            "",
    email:           "",
    password:        "",
    confirmPassword: "",
    phone:           "",
  });
  const [showPw,        setShowPw]        = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading,       setLoading]       = useState(false);

  const strength       = getPasswordStrength(form.password);
  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const passwordsMiss  = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const error = validate(form);
    if (error) { toast.error(error); return; }

    setLoading(true);
    try {
      // 1. Register
      const res  = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     form.name.trim(),
          email:    form.email.trim().toLowerCase(),
          password: form.password,
          phone:    form.phone || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed. Please try again.");
        return;
      }

      // 2. Auto-login
      const loginRes = await signIn("credentials", {
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        redirect: false,
      });

      if (loginRes?.ok) {
        toast.success("Account created! Welcome to FreshCart 🎉");
        router.push("/");
        router.refresh();
      } else {
        // Registration succeeded but auto-login failed → send to login page
        toast.success("Account created! Please sign in.");
        router.push("/login");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-modal border border-border">

        {/* ── Logo ────────────────────────────────────────────────────────── */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="bg-primary rounded-xl p-2">
              <Leaf className="w-5 h-5 text-white" />
            </span>
            <span className="text-xl font-extrabold text-dark">
              Fresh<span className="text-primary">Cart</span>
            </span>
          </Link>
        </div>

        <div className="text-center mb-7">
          <h1 className="text-2xl font-bold text-dark">Create account</h1>
          <p className="text-muted text-sm mt-1">Join FreshCart and shop fresh today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                required
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Arjun Mehta"
                className="input pl-10"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Email address *</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="input pl-10"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">
              Phone number{" "}
              <span className="font-normal text-muted">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="tel"
                autoComplete="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                }
                placeholder="9876543210"
                className="input pl-10"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Password *</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type={showPw ? "text" : "password"}
                required
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 6 characters"
                className="input pl-10 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2
                           text-muted hover:text-dark transition-colors"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Strength bar */}
            {form.password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
                  />
                </div>
                <p className="text-xs text-muted">{strength.label}</p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Confirm Password *</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type={showConfirmPw ? "text" : "password"}
                required
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                className={`input pl-10 pr-11 transition-colors
                            ${passwordsMatch ? "border-success focus:ring-success/20"
                            : passwordsMiss  ? "border-danger  focus:ring-danger/20"
                                             : ""}`}
              />
              {/* Show/hide toggle */}
              <button
                type="button"
                onClick={() => setShowConfirmPw((v) => !v)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2
                           text-muted hover:text-dark transition-colors"
                aria-label={showConfirmPw ? "Hide password" : "Show password"}
              >
                {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {/* Match indicator */}
              {passwordsMatch && (
                <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2
                                         w-4 h-4 text-success" />
              )}
              {passwordsMiss && (
                <XCircle className="absolute right-10 top-1/2 -translate-y-1/2
                                    w-4 h-4 text-danger" />
              )}
            </div>
            {passwordsMiss && (
              <p className="text-xs text-danger mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || passwordsMiss}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white
                              rounded-full animate-spin" />
            ) : (
              <>Create Account <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
