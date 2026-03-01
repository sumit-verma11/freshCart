import mongoose, { Schema, Document, Model } from "mongoose";
import { IOrder, OrderStatus } from "@/types";

// ─── Document interface ───────────────────────────────────────────────────────

export interface IOrderDocument extends Omit<IOrder, "_id">, Document {}

// ─── Sub-schema: OrderItem ────────────────────────────────────────────────────

const OrderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    /** SKU of the variant chosen at checkout */
    variantSku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    /** Product name snapshot — survives product deletion or rename */
    name: {
      type: String,
      required: true,
      trim: true,
    },
    qty: {
      type: Number,
      required: true,
      min: [1, "Quantity must be ≥ 1"],
    },
    /** Unit selling price at the moment the order was placed (₹) */
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }  // no _id needed on line-items
);

// ─── Sub-schema: DeliveryAddress ──────────────────────────────────────────────

const DeliveryAddressSchema = new Schema(
  {
    street:  { type: String, required: true, trim: true },
    city:    { type: String, required: true, trim: true },
    state:   { type: String, required: true, trim: true },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
  },
  { _id: false }
);

// ─── Sub-schema: EstimatedDelivery ────────────────────────────────────────────

const EstimatedDeliverySchema = new Schema(
  {
    minHours: { type: Number, required: true, min: 0 },
    maxHours: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// ─── Valid status transitions ─────────────────────────────────────────────────
//
//  pending → confirmed → out_for_delivery → delivered
//      └──────────────────────────────────→ cancelled
//
const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

// ─── Main schema ──────────────────────────────────────────────────────────────

const OrderSchema = new Schema<IOrderDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (v: unknown[]) => v.length >= 1,
        message: "Order must contain at least one item",
      },
    },
    deliveryAddress: {
      type: DeliveryAddressSchema,
      required: true,
    },
    /** Only Cash on Delivery in v1 */
    billingType: {
      type: String,
      enum: ["COD"],
      default: "COD",
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
    },
    estimatedDelivery: {
      type: EstimatedDeliverySchema,
      required: true,
    },

    // ── Financials
    totalMRP: {
      type: Number,
      required: true,
      min: 0,
      comment: "Sum of (variant.mrp × qty) for all items",
    },
    totalDiscount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      comment: "totalMRP - sum of (item.price × qty)",
    },
    deliveryCharge: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
      comment: "sum of (item.price × qty) + deliveryCharge",
    },

    placedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: "updatedAt" },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// User's order history (most recent first)
OrderSchema.index({ userId: 1, placedAt: -1 });

// Admin order management — filter by status
OrderSchema.index({ status: 1, placedAt: -1 });

// ─── Virtual: effectiveDiscount ───────────────────────────────────────────────

OrderSchema.virtual("effectiveDiscount").get(function (this: IOrderDocument) {
  return Math.max(0, this.totalMRP - (this.grandTotal - this.deliveryCharge));
});

// ─── Export ───────────────────────────────────────────────────────────────────

const Order: Model<IOrderDocument> =
  mongoose.models.Order || mongoose.model<IOrderDocument>("Order", OrderSchema);

export default Order;
