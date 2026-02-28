import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import { slugify } from "@/lib/utils";

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
      name, description, category, price, salePrice, unit,
      stock, images, tags, isOrganic, isFeatured, serviceablePincodes,
    } = body;

    if (!name || !description || !category || !price || !unit) {
      return NextResponse.json(
        { success: false, error: "Name, description, category, price, and unit are required" },
        { status: 400 }
      );
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

    const product = await Product.create({
      name, slug, description, category,
      price, salePrice, unit, stock: stock ?? 0,
      images: images ?? [], tags: tags ?? [],
      isOrganic: isOrganic ?? false,
      isFeatured: isFeatured ?? false,
      rating: 0, reviewCount: 0,
      serviceablePincodes: serviceablePincodes ?? [],
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
