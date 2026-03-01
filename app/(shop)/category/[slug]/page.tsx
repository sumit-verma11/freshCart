import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import Category from "@/models/Category";
import ProductCard from "@/components/ProductCard";
import CategoryFilters from "@/components/CategoryFilters";
import { IProduct } from "@/types";
import { notFound } from "next/navigation";

interface Props {
  params: { slug: string };
  searchParams: { sort?: string; organic?: string };
}

export async function generateMetadata({ params }: Props) {
  await connectDB();
  const cat = await Category.findOne({ slug: params.slug, isActive: true }, "name").lean();
  if (!cat) return { title: "Category Not Found" };
  return { title: cat.name };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  await connectDB();

  // Look up the category by slug to get the ObjectId for the product query
  const cat = await Category.findOne({ slug: params.slug, isActive: true }).lean();
  if (!cat) notFound();

  const sort = searchParams.sort || "default";
  const onlyOrganic = searchParams.organic === "true";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = { category: cat._id, isAvailable: true };
  if (onlyOrganic) query.isOrganic = true;

  type SortSpec = [string, 1 | -1][];
  const sortMap: Record<string, SortSpec> = {
    price_asc:  [["variants.0.sellingPrice", 1]],
    price_desc: [["variants.0.sellingPrice", -1]],
    rating:     [["rating", -1]],
    default:    [["isFeatured", -1], ["createdAt", -1]],
  };

  const products = await Product.find(query)
    .populate("category", "name slug")
    .sort(sortMap[sort] || sortMap.default)
    .lean() as unknown as IProduct[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">{cat.name}</h1>
          <p className="text-muted text-sm mt-1">{products.length} products</p>
        </div>

        <CategoryFilters sort={sort} onlyOrganic={onlyOrganic} category={cat.slug} />
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-6xl mb-4">🛒</p>
          <p className="text-lg font-semibold text-dark mb-2">No products found</p>
          <p className="text-muted">Try removing filters or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product._id.toString()} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
