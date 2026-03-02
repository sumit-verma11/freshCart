import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    await connectDB();

    // ── Guest / not logged in → return top featured products ─────────────────
    if (!session?.user?.id) {
      const featured = await Product.find({ isAvailable: true, isFeatured: true })
        .populate("category", "name slug")
        .sort({ rating: -1 })
        .limit(8)
        .lean();
      return NextResponse.json({ success: true, data: JSON.parse(JSON.stringify(featured)) });
    }

    // ── Logged-in: build recommendations from order history ───────────────────
    const orders = await Order.find({ userId: session.user.id })
      .sort({ placedAt: -1 })
      .limit(10)
      .lean();

    // Collect all purchased productIds and their order count
    const purchasedIds = new Set<string>();
    const productFreq: Record<string, number> = {};

    for (const order of orders) {
      for (const item of order.items) {
        const pid = item.productId.toString();
        purchasedIds.add(pid);
        productFreq[pid] = (productFreq[pid] ?? 0) + item.qty;
      }
    }

    // If no order history → fall back to featured
    if (purchasedIds.size === 0) {
      const featured = await Product.find({ isAvailable: true, isFeatured: true })
        .populate("category", "name slug")
        .sort({ rating: -1 })
        .limit(8)
        .lean();
      return NextResponse.json({ success: true, data: JSON.parse(JSON.stringify(featured)) });
    }

    // Get full product docs for purchased items to extract categories + tags
    const purchasedProducts = await Product.find({
      _id: { $in: [...purchasedIds] },
    }).select("category tags").lean();

    const preferredCats = new Set<string>();
    const preferredTags = new Set<string>();
    for (const p of purchasedProducts) {
      if (p.category) preferredCats.add(p.category.toString());
      for (const t of p.tags ?? []) preferredTags.add(t);
    }

    // Find candidate products: available, not already purchased, in preferred categories
    const candidates = await Product.find({
      isAvailable: true,
      _id: { $nin: [...purchasedIds] },
      $or: [
        { category: { $in: [...preferredCats] } },
        { tags:     { $in: [...preferredTags] } },
      ],
    })
      .populate("category", "name slug")
      .sort({ isFeatured: -1, rating: -1 })
      .limit(40)
      .lean();

    // Score: isFeatured×2 + sameCategory×3 + sameTag×1
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scored = (candidates as any[]).map((p) => {
      let score = 0;
      if (p.isFeatured) score += 2;
      if (preferredCats.has(p.category?._id?.toString() ?? p.category?.toString())) score += 3;
      for (const t of p.tags ?? []) {
        if (preferredTags.has(t)) score += 1;
      }
      return { product: p, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top8 = scored.slice(0, 8).map((s) => s.product);

    return NextResponse.json({ success: true, data: JSON.parse(JSON.stringify(top8)) });
  } catch (err) {
    console.error("[RECOMMENDATIONS]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
