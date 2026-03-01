import { Types } from "mongoose";

// ─── Shared ───────────────────────────────────────────────────────────────────

export type UserRole = "user" | "admin";

// ─── Compatibility re-exports (used by UI layer) ──────────────────────────────

/** Legacy string-enum category — still used by add-product form and seed. */
export type ProductCategory =
  | "Fruits & Vegetables"
  | "Dairy & Eggs"
  | "Bakery"
  | "Beverages"
  | "Snacks"
  | "Meat & Seafood";

/** Payment methods available at checkout (COD + future digital methods). */
export type PaymentMethod = "COD" | "upi" | "card" | "netbanking";

// ─── Client-side cart item (Zustand store — NOT the DB Cart/ICartItem) ────────

/**
 * IClientCartItem lives only in browser memory (Zustand + localStorage).
 * It is a flat, serialisation-friendly representation used by the cart UI.
 * The DB-persisted ICartItem (above) is a separate type used by the Cart model.
 */
export interface IClientCartItem {
  productId: string;
  variantSku: string;
  name: string;
  image: string;
  unit: string;         // e.g. "500g", "1L"
  mrp: number;          // full price ₹
  sellingPrice: number; // discounted price ₹
  quantity: number;
  stock: number;        // max allowed qty
}

// ─── Address (embedded in User) ───────────────────────────────────────────────

export interface IAddress {
  _id?: Types.ObjectId;
  label: string;       // "Home" | "Work" | "Other"
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  addresses: IAddress[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  /** null = top-level category; ObjectId = subcategory pointing to parent */
  parentCategory?: Types.ObjectId | ICategory | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Product — Variant ────────────────────────────────────────────────────────

export interface IProductVariant {
  _id?: Types.ObjectId;
  size: string;          // "500" | "1" | "6" | "200" — the numeric part
  unit: string;          // "g" | "kg" | "L" | "ml" | "pcs" | "dozen"
  mrp: number;           // Maximum Retail Price in ₹
  sellingPrice: number;  // Actual sale price in ₹  (must be ≤ mrp)
  sku: string;           // Unique stock-keeping unit e.g. "MANGO-500G"
}

// ─── Product — Nutrition Facts ────────────────────────────────────────────────

export interface INutritionFacts {
  servingSize?: string;   // "100g" | "1 cup" etc.
  calories?: number;
  protein?: number;       // g
  carbohydrates?: number; // g
  fat?: number;           // g
  saturatedFat?: number;  // g
  fiber?: number;         // g
  sugar?: number;         // g
  sodium?: number;        // mg
  /** Allow arbitrary additional nutrient keys */
  [key: string]: string | number | undefined;
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface IProduct {
  _id: Types.ObjectId;
  name: string;
  slug: string;

  // Descriptions
  description: string;          // required — main marketing copy
  subDescription?: string;      // optional — secondary blurb
  additionalInfo?: string;      // optional — storage, usage notes
  allergyInfo?: string;         // optional — "Contains nuts, gluten"
  ingredients?: string;         // optional — packaged goods

  // Taxonomy
  category: Types.ObjectId | ICategory;
  subCategory?: Types.ObjectId | ICategory | null;

  // Media
  images: string[];             // array of URLs; first = primary

  // Pricing & stock (at least one variant required)
  variants: IProductVariant[];
  stockQty: number;
  isAvailable: boolean;

  // Delivery
  serviceablePincodes: string[];

  // Discovery
  tags: string[];
  isFeatured: boolean;
  isOrganic: boolean;

  // Nutrition (optional — packaged goods only)
  nutritionFacts?: INutritionFacts;

  // Ratings (denormalised for read performance)
  rating: number;        // 0–5, two decimal places
  reviewCount: number;

  // Audit
  createdBy: Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface ICartItem {
  _id?: Types.ObjectId;
  productId: Types.ObjectId | IProduct;
  variantSku: string;
  qty: number;
  /** Price locked in when the item was added to the cart (₹) */
  priceSnapshot: number;
}

export interface ICart {
  _id: Types.ObjectId;
  userId: Types.ObjectId | IUser;
  items: ICartItem[];
  updatedAt: Date;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

/** Billing type — only COD supported in v1 */
export type BillingType = "COD";

export interface IOrderItem {
  productId: Types.ObjectId | IProduct;
  variantSku: string;
  name: string;           // snapshot at order time
  qty: number;
  price: number;          // unit price at order time (₹)
}

export interface IDeliveryAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IEstimatedDelivery {
  minHours: number;       // e.g. 2  → "2–4 hours"
  maxHours: number;       // e.g. 4
}

export interface IOrder {
  _id: Types.ObjectId;
  userId: Types.ObjectId | IUser;
  orderNumber: string;
  items: IOrderItem[];
  deliveryAddress: IDeliveryAddress;
  billingType: BillingType;
  status: OrderStatus;
  estimatedDelivery: IEstimatedDelivery;
  totalMRP: number;         // sum of item.mrp * qty
  totalDiscount: number;    // totalMRP - sum of item.price * qty
  deliveryCharge: number;   // 0 if above free-delivery threshold
  grandTotal: number;       // sum of item.price * qty + deliveryCharge
  placedAt: Date;
  updatedAt: Date;
}

// ─── Pincode ──────────────────────────────────────────────────────────────────

export interface IPincode {
  _id: Types.ObjectId;
  pincode: string;        // 6-digit, unique
  area: string;
  city: string;
  state: string;
  isServiceable: boolean;
  estimatedDeliveryHours: {
    min: number;          // e.g. 2
    max: number;          // e.g. 4
  };
  createdAt: Date;
  updatedAt: Date;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── NextAuth augmentation ────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
    };
  }
  interface User {
    id: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
