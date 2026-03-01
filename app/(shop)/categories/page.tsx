import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@/lib/mongoose";
import Category from "@/models/Category";
import { LayoutGrid } from "lucide-react";

interface ICategory {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}

async function getCategories(): Promise<ICategory[]> {
  await connectDB();
  const cats = await Category.find({ isActive: true, parentCategory: null })
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  return cats.map((c) => ({
    _id:         c._id.toString(),
    name:        c.name as string,
    slug:        c.slug as string,
    image:       c.image as string | undefined,
    description: c.description as string | undefined,
  }));
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-dark mb-1">All Categories</h1>
      <p className="text-muted text-sm mb-8">Browse by category</p>

      {categories.length === 0 ? (
        <div className="text-center py-24">
          <LayoutGrid className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="font-semibold text-dark">No categories yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/category/${cat.slug}`}
              className="card p-4 flex flex-col items-center gap-3 text-center
                         hover:border-primary hover:shadow-md transition-all group"
            >
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-accent shrink-0">
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🛒</div>
                )}
              </div>
              <div>
                <p className="font-semibold text-dark text-sm group-hover:text-primary transition-colors">
                  {cat.name}
                </p>
                {cat.description && (
                  <p className="text-xs text-muted mt-0.5 line-clamp-2">{cat.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
