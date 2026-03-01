import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Pincode from "@/models/Pincode";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") return null;
  return session;
}

// ─── GET /api/admin/pincodes ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = 20;
  const search = searchParams.get("search") || "";

  const query = search
    ? { $or: [{ pincode: { $regex: search } }, { city: { $regex: search, $options: "i" } }, { area: { $regex: search, $options: "i" } }] }
    : {};

  const [pincodes, total] = await Promise.all([
    Pincode.find(query).sort({ pincode: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Pincode.countDocuments(query),
  ]);

  return NextResponse.json({
    success: true,
    data: pincodes,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// ─── POST /api/admin/pincodes ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { pincode, area, city, state, isServiceable = false, estimatedDeliveryHours } = body;

  if (!pincode || !area || !city || !state) {
    return NextResponse.json({ success: false, error: "pincode, area, city and state are required" }, { status: 400 });
  }
  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ success: false, error: "Pincode must be exactly 6 digits" }, { status: 400 });
  }

  await connectDB();
  const existing = await Pincode.findOne({ pincode });
  if (existing) {
    return NextResponse.json({ success: false, error: "Pincode already exists" }, { status: 409 });
  }

  const doc = await Pincode.create({
    pincode,
    area,
    city,
    state,
    isServiceable,
    estimatedDeliveryHours: estimatedDeliveryHours ?? { min: 2, max: 4 },
  });

  return NextResponse.json({ success: true, data: doc }, { status: 201 });
}

// ─── PUT /api/admin/pincodes ──────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });

  await connectDB();
  const doc = await Pincode.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!doc) return NextResponse.json({ success: false, error: "Pincode not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: doc });
}

// ─── DELETE /api/admin/pincodes ───────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });

  await connectDB();
  await Pincode.findByIdAndDelete(id);
  return NextResponse.json({ success: true, message: "Pincode deleted" });
}
