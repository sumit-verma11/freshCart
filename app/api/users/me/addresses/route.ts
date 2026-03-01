import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";

export const dynamic = "force-dynamic";

// ─── GET /api/users/me/addresses ──────────────────────────────────────────────

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select("addresses").lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: (user as { addresses: unknown[] }).addresses ?? [] });
  } catch (error) {
    console.error("[ADDRESSES GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/users/me/addresses ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { label = "Home", street, city, state, pincode, isDefault = false } = body;

    if (!street || !city || !state || !pincode) {
      return NextResponse.json(
        { success: false, error: "street, city, state and pincode are required" },
        { status: 400 }
      );
    }
    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { success: false, error: "Pincode must be exactly 6 digits" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // If this is the default address, unset all others
    if (isDefault) {
      user.addresses.forEach((a: { isDefault: boolean }) => { a.isDefault = false; });
    }

    user.addresses.push({ label, street, city, state, pincode, isDefault });
    await user.save();

    return NextResponse.json({ success: true, data: user.addresses }, { status: 201 });
  } catch (error) {
    console.error("[ADDRESSES POST]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
