import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Category from "@/models/Category";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") return null;
  return session;
}

// ─── GET /api/admin/categories ────────────────────────────────────────────────

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  await connectDB();
  const categories = await Category.find()
    .populate("parentCategory", "name slug")
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  return NextResponse.json({ success: true, data: categories });
}

// ─── POST /api/admin/categories ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, slug: rawSlug, image, description, parentCategory, isActive = true, sortOrder = 0 } = body;

  if (!name?.trim()) {
    return NextResponse.json({ success: false, error: "Category name is required" }, { status: 400 });
  }

  const slug = rawSlug?.trim() || slugify(name);

  await connectDB();
  const existing = await Category.findOne({ slug });
  if (existing) {
    return NextResponse.json({ success: false, error: "A category with this slug already exists" }, { status: 409 });
  }

  const cat = await Category.create({
    name: name.trim(),
    slug,
    image: image || undefined,
    description: description || undefined,
    parentCategory: parentCategory || null,
    isActive,
    sortOrder,
  });

  return NextResponse.json({ success: true, data: cat }, { status: 201 });
}

// ─── PUT /api/admin/categories ────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });

  await connectDB();
  const cat = await Category.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!cat) return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: cat });
}

// ─── DELETE /api/admin/categories ─────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });

  await connectDB();
  // Prevent deleting category that has subcategories
  const hasChildren = await Category.exists({ parentCategory: id });
  if (hasChildren) {
    return NextResponse.json(
      { success: false, error: "Cannot delete category that has subcategories" },
      { status: 400 }
    );
  }

  await Category.findByIdAndDelete(id);
  return NextResponse.json({ success: true, message: "Category deleted" });
}
