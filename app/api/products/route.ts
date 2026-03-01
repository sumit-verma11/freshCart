import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import { ok, fail, paginated, requireAdmin, zodFail } from "@/lib/api";
import { createProductSchema } from "@/lib/validators";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page     = Math.max(1,  parseInt(searchParams.get("page")  || "1"));
    const limit    = Math.min(50, parseInt(searchParams.get("limit") || "12"));
    const category    = searchParams.get("category");
    const subCategory = searchParams.get("subcategory");
    const search      = searchParams.get("search");
    const featured    = searchParams.get("featured");
    const available   = searchParams.get("available");
    const pincode     = searchParams.get("pincode");
    const maxPrice    = searchParams.get("maxPrice");
    const organic     = searchParams.get("organic");
    const sortBy      = searchParams.get("sort") || "createdAt";
    const sortOrder   = searchParams.get("order") === "asc" ? 1 : -1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (category)    query.category    = category;
    if (subCategory) query.subCategory = subCategory;
    if (featured === "true") query.isFeatured = true;
    if (available !== "false") query.isAvailable = true; // default: only available products
    if (pincode)     query.$or = [
      { serviceablePincodes: pincode },
      { serviceablePincodes: { $size: 0 } }, // empty = serviceable everywhere
    ];
    if (search)      query.$text = { $search: search };
    if (organic === "true") query.isOrganic = true;
    if (maxPrice)    query["variants.sellingPrice"] = { $lte: Number(maxPrice) };

    // Map sort field names — sellingPrice lives inside variants[], not at root
    const sortFieldMap: Record<string, string> = {
      sellingPrice: "variants.0.sellingPrice",
      createdAt:    "createdAt",
      name:         "name",
      stockQty:     "stockQty",
    };
    const sortField = sortFieldMap[sortBy] ?? "createdAt";

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name slug")
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return paginated(products, page, limit, total);
  } catch (error) {
    console.error("[PRODUCTS GET]", error);
    return fail("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();

    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error as ZodError);

    const product = await Product.create(parsed.data);
    return ok(product, 201);
  } catch (error) {
    console.error("[PRODUCTS POST]", error);
    return fail("Internal server error", 500);
  }
}
