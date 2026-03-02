import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";

/**
 * GET /api/flash-sale
 *
 * Returns all available products with an active flash sale (endsAt > now).
 */
export async function GET() {
  try {
    await connectDB();

    const products = await Product.find({
      "flashSale.endsAt": { $gt: new Date() },
      isAvailable: true,
    })
      .populate("category", "name slug")
      .lean();

    return NextResponse.json({
      success: true,
      data: JSON.parse(JSON.stringify(products)),
    });
  } catch (err) {
    console.error("[FLASH SALE]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
