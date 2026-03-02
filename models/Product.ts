import mongoose, { Schema, Document, Model } from "mongoose";
import { IProduct } from "@/types";

// ─── Document interface ───────────────────────────────────────────────────────

export interface IProductDocument extends Omit<IProduct, "_id">, Document {}

// ─── Sub-schema: Variant ──────────────────────────────────────────────────────

const VariantSchema = new Schema(
  {
    size:         { type: String, required: true, trim: true },
    unit:         { type: String, required: true, trim: true },
    mrp:          { type: Number, required: true, min: 0 },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator(this: { mrp: number }, v: number) {
          return v <= this.mrp;
        },
        message: "sellingPrice must be ≤ mrp",
      },
    },
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
  },
  { _id: true }
);

// ─── Sub-schema: NutritionFacts ───────────────────────────────────────────────

/**
 * Stored as a flexible Mixed type so arbitrary keys (vitamin C, iron, …) are
 * allowed without locking the schema. We still validate the well-known fields
 * at the TypeScript layer via INutritionFacts.
 */
const NutritionFactsSchema = new Schema(
  {
    servingSize:    { type: String },
    calories:       { type: Number, min: 0 },
    protein:        { type: Number, min: 0 },
    carbohydrates:  { type: Number, min: 0 },
    fat:            { type: Number, min: 0 },
    saturatedFat:   { type: Number, min: 0 },
    fiber:          { type: Number, min: 0 },
    sugar:          { type: Number, min: 0 },
    sodium:         { type: Number, min: 0 },
  },
  {
    _id: false,
    strict: false,  // allow extra nutrient keys (e.g. vitaminC, iron)
  }
);

// ─── Main schema ──────────────────────────────────────────────────────────────

const ProductSchema = new Schema<IProductDocument>(
  {
    // ── Identity
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,                   // index: slug (unique)
      lowercase: true,
      trim: true,
    },

    // ── Descriptions
    description:    { type: String, required: [true, "Description is required"], trim: true },
    subDescription: { type: String, trim: true },
    additionalInfo: { type: String, trim: true },

    // ── Packaged-goods
    allergyInfo:  { type: String, trim: true },
    ingredients:  { type: String, trim: true },

    // ── Taxonomy
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    subCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    // ── Media
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length >= 0,
        message: "Images must be an array of URLs",
      },
    },

    // ── Pricing & stock
    variants: {
      type: [VariantSchema],
      required: true,
      validate: {
        validator: (v: unknown[]) => v.length >= 1,
        message: "At least one variant is required",
      },
    },
    stockQty:    { type: Number, required: true, min: 0, default: 0 },
    isAvailable: { type: Boolean, default: true },

    // ── Delivery
    serviceablePincodes: { type: [String], default: [] },  // index below

    // ── Discovery
    tags:         { type: [String], default: [] },
    isFeatured:   { type: Boolean, default: false },
    isOrganic:    { type: Boolean, default: false },
    isBestseller:  { type: Boolean, default: false },
    isNewArrival:  { type: Boolean, default: false },
    isSale:        { type: Boolean, default: false },

    // ── Nutrition
    nutritionFacts: { type: NutritionFactsSchema, default: undefined },

    // ── Flash sale (optional — admin-configurable time-limited discount)
    flashSale: {
      discountPercent: { type: Number, min: 1, max: 90 },
      endsAt:          { type: Date },
    },

    // ── Ratings (denormalised)
    rating:      { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },

    // ── Audit
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Full-text search across name, description, and tags
ProductSchema.index({ name: "text", description: "text", tags: "text" });

// Filter by category with sorting
ProductSchema.index({ category: 1, isAvailable: 1 });

// Delivery serviceability check
ProductSchema.index({ serviceablePincodes: 1 });     // index: serviceablePincodes

// Featured / home page
ProductSchema.index({ isFeatured: 1, isAvailable: 1 });

// Organic filter
ProductSchema.index({ isOrganic: 1, isAvailable: 1 });

// Variant SKU uniqueness — enforced at the application layer since Mongoose
// cannot create a unique sparse index on an array sub-document field directly.
// Use ProductSchema.statics or a pre-save hook if stricter enforcement is needed.

// ─── Export ───────────────────────────────────────────────────────────────────

const Product: Model<IProductDocument> =
  mongoose.models.Product ||
  mongoose.model<IProductDocument>("Product", ProductSchema);

export default Product;
