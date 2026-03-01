import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Notification from "@/models/Notification";
import Product from "@/models/Product";

export async function POST(req: NextRequest) {
  try {
    const { email, productId } = await req.json();

    if (!email || !productId) {
      return NextResponse.json({ success: false, error: "email and productId required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email" }, { status: 400 });
    }

    await connectDB();

    const product = await Product.findById(productId).lean();
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    await Notification.findOneAndUpdate(
      { email: email.toLowerCase(), productId },
      { email: email.toLowerCase(), productId, productName: (product as { name: string }).name, notified: false },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, message: "You'll be notified when this product is back in stock." });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
