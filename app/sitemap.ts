import { MetadataRoute } from "next";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import Category from "@/models/Category";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectDB();

  const [products, categories] = await Promise.all([
    Product.find({ isAvailable: true }, "slug updatedAt").lean(),
    Category.find({ isActive: true }, "slug updatedAt").lean(),
  ]);

  const productUrls: MetadataRoute.Sitemap = (products as { slug: string; updatedAt: Date }[]).map((p) => ({
    url: `${BASE_URL}/product/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryUrls: MetadataRoute.Sitemap = (categories as { slug: string; updatedAt: Date }[]).map((c) => ({
    url: `${BASE_URL}/category/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE_URL,                    changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/categories`,    changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE_URL}/search`,        changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/login`,         changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/register`,      changeFrequency: "yearly",  priority: 0.3 },
  ];

  return [...staticUrls, ...categoryUrls, ...productUrls];
}
