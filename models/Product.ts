import mongoose, { Schema, Document, Model } from "mongoose";
import { IProduct, ProductCategory } from "@/types";

export interface IProductDocument extends Omit<IProduct, "_id">, Document {}

const CATEGORIES: ProductCategory[] = [
  "Fruits & Vegetables",
  "Dairy & Eggs",
  "Bakery",
  "Beverages",
  "Snacks",
  "Meat & Seafood",
];

const ProductSchema = new Schema<IProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, enum: CATEGORIES },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    unit: { type: String, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    isOrganic: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    serviceablePincodes: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Text search index (slug index already created via unique:true in field definition)
ProductSchema.index({ name: "text", description: "text", tags: "text" });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ serviceablePincodes: 1 });

const Product: Model<IProductDocument> =
  mongoose.models.Product ||
  mongoose.model<IProductDocument>("Product", ProductSchema);

export default Product;
