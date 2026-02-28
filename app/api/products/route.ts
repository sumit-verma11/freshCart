import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";
import { PaginatedResponse } from "@/types";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "12"));
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const pincode = searchParams.get("pincode");
    const sortBy = searchParams.get("sort") || "createdAt";
    const sortOrder = searchParams.get("order") === "asc" ? 1 : -1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (category) query.category = category;
    if (featured === "true") query.isFeatured = true;
    if (pincode) query.serviceablePincodes = pincode;
    if (search) query.$text = { $search: search };

    const allowedSortFields = ["price", "rating", "createdAt", "name", "reviewCount"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json<PaginatedResponse<unknown>>({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[PRODUCTS GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
