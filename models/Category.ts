import mongoose, { Schema, Document, Model } from "mongoose";
import { ICategory } from "@/types";

// ─── Document interface ───────────────────────────────────────────────────────

export interface ICategoryDocument extends Omit<ICategory, "_id">, Document {}

// ─── Schema ───────────────────────────────────────────────────────────────────

const CategorySchema = new Schema<ICategoryDocument>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,                   // index: slug (unique)
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens only"],
    },
    image: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    /**
     * Self-referential: null = top-level category
     * ObjectId → parent = this is a subcategory
     * Supports one level of nesting (category → subcategory).
     * For deeper trees add recursive population logic in services.
     */
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Efficiently list all subcategories of a given parent
CategorySchema.index({ parentCategory: 1, sortOrder: 1 });
// Filter active categories in sorted order
CategorySchema.index({ isActive: 1, sortOrder: 1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────

/** True when this category has no parent (i.e. it is a root category) */
CategorySchema.virtual("isTopLevel").get(function (this: ICategoryDocument) {
  return this.parentCategory == null;
});

// ─── Export ───────────────────────────────────────────────────────────────────

const Category: Model<ICategoryDocument> =
  mongoose.models.Category ||
  mongoose.model<ICategoryDocument>("Category", CategorySchema);

export default Category;
