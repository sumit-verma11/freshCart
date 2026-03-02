import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import { PRODUCT_IMAGE_KEYWORDS } from "@/lib/product-image-keywords";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") return null;
  return session;
}

/**
 * GET /api/admin/fix-images
 * Returns the list of slugs that have a keyword mapping (i.e. can be auto-fixed).
 */
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    success: true,
    slugs: Object.keys(PRODUCT_IMAGE_KEYWORDS),
    total: Object.keys(PRODUCT_IMAGE_KEYWORDS).length,
  });
}

/**
 * POST /api/admin/fix-images
 * Body: { slug: string }
 *
 * Fetches an Unsplash image for the given product slug, follows the redirect
 * to get a stable CDN URL, and saves it to the product's images[] field.
 *
 * Call this once per slug (the client loops). This keeps each request well
 * within the 10s default Next.js route timeout.
 */
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await req.json() as { slug: string };
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const keywords = PRODUCT_IMAGE_KEYWORDS[slug];
  if (!keywords) {
    return NextResponse.json({ error: `No keyword mapping for slug: ${slug}` }, { status: 400 });
  }

  // Fetch from Unsplash Source API and follow redirect to stable CDN URL
  let imageUrl: string;
  try {
    const query = encodeURIComponent(keywords);
    const res = await fetch(
      `https://source.unsplash.com/featured/600x600/?${query}`,
      { redirect: "follow", headers: { "User-Agent": "FreshCart/1.0" } }
    );

    const match = res.url.match(/^https:\/\/images\.unsplash\.com\/photo-[^?]+/);
    if (!match) {
      return NextResponse.json(
        { error: "Unsplash did not return a valid image URL", rawUrl: res.url },
        { status: 502 }
      );
    }
    imageUrl = `${match[0]}?w=600&q=80`;
  } catch (err) {
    return NextResponse.json(
      { error: `Unsplash fetch failed: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  // Update the product in MongoDB
  await connectDB();
  const result = await Product.updateOne({ slug }, { $set: { images: [imageUrl] } });

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: `Product not found: ${slug}` }, { status: 404 });
  }

  return NextResponse.json({ success: true, slug, imageUrl });
}
