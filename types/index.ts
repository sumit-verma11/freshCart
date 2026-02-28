import { Types } from "mongoose";

// ─── User ───────────────────────────────────────────────────────────────────

export type UserRole = "user" | "admin";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  addresses: IAddress[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddress {
  _id?: Types.ObjectId;
  label: string;       // "Home", "Work", etc.
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

// ─── Product ─────────────────────────────────────────────────────────────────

export type ProductCategory =
  | "Fruits & Vegetables"
  | "Dairy & Eggs"
  | "Bakery"
  | "Beverages"
  | "Snacks"
  | "Meat & Seafood";

export interface IProduct {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  category: ProductCategory;
  price: number;           // MRP in ₹
  salePrice?: number;      // Discounted price in ₹
  unit: string;            // "500g", "1L", "dozen", etc.
  stock: number;
  images: string[];        // Array of image URLs
  tags: string[];
  isOrganic: boolean;
  isFeatured: boolean;
  rating: number;          // 0–5
  reviewCount: number;
  serviceablePincodes: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface ICartItem {
  productId: string;
  name: string;
  price: number;
  salePrice?: number;
  image: string;
  unit: string;
  quantity: number;
  stock: number;
}

export interface ICart {
  items: ICartItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "upi" | "card" | "netbanking";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  image: string;
  unit: string;
  quantity: number;
  price: number;
  salePrice?: number;
}

export interface IOrder {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  shippingAddress: IAddress;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  notes?: string;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── API Responses ────────────────────────────────────────────────────────────

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

// ─── NextAuth augmentation ───────────────────────────────────────────────────

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
