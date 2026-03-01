import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Leaf, Star, ChevronRight, Truck, RotateCcw, Shield } from "lucide-react";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import ProductCard from "@/components/ProductCard";
import AddToCartButton from "@/components/AddToCartButton";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { ICategory, IProduct } from "@/types";

interface Props {
  params: { id: string };
}

async function getProduct(id: string): Promise<IProduct | null> {
  await connectDB();
  const doc = await Product.findOne(
    id.match(/^[a-f\d]{24}$/i) ? { _id: id } : { slug: id }
  ).lean();
  return doc as unknown as IProduct | null;
}

async function getRelated(categoryId: string, excludeId: string): Promise<IProduct[]> {
  await connectDB();
  return Product.find({ category: categoryId, _id: { $ne: excludeId } })
    .limit(4)
    .lean() as unknown as IProduct[];
}

export async function generateMetadata({ params }: Props) {
  const product = await getProduct(params.id);
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  const v = product.variants[0];
  const discount = v ? calculateDiscount(v.mrp, v.sellingPrice) : 0;
  const effectivePrice = v?.sellingPrice ?? 0;

  // category may be populated (ICategory) or a raw ObjectId
  const categoryName =
    product.category !== null &&
    typeof product.category === "object" &&
    "name" in product.category
      ? (product.category as ICategory).name
      : "";
  const categoryId = product.category.toString();

  const related = await getRelated(categoryId, product._id.toString());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted mb-8">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        {categoryName && (
          <>
            <Link href={`/category/${encodeURIComponent(categoryName)}`}
                  className="hover:text-primary">
              {categoryName}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
          </>
        )}
        <span className="text-dark font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Product detail */}
      <div className="grid lg:grid-cols-2 gap-12 mb-16">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-accent rounded-3xl overflow-hidden">
            <Image
              src={product.images[0] ?? "/placeholder.png"}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {discount > 0 && (
              <div className="absolute top-4 left-4 badge-sale text-sm px-3 py-1">
                {discount}% OFF
              </div>
            )}
          </div>
          {/* Thumbnail strip */}
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden
                                        border-2 border-primary bg-accent">
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="80px" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {categoryName && <p className="text-muted text-sm font-medium mb-1">{categoryName}</p>}
          <h1 className="text-3xl font-extrabold text-dark mb-2">{product.name}</h1>
          {v && <p className="text-muted text-sm mb-4">{v.size}{v.unit}</p>}

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1 bg-success text-white text-sm font-semibold
                              px-2.5 py-1 rounded-lg">
                <Star className="w-3.5 h-3.5 fill-white" />
                {product.rating.toFixed(1)}
              </div>
              <span className="text-muted text-sm">{product.reviewCount} reviews</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl font-extrabold text-primary">{formatPrice(effectivePrice)}</span>
            {v && v.sellingPrice < v.mrp && (
              <span className="text-xl text-muted line-through">{formatPrice(v.mrp)}</span>
            )}
            {discount > 0 && (
              <span className="text-success font-bold text-sm">{discount}% off</span>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {product.isOrganic && (
              <span className="badge-organic flex items-center gap-1">
                <Leaf className="w-3 h-3" /> Organic
              </span>
            )}
            {product.tags.map((tag) => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full bg-gray-100 text-muted">
                {tag}
              </span>
            ))}
          </div>

          {/* Stock */}
          <div className="mb-6">
            {product.stockQty > 10 ? (
              <span className="text-success text-sm font-semibold">✓ In Stock</span>
            ) : product.stockQty > 0 ? (
              <span className="text-secondary text-sm font-semibold">
                ⚠ Only {product.stockQty} left
              </span>
            ) : (
              <span className="text-danger text-sm font-semibold">✗ Out of Stock</span>
            )}
          </div>

          {/* Add to cart */}
          <AddToCartButton product={product} />

          {/* Delivery info */}
          <div className="mt-6 space-y-3 border-t border-border pt-6">
            {[
              { icon: Truck, text: "Free delivery on orders above ₹499" },
              { icon: RotateCcw, text: "Easy 7-day returns on eligible items" },
              { icon: Shield, text: "100% authentic, quality guaranteed" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-muted">
                <Icon className="w-4 h-4 text-primary shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="card p-6 mb-12">
        <h2 className="text-lg font-bold text-dark mb-3">About this product</h2>
        <p className="text-muted leading-relaxed">{product.description}</p>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-dark">You may also like</h2>
            {categoryName && (
              <Link href={`/category/${encodeURIComponent(categoryName)}`}
                    className="text-primary text-sm font-semibold hover:underline">
                View All
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p._id.toString()} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
