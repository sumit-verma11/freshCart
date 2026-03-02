import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight, Leaf, Zap, Shield, Clock, Star,
} from "lucide-react";
import { connectDB } from "@/lib/mongoose";
import Category from "@/models/Category";
import AnimatedHeroText from "./_components/AnimatedHeroText";
import ShopSection, { CategoryItem } from "@/components/ShopSection";
import HomepageRecentlyViewed from "@/components/HomepageRecentlyViewed";
import JustForYou from "@/components/JustForYou";
import FlashSaleBanner from "@/components/FlashSaleBanner";

// ─── Server data fetch ────────────────────────────────────────────────────────

async function getCategories(): Promise<CategoryItem[]> {
  await connectDB();
  const cats = await Category.find({ isActive: true, parentCategory: null })
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  return cats.map((c) => ({
    _id:         c._id.toString(),
    name:        c.name,
    slug:        c.slug,
    image:       c.image,
    description: c.description,
  }));
}

// ─── Static data ──────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Zap,    title: "2-Hour Delivery",   desc: "Order before 12 PM, get same-day delivery" },
  { icon: Leaf,   title: "100% Fresh",         desc: "Farm-to-doorstep freshness guaranteed" },
  { icon: Shield, title: "Safe & Hygienic",    desc: "Carefully handled and packed with care" },
  { icon: Clock,  title: "24/7 Support",       desc: "We&apos;re always here when you need us" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <div>
      {/* ── Hero Banner ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-600 to-primary-800">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full
                        -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full
                        translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: copy */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm
                              text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-6
                              animate-fade-in">
                <Leaf className="w-4 h-4" /> Farm Fresh, Delivered Daily
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight
                             mb-6 animate-fade-in-up">
                Fresh Groceries{" "}
                <br className="hidden sm:block" />
                <AnimatedHeroText />
              </h1>

              <p className="text-white/80 text-lg mb-8 max-w-md animate-fade-in-up delay-100">
                Premium quality fruits, vegetables, dairy, and more — delivered fresh
                to your doorstep. Free delivery on orders above ₹499.
              </p>

              <div className="flex flex-wrap gap-4 animate-fade-in-up delay-200">
                <Link
                  href="#shop"
                  className="inline-flex items-center gap-2 bg-white text-primary font-bold
                             px-7 py-3.5 rounded-xl hover:bg-gray-50 active:scale-95
                             transition-all duration-200 shadow-lg shadow-black/10"
                >
                  Shop Now <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 border-2 border-white/60 text-white
                             font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10
                             active:scale-95 transition-all duration-200"
                >
                  Get ₹100 Off →
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-8 mt-10 animate-fade-in-up delay-300">
                {[
                  ["50K+", "Happy Customers"],
                  ["99%",  "Fresh Guarantee"],
                  ["4.8★", "App Rating"],
                ].map(([val, label]) => (
                  <div key={label}>
                    <p className="text-2xl font-extrabold text-white">{val}</p>
                    <p className="text-xs text-white/60 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: visual */}
            <div className="hidden lg:flex items-center justify-center animate-fade-in delay-200">
              <div className="relative">
                {/* Main circle */}
                <div className="w-80 h-80 rounded-full bg-white/10 backdrop-blur-sm
                                flex items-center justify-center text-9xl shadow-2xl border border-white/20">
                  🛒
                </div>

                {/* Floating cards */}
                <div className="absolute -bottom-6 -left-8 bg-white rounded-2xl px-4 py-3
                                shadow-xl border border-border animate-fade-in-up delay-400">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-success/10 rounded-xl flex items-center justify-center">
                      <Star className="w-5 h-5 text-success fill-success" />
                    </div>
                    <div>
                      <p className="font-bold text-dark text-sm">Trusted by 50K+ families</p>
                      <p className="text-xs text-muted">across major cities</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-4 -right-6 bg-white rounded-2xl px-4 py-3
                                shadow-xl border border-border animate-fade-in-up delay-500">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🥦</span>
                    <div>
                      <p className="font-bold text-dark text-xs">Organic Veggies</p>
                      <p className="text-xs text-success font-semibold">Just arrived!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features strip ───────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-dark text-sm">{title}</p>
                  <p className="text-xs text-muted mt-0.5 leading-tight"
                     dangerouslySetInnerHTML={{ __html: desc }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Promo strip ──────────────────────────────────────────────────────── */}
      <section className="bg-secondary/10 border-b border-secondary/20 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-dark">
            🎉 New user offer: Get <span className="text-secondary font-extrabold">₹100 OFF</span> your
            first order with code{" "}
            <code className="bg-secondary/20 text-secondary font-mono px-2 py-0.5 rounded-lg font-bold">
              FRESH100
            </code>
            {" "}· Min order ₹299{" "}
            <Link href="/register" className="underline text-primary ml-2 font-semibold hover:text-primary-600">
              Claim →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Flash sale banner (client, live countdown) ───────────────────────── */}
      <FlashSaleBanner />

      {/* ── Recently viewed (client, reads localStorage) ─────────────────────── */}
      <HomepageRecentlyViewed />

      {/* ── Shop section (categories + filters + product grid) ───────────────── */}
      <div id="shop">
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="flex gap-2 mb-8 overflow-x-auto">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="skeleton h-10 w-32 rounded-2xl shrink-0" />
                ))}
              </div>
              <div className="flex gap-8">
                <div className="hidden lg:block w-64 shrink-0">
                  <div className="card p-5 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="skeleton h-4 rounded" style={{ width: `${60 + i * 8}%` }} />
                    ))}
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="card overflow-hidden">
                      <div className="skeleton aspect-square" />
                      <div className="p-3 space-y-2">
                        <div className="skeleton h-3 w-16 rounded" />
                        <div className="skeleton h-4 rounded" />
                        <div className="skeleton h-3 w-20 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        >
          <ShopSection initialCategories={categories} />
        </Suspense>
      </div>

      {/* ── Just For You personalised section ───────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <JustForYou />
      </div>

      {/* ── Promo banner ─────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="relative bg-gradient-to-r from-primary to-primary-700 rounded-3xl
                        overflow-hidden p-8 lg:p-12">
          {/* Decorative circles */}
          <div className="absolute right-0 top-0 w-72 h-72 bg-white/5 rounded-full
                          translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="absolute left-1/2 bottom-0 w-48 h-48 bg-secondary/10 rounded-full
                          translate-y-1/2 pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row items-start lg:items-center
                          justify-between gap-8">
            <div className="text-white">
              <p className="text-secondary font-bold text-sm uppercase tracking-wide mb-2">
                Limited Time Offer
              </p>
              <h2 className="text-3xl lg:text-4xl font-extrabold mb-3 leading-tight">
                Get ₹100 Off
                <br />
                Your First Order!
              </h2>
              <p className="text-white/75 text-sm max-w-md">
                Use code{" "}
                <span className="font-bold text-secondary bg-black/10 px-2 py-0.5 rounded-lg">
                  FRESH100
                </span>{" "}
                at checkout. Min. order ₹299. Valid for new users only.
              </p>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-secondary text-white font-bold
                         text-lg px-8 py-4 rounded-2xl hover:bg-secondary-500 active:scale-95
                         transition-all duration-200 shadow-lg shrink-0"
            >
              Claim Offer <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
