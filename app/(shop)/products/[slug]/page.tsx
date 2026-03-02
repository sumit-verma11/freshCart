import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Leaf, Star } from "lucide-react";
import type { Metadata } from "next";

import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import { calculateDiscount } from "@/lib/utils";
import { ICategory, IProduct, INutritionFacts } from "@/types";

import ImageGallery    from "../_components/ImageGallery";
import ProductActions, { SerializedProduct } from "../_components/ProductActions";
import ProductTabs     from "../_components/ProductTabs";
import RelatedCarousel from "../_components/RelatedCarousel";
import RecentlyViewed  from "../_components/RecentlyViewed";
import BoughtTogether  from "@/components/BoughtTogether";
import ShareButton     from "../_components/ShareButton";

// ─── Types (plain after JSON serialisation) ───────────────────────────────────

type PlainCategory = { _id: string; name: string; slug: string } | null;

interface PlainProduct {
  _id:            string;
  name:           string;
  slug:           string;
  description:    string;
  subDescription?: string;
  additionalInfo?: string;
  allergyInfo?:   string;
  ingredients?:   string;
  category:       PlainCategory;
  subCategory?:   PlainCategory;
  images:         string[];
  variants:       SerializedProduct["variants"];
  stockQty:       number;
  isAvailable:    boolean;
  tags:           string[];
  isOrganic:      boolean;
  isFeatured:     boolean;
  nutritionFacts?: INutritionFacts;
  rating:         number;
  reviewCount:    number;
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function getProduct(slug: string): Promise<PlainProduct | null> {
  await connectDB();
  const doc = await Product.findOne({ slug })
    .populate("category",    "name slug")
    .populate("subCategory", "name slug")
    .lean();
  if (!doc) return null;
  // Serialise ObjectIds → strings through JSON round-trip
  return JSON.parse(JSON.stringify(doc)) as PlainProduct;
}

async function getRelated(
  excludeId:    string,
  categoryId:   string,
  subCategoryId?: string | null,
): Promise<IProduct[]> {
  await connectDB();

  // Prefer same subcategory first, fall back to same category
  const query = subCategoryId
    ? { subCategory: subCategoryId, _id: { $ne: excludeId }, isAvailable: true }
    : { category: categoryId,       _id: { $ne: excludeId }, isAvailable: true };

  const docs = await Product.find(query)
    .populate("category", "name slug")
    .limit(8)
    .lean();

  return JSON.parse(JSON.stringify(docs)) as IProduct[];
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title:       product.name,
    description: product.description,
    openGraph: {
      title:       product.name,
      description: product.description,
      images:      product.images[0] ? [product.images[0]] : [],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const category    = product.category;
  const subCategory = product.subCategory ?? null;
  const v0          = product.variants[0];
  const discount    = v0 ? calculateDiscount(v0.mrp, v0.sellingPrice) : 0;
  const isOutOfStock = !product.isAvailable || product.stockQty === 0;

  // Related products — prefer subcategory, fallback to category
  const related = category
    ? await getRelated(product._id, category._id, subCategory?._id)
    : [];

  // Serialised product for client components (only fields they need)
  const serializedForActions: SerializedProduct = {
    _id:        product._id,
    name:       product.name,
    slug:       product.slug,
    images:     product.images,
    variants:   product.variants,
    stockQty:   product.stockQty,
    isAvailable: product.isAvailable,
  };

  // ── Tabs only shown when data exists ────────────────────────────────────────
  const hasTabs = !!(
    product.additionalInfo ||
    product.ingredients    ||
    product.allergyInfo    ||
    product.nutritionFacts
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-14">

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm text-muted flex-wrap">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>

        {category && (
          <>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link
              href={`/?category=${category._id}`}
              className="hover:text-primary transition-colors"
            >
              {category.name}
            </Link>
          </>
        )}

        {subCategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link
              href={`/?category=${category?._id}&subcategory=${subCategory._id}`}
              className="hover:text-primary transition-colors"
            >
              {subCategory.name}
            </Link>
          </>
        )}

        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-dark font-medium truncate max-w-[200px]">{product.name}</span>

        {/* Share button — floated to the right in the breadcrumb row */}
        <div className="ml-auto">
          <ShareButton name={product.name} description={product.description} />
        </div>
      </nav>

      {/* ── Two-column layout ──────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">

        {/* LEFT: Image gallery */}
        <div className="lg:sticky lg:top-28">
          <ImageGallery
            images={product.images}
            name={product.name}
            isOutOfStock={isOutOfStock}
            discount={discount}
          />
        </div>

        {/* RIGHT: Details */}
        <div className="space-y-6">

          {/* Category + organic badge */}
          <div className="flex items-center gap-2 flex-wrap">
            {category && (
              <Link
                href={`/?category=${category._id}`}
                className="text-xs font-semibold text-primary bg-accent px-3 py-1 rounded-full
                           hover:bg-primary hover:text-white transition-all"
              >
                {category.name}
              </Link>
            )}
            {subCategory && (
              <span className="text-xs font-semibold text-muted bg-gray-100 px-3 py-1 rounded-full">
                {subCategory.name}
              </span>
            )}
            {product.isOrganic && (
              <span className="badge-organic flex items-center gap-1">
                <Leaf className="w-3 h-3" /> Organic
              </span>
            )}
          </div>

          {/* Name */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-dark leading-tight">
            {product.name}
          </h1>

          {/* Rating (static 4.2★ placeholder + real data if reviewCount > 0) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-success text-white text-sm font-bold
                            px-3 py-1.5 rounded-xl">
              <Star className="w-4 h-4 fill-white" />
              {product.reviewCount > 0 ? product.rating.toFixed(1) : "4.2"}
            </div>
            <span className="text-sm text-muted">
              {product.reviewCount > 0
                ? `${product.reviewCount} verified reviews`
                : "No reviews yet"}
            </span>
          </div>

          {/* Descriptions */}
          <div className="space-y-3">
            <p className="text-dark leading-relaxed font-medium">{product.description}</p>
            {product.subDescription && (
              <p className="text-muted leading-relaxed text-sm">{product.subDescription}</p>
            )}
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full bg-gray-100 text-muted
                             hover:bg-accent hover:text-primary transition-colors cursor-default"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* ── Interactive section (client component) ────────────────────── */}
          <ProductActions product={serializedForActions} />
        </div>
      </div>

      {/* ── Additional info tabs ───────────────────────────────────────────── */}
      {hasTabs && (
        <ProductTabs
          additionalInfo={product.additionalInfo}
          ingredients={product.ingredients}
          allergyInfo={product.allergyInfo}
          nutritionFacts={product.nutritionFacts}
        />
      )}

      {/* ── Related products carousel ─────────────────────────────────────── */}
      <RelatedCarousel
        products={related}
        title="You might also like"
        viewAllHref={category ? `/?category=${category._id}` : undefined}
      />

      {/* ── Frequently bought together ─────────────────────────────────────── */}
      <BoughtTogether productId={product._id} />

      {/* ── Recently viewed (reads + writes localStorage) ─────────────────── */}
      <RecentlyViewed currentProductId={product._id} />
    </div>
  );
}
