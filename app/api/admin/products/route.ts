import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") return null;
  return session;
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name, description, category, subCategory,
      variants, subDescription, additionalInfo, allergyInfo, ingredients,
      stockQty, images, tags, isOrganic, isFeatured, isAvailable,
      serviceablePincodes,
    } = body;

    if (!name || !description || !category) {
      return NextResponse.json(
        { success: false, error: "Name, description, and category are required" },
        { status: 400 }
      );
    }

    if (!variants || variants.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one variant is required" },
        { status: 400 }
      );
    }

    for (const v of variants) {
      if (!v.size || !v.unit || !v.mrp) {
        return NextResponse.json(
          { success: false, error: "Each variant must have size, unit, and mrp" },
          { status: 400 }
        );
      }
      if (!v.sku) {
        v.sku = `${slugify(name).toUpperCase()}-${String(v.size).toUpperCase()}${String(v.unit).toUpperCase()}`;
      }
      if (!v.sellingPrice) v.sellingPrice = v.mrp;
    }

    await connectDB();

    const slug = slugify(name);
    const existing = await Product.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A product with this name already exists" },
        { status: 409 }
      );
    }

    const qty = stockQty ?? 0;
    const product = await Product.create({
      name,
      slug,
      description,
      subDescription:  subDescription  || undefined,
      additionalInfo:  additionalInfo  || undefined,
      allergyInfo:     allergyInfo     || undefined,
      ingredients:     ingredients     || undefined,
      category,
      subCategory:     subCategory     || undefined,
      variants,
      stockQty: qty,
      isAvailable: isAvailable !== undefined ? isAvailable : qty > 0,
      images: images ?? [],
      tags: tags ?? [],
      isOrganic: isOrganic ?? false,
      isFeatured: isFeatured ?? false,
      rating: 0,
      reviewCount: 0,
      serviceablePincodes: serviceablePincodes ?? [],
      createdBy: session.user.id,
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN PRODUCTS POST]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id, ...updates } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID required" }, { status: 400 });
    }

    await connectDB();

    const product = await Product.findByIdAndUpdate(id, updates, { new: true });
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("[ADMIN PRODUCTS PUT]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID required" }, { status: 400 });
    }

    await connectDB();

    await Product.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("[ADMIN PRODUCTS DELETE]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
