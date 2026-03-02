import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ success: false, error: "Valid productId required" }, { status: 400 });
    }

    await connectDB();

    // Find all orders that contain this product, then collect co-purchased productIds
    const coProducts = await Order.aggregate([
      // Orders containing our product
      { $match: { "items.productId": new mongoose.Types.ObjectId(productId) } },
      // Flatten all items
      { $unwind: "$items" },
      // Exclude the product itself
      { $match: { "items.productId": { $ne: new mongoose.Types.ObjectId(productId) } } },
      // Count co-occurrences
      { $group: { _id: "$items.productId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 4 },
    ]);

    if (coProducts.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const ids = coProducts.map((c) => c._id);
    const products = await Product.find({
      _id: { $in: ids },
      isAvailable: true,
    })
      .populate("category", "name slug")
      .lean();

    // Preserve co-purchase frequency order
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));
    const ordered = ids
      .map((id) => productMap.get(id.toString()))
      .filter(Boolean);

    return NextResponse.json({ success: true, data: JSON.parse(JSON.stringify(ordered)) });
  } catch (err) {
    console.error("[BOUGHT TOGETHER]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
