import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Category from "@/models/Category";
import { ok, fail, requireAdmin, zodFail } from "@/lib/api";
import { createCategorySchema } from "@/lib/validators";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") !== "false";
    const parentId   = searchParams.get("parent"); // filter by parent (or "null" for top-level)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (activeOnly) query.isActive = true;
    if (parentId === "null") query.parentCategory = null;
    else if (parentId)       query.parentCategory = parentId;

    const categories = await Category.find(query)
      .populate("parentCategory", "name slug")
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return ok(categories);
  } catch (error) {
    console.error("[CATEGORIES GET]", error);
    return fail("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();

    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error as ZodError);

    // Auto-generate slug from name if not provided
    const data = {
      ...parsed.data,
      slug: parsed.data.slug ?? parsed.data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    };

    const category = await Category.create(data);
    return ok(category, 201);
  } catch (error) {
    console.error("[CATEGORIES POST]", error);
    return fail("Internal server error", 500);
  }
}
