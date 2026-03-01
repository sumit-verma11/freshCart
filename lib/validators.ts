/**
 * Zod schemas for all API request bodies.
 * Centralised here so routes stay thin and schemas are reusable.
 */
import { z } from "zod";

// ─── Primitives ───────────────────────────────────────────────────────────────

const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Must be a valid 24-character ObjectId");

const pincode6 = z
  .string()
  .regex(/^\d{6}$/, "Pincode must be exactly 6 digits");

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name:     z.string().min(2).max(80),
  email:    z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  phone:    z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number").optional(),
});

// ─── Category ─────────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name:           z.string().min(1).max(100),
  slug:           z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens").optional(),
  image:          z.string().url().optional(),
  description:    z.string().max(500).optional(),
  parentCategory: objectId.optional(),
  isActive:       z.boolean().default(true),
  sortOrder:      z.number().int().min(0).default(0),
});

// ─── Product ──────────────────────────────────────────────────────────────────

const variantSchema = z.object({
  size:         z.string().min(1),
  unit:         z.string().min(1),
  mrp:          z.number().positive("MRP must be positive"),
  sellingPrice: z.number().positive("Selling price must be positive"),
  sku:          z.string().optional(),
}).refine((v) => v.sellingPrice <= v.mrp, {
  message: "sellingPrice must be ≤ mrp",
  path: ["sellingPrice"],
});

export const createProductSchema = z.object({
  name:               z.string().min(1).max(200),
  description:        z.string().min(1),
  subDescription:     z.string().optional(),
  additionalInfo:     z.string().optional(),
  allergyInfo:        z.string().optional(),
  ingredients:        z.string().optional(),
  category:           objectId,
  subCategory:        objectId.optional(),
  variants:           z.array(variantSchema).min(1, "At least one variant is required"),
  stockQty:           z.number().int().min(0).default(0),
  isAvailable:        z.boolean().default(true),
  images:             z.array(z.string().url()).default([]),
  tags:               z.array(z.string()).default([]),
  isOrganic:          z.boolean().default(false),
  isFeatured:         z.boolean().default(false),
  serviceablePincodes: z.array(pincode6).default([]),
});

export const updateProductSchema = createProductSchema.partial();

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const cartUpsertSchema = z.object({
  productId:  objectId,
  variantSku: z.string().min(1).transform((s) => s.toUpperCase()),
  qty:        z.number().int().min(0, "qty must be ≥ 0"),
});

// ─── Order ────────────────────────────────────────────────────────────────────

export const placeOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId:  objectId,
        variantSku: z.string().min(1).transform((s) => s.toUpperCase()),
        qty:        z.number().int().min(1),
      })
    )
    .min(1, "Order must have at least one item"),
  deliveryAddress: z.object({
    street:  z.string().min(1),
    city:    z.string().min(1),
    state:   z.string().min(1),
    pincode: pincode6,
  }),
  estimatedDelivery: z
    .object({
      minHours: z.number().min(0),
      maxHours: z.number().min(0),
    })
    .optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ]),
});
