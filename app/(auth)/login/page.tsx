"use client";

import { Suspense, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Leaf } from "lucide-react";
import toast from "react-hot-toast";

// ─── Inner form (needs useSearchParams, must be inside Suspense) ──────────────

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") || "/";

  const [form,       setForm]       = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await signIn("credentials", {
      email:    form.email.trim().toLowerCase(),
      password: form.password,
      redirect: false,
    });

    if (res?.error) {
      // NextAuth passes the message thrown inside authorize() as the error string.
      // Fall back to a generic message for the CredentialsSignin code.
      const msg =
        res.error === "CredentialsSignin"
          ? "Invalid email or password"
          : res.error;
      toast.error(msg);
      setLoading(false);
      return;
    }

    toast.success("Welcome back! 🎉");

    // Fetch the freshly-set session to read the role for redirect
    const session = await getSession();
    if (session?.user?.role === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push(callbackUrl === "/login" ? "/" : callbackUrl);
    }
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl p-8 shadow-modal border border-border">

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
          <h1 className="text-2xl font-bold text-dark">Welcome back</h1>
          <p className="text-muted text-sm mt-1">Sign in to your FreshCart account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">
              Email address
            </label>
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

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type={showPw ? "text" : "password"}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
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
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2.5">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded accent-primary cursor-pointer"
            />
            <label
              htmlFor="remember"
              className="text-sm text-muted cursor-pointer select-none"
            >
              Remember me for 30 days
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white
                              rounded-full animate-spin" />
            ) : (
              <>Sign In <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-accent rounded-2xl text-xs text-muted space-y-1.5">
          <p className="font-semibold text-primary mb-1">Demo credentials</p>
          <p>
            User:{" "}
            <span className="font-medium text-dark">arjun@example.com</span>
            {" / "}
            <span className="font-medium text-dark">User@1234</span>
          </p>
          <p>
            Admin:{" "}
            <span className="font-medium text-dark">admin@freshcart.in</span>
            {" / "}
            <span className="font-medium text-dark">Admin@1234</span>
          </p>
        </div>

        <p className="text-center text-sm text-muted mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Create one →
          </Link>
        </p>
      </div>
    </div>
  );
}

// ─── Page (wraps form in Suspense for useSearchParams) ────────────────────────

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl p-8 shadow-modal border border-border
                          flex items-center justify-center h-64">
            <span className="w-8 h-8 border-4 border-primary/30 border-t-primary
                            rounded-full animate-spin" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
