import mongoose, { Schema, Document, Model } from "mongoose";
import { ICart } from "@/types";

// ─── Document interface ───────────────────────────────────────────────────────

export interface ICartDocument extends Omit<ICart, "_id">, Document {}

// ─── Sub-schema: CartItem ─────────────────────────────────────────────────────

const CartItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "productId is required"],
    },
    /**
     * SKU of the chosen variant (e.g. "MANGO-500G").
     * Used to resolve price, unit, and size on the frontend without
     * needing a second query.
     */
    variantSku: {
      type: String,
      required: [true, "variantSku is required"],
      trim: true,
      uppercase: true,
    },
    qty: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    /**
     * The sellingPrice captured at the moment the item was added.
     * Displayed in the cart so the user sees the price they committed to.
     * Re-validated against live price at checkout.
     */
    priceSnapshot: {
      type: Number,
      required: true,
      min: [0, "Price snapshot must be non-negative"],
    },
  },
  { _id: true }
);

// ─── Main schema ──────────────────────────────────────────────────────────────

const CartSchema = new Schema<ICartDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      unique: true,   // One cart document per user at all times
    },
    items: {
      type: [CartItemSchema],
      default: [],
    },
  },
  {
    /**
     * Only track updatedAt — there is no meaningful createdAt for a cart
     * since it is upserted (findOneAndUpdate with upsert:true).
     */
    timestamps: { createdAt: false, updatedAt: "updatedAt" },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// userId is already indexed via unique:true above.
// Additional compound index for cart-item lookup by sku.
CartSchema.index({ userId: 1, "items.variantSku": 1 });

// ─── Statics ──────────────────────────────────────────────────────────────────

CartSchema.statics.findOrCreate = async function (
  userId: mongoose.Types.ObjectId
): Promise<ICartDocument> {
  const cart = await this.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, items: [] } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return cart;
};

// ─── Export ───────────────────────────────────────────────────────────────────

const Cart: Model<ICartDocument> =
  mongoose.models.Cart || mongoose.model<ICartDocument>("Cart", CartSchema);

export default Cart;
