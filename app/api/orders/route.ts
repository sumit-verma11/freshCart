import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { generateOrderNumber, getDeliveryCharge } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 10;

    const [orders, total] = await Promise.all([
      Order.find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments({ userId: session.user.id }),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[ORDERS GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { items, shippingAddress, paymentMethod, notes } = await req.json();

    if (!items?.length || !shippingAddress || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: "Items, shipping address, and payment method are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Validate and calculate order totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product ${item.productId} not found` },
          { status: 404 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }

      const effectivePrice = product.salePrice ?? product.price;
      subtotal += effectivePrice * item.quantity;

      orderItems.push({
        productId: product._id,
        name: product.name,
        image: product.images[0] ?? "",
        unit: product.unit,
        quantity: item.quantity,
        price: product.price,
        salePrice: product.salePrice,
      });

      // Deduct stock
      await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
    }

    const deliveryCharge = getDeliveryCharge(subtotal);
    const total = subtotal + deliveryCharge;

    const order = await Order.create({
      userId: session.user.id,
      orderNumber: generateOrderNumber(),
      items: orderItems,
      shippingAddress,
      subtotal,
      deliveryCharge,
      discount: 0,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
      orderStatus: "confirmed",
      notes,
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    console.error("[ORDERS POST]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
