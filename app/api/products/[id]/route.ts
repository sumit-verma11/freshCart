import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import { ok, fail, requireAdmin, zodFail } from "@/lib/api";
import { updateProductSchema } from "@/lib/validators";
import { ZodError } from "zod";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    const { id } = params;
    const product = await Product.findOne(
      id.match(/^[a-f\d]{24}$/i) ? { _id: id } : { slug: id }
    )
      .populate("category", "name slug")
      .lean();

    if (!product) return fail("Product not found", 404);
    return ok(product);
  } catch (error) {
    console.error("[PRODUCT GET]", error);
    return fail("Internal server error", 500);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();

    const body = await req.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error as ZodError);

    const product = await Product.findByIdAndUpdate(
      params.id,
      { $set: parsed.data },
      { new: true, runValidators: true }
    ).lean();

    if (!product) return fail("Product not found", 404);
    return ok(product);
  } catch (error) {
    console.error("[PRODUCT PUT]", error);
    return fail("Internal server error", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();

    // Soft-delete: mark as unavailable rather than destroying the document
    const product = await Product.findByIdAndUpdate(
      params.id,
      { $set: { isAvailable: false } },
      { new: true }
    ).lean();

    if (!product) return fail("Product not found", 404);
    return ok({ message: "Product deactivated" });
  } catch (error) {
    console.error("[PRODUCT DELETE]", error);
    return fail("Internal server error", 500);
  }
}
