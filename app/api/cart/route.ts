import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import { ok, fail, requireAuth, zodFail } from "@/lib/api";
import { cartUpsertSchema } from "@/lib/validators";
import { ZodError } from "zod";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

/** GET /api/cart — return the current user's cart with product details */
export async function GET(_req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();

    const cart = await Cart.findOne({ userId: session.user.id })
      .populate("items.productId", "name images variants isAvailable stockQty")
      .lean();

    return ok(cart ?? { items: [] });
  } catch (error) {
    console.error("[CART GET]", error);
    return fail("Internal server error", 500);
  }
}

/**
 * POST /api/cart — upsert a cart item.
 * qty === 0 removes the item; qty >= 1 adds/updates it.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();

    const body = await req.json();
    const parsed = cartUpsertSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error as ZodError);

    const { productId, variantSku, qty } = parsed.data;
    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Validate product + variant exist and are in stock
    const product = await Product.findById(productId).lean();
    if (!product) return fail("Product not found", 404);

    const variant = product.variants.find((v) => v.sku === variantSku);
    if (!variant) return fail("Variant not found", 404);

    if (qty > 0 && (!product.isAvailable || product.stockQty === 0)) {
      return fail("Product is out of stock", 409);
    }

    let cart;

    if (qty === 0) {
      // Remove item
      cart = await Cart.findOneAndUpdate(
        { userId },
        { $pull: { items: { variantSku } } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).lean();
    } else {
      // Upsert: update qty + priceSnapshot if already in cart, else push
      const existing = await Cart.findOne({ userId, "items.variantSku": variantSku });

      if (existing) {
        cart = await Cart.findOneAndUpdate(
          { userId, "items.variantSku": variantSku },
          {
            $set: {
              "items.$.qty": qty,
              "items.$.priceSnapshot": variant.sellingPrice,
            },
          },
          { new: true }
        ).lean();
      } else {
        cart = await Cart.findOneAndUpdate(
          { userId },
          {
            $push: {
              items: {
                productId: new mongoose.Types.ObjectId(productId),
                variantSku,
                qty,
                priceSnapshot: variant.sellingPrice,
              },
            },
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        ).lean();
      }
    }

    return ok(cart);
  } catch (error) {
    console.error("[CART POST]", error);
    return fail("Internal server error", 500);
  }
}

/** DELETE /api/cart — clear the entire cart */
export async function DELETE(_req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();

    await Cart.findOneAndUpdate(
      { userId: session.user.id },
      { $set: { items: [] } }
    );

    return ok({ message: "Cart cleared" });
  } catch (error) {
    console.error("[CART DELETE]", error);
    return fail("Internal server error", 500);
  }
}
