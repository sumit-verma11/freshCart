import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Cart from "@/models/Cart";
import { ok, fail, requireAuth } from "@/lib/api";
import mongoose from "mongoose";

type Params = { params: { itemId: string } };

/** DELETE /api/cart/[itemId] — remove a single item from the cart by its _id */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { itemId } = params;
  if (!itemId.match(/^[a-f\d]{24}$/i)) return fail("Invalid item ID", 400);

  try {
    await connectDB();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { _id: new mongoose.Types.ObjectId(itemId) } } },
      { new: true }
    ).lean();

    if (!cart) return fail("Cart not found", 404);
    return ok(cart);
  } catch (error) {
    console.error("[CART ITEM DELETE]", error);
    return fail("Internal server error", 500);
  }
}
