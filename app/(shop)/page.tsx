import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Leaf, Zap, Shield, Clock,
  ChevronRight, Star
} from "lucide-react";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import ProductCard from "@/components/ProductCard";
import { IProduct } from "@/types";

async function getFeaturedProducts(): Promise<IProduct[]> {
  await connectDB();
  return Product.find({ isFeatured: true }).limit(8).lean() as unknown as IProduct[];
}

async function getCategories() {
  await connectDB();
  return Product.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
}

const CATEGORY_ICONS: Record<string, string> = {
  "Fruits & Vegetables": "🥦",
  "Dairy & Eggs": "🥛",
  "Bakery": "🍞",
  "Beverages": "🧃",
  "Snacks": "🍿",
  "Meat & Seafood": "🐟",
};

const CATEGORY_BG: Record<string, string> = {
  "Fruits & Vegetables": "bg-green-50",
  "Dairy & Eggs": "bg-blue-50",
  "Bakery": "bg-amber-50",
  "Beverages": "bg-cyan-50",
  "Snacks": "bg-orange-50",
  "Meat & Seafood": "bg-red-50",
};

const FEATURES = [
  { icon: Zap, title: "Same-Day Delivery", desc: "Order before 12 PM for same-day delivery" },
  { icon: Leaf, title: "100% Fresh", desc: "Farm-to-doorstep freshness guaranteed" },
  { icon: Shield, title: "Safe & Secure", desc: "Hygienic packaging and handling" },
  { icon: Clock, title: "24/7 Support", desc: "Round-the-clock customer assistance" },
];

export default async function HomePage() {
  const [featured, categories] = await Promise.all([getFeaturedProducts(), getCategories()]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-hero relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-accent text-primary text-sm
                              font-semibold px-4 py-1.5 rounded-full mb-6">
                <Leaf className="w-4 h-4" /> Farm Fresh, Delivered Daily
              </div>
              <h1 className="text-4xl lg:text-6xl font-extrabold text-dark leading-tight mb-6">
                Fresh Groceries,{" "}
                <span className="text-gradient">Delivered Fast</span>
              </h1>
              <p className="text-lg text-muted mb-8 max-w-md">
                Premium quality fruits, vegetables, dairy, and more — delivered fresh to your
                doorstep. Free delivery on orders above ₹499.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/category/Fruits%20%26%20Vegetables" className="btn-primary flex items-center gap-2">
                  Shop Now <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/login" className="btn-outline">
                  Get ₹100 Off First Order
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-8">
                {[["50K+", "Happy Customers"], ["99%", "Fresh Guarantee"], ["4.8★", "App Rating"]].map(
                  ([val, label]) => (
                    <div key={label}>
                      <p className="text-xl font-bold text-dark">{val}</p>
                      <p className="text-xs text-muted">{label}</p>
                    </div>
                  )
                )}
              </div>
            </div>
            {/* Hero image placeholder */}
            <div className="hidden lg:block relative">
              <div className="w-full aspect-square max-w-lg ml-auto bg-accent rounded-3xl
                              flex items-center justify-center text-8xl shadow-card">
                🛒
              </div>
              <div className="absolute -bottom-4 -left-4 card p-4 shadow-card-hover">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-success fill-success" />
                  </div>
                  <div>
                    <p className="font-bold text-dark text-sm">Trusted by 50K+ families</p>
                    <p className="text-xs text-muted">across 6 major cities</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="bg-primary text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs text-white/70">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">Shop by Category</h2>
          <Link href="/category/Fruits%20%26%20Vegetables"
                className="text-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/category/${encodeURIComponent(cat._id)}`}
              className={`card-hover p-6 text-center flex flex-col items-center gap-3 ${
                CATEGORY_BG[cat._id] || "bg-gray-50"
              }`}
            >
              <span className="text-4xl">{CATEGORY_ICONS[cat._id] || "🛒"}</span>
              <div>
                <p className="font-semibold text-sm text-dark leading-tight">{cat._id}</p>
                <p className="text-xs text-muted mt-0.5">{cat.count} items</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-accent/50 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title">Featured Products</h2>
              <p className="text-muted text-sm mt-1">Handpicked by our fresh experts</p>
            </div>
            <Link href="/category/Fruits%20%26%20Vegetables"
                  className="btn-outline text-sm px-4 py-2">
              View All
            </Link>
          </div>
          <Suspense fallback={<ProductGridSkeleton />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {featured.map((product) => (
                <ProductCard key={product._id.toString()} product={product} />
              ))}
            </div>
          </Suspense>
        </div>
      </section>

      {/* Promo banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="bg-gradient-to-r from-primary to-success rounded-3xl p-8 lg:p-12
                        flex flex-col lg:flex-row items-center justify-between gap-8 text-white">
          <div>
            <p className="text-secondary font-semibold mb-2">Limited Time Offer</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold mb-3">
              Get ₹100 Off<br />Your First Order!
            </h2>
            <p className="text-white/80">Use code <span className="font-bold text-secondary">FRESH100</span> at checkout. Min order ₹299.</p>
          </div>
          <Link href="/register" className="btn-secondary shrink-0 text-lg px-8 py-4">
            Claim Offer <ArrowRight className="w-5 h-5 inline ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="skeleton aspect-square" />
          <div className="p-3 space-y-2">
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-3 w-12 rounded" />
            <div className="skeleton h-5 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
