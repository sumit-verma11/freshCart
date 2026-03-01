/**
 * FreshCart Seed Script — complete rewrite
 * Populates MongoDB with realistic Indian grocery data.
 * Idempotent: skips if products already exist.
 *
 * Run:  npm run seed
 *       npx ts-node --project tsconfig.seed.json lib/seed.ts
 */

import mongoose, { Types } from "mongoose";
import bcrypt from "bcryptjs";

const MONGO_URI =
  process.env.MONGO_URI ??
  "mongodb://freshcart_admin:freshcart_secret@localhost:27017/freshcart?authSource=admin";

// ─── Inline schemas (mirrors production models exactly) ───────────────────────

const UserSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true },
    email:        { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role:         { type: String, enum: ["user", "admin"], default: "user" },
    phone:        { type: String },
    addresses:    { type: Array, default: [] },
  },
  { timestamps: true }
);

const CategorySchema = new mongoose.Schema(
  {
    name:           { type: String, required: true },
    slug:           { type: String, required: true, unique: true, lowercase: true },
    image:          { type: String },
    description:    { type: String },
    parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    isActive:       { type: Boolean, default: true },
    sortOrder:      { type: Number, default: 0 },
  },
  { timestamps: true }
);

const PincodeSchema = new mongoose.Schema(
  {
    pincode:                { type: String, required: true, unique: true },
    area:                   { type: String, required: true },
    city:                   { type: String, required: true },
    state:                  { type: String, required: true },
    isServiceable:          { type: Boolean, default: true },
    estimatedDeliveryHours: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

const VariantSchema = new mongoose.Schema(
  {
    size:         { type: String, required: true },
    unit:         { type: String, required: true },
    mrp:          { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    sku:          { type: String, required: true },
  },
  { _id: true }
);

const ProductSchema = new mongoose.Schema(
  {
    name:                { type: String, required: true },
    slug:                { type: String, required: true, unique: true, lowercase: true },
    description:         { type: String, required: true },
    subDescription:      { type: String },
    additionalInfo:      { type: String },
    allergyInfo:         { type: String },
    ingredients:         { type: String },
    category:            { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    subCategory:         { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    images:              { type: [String], default: [] },
    variants:            { type: [VariantSchema], required: true },
    stockQty:            { type: Number, required: true, default: 0 },
    isAvailable:         { type: Boolean, default: true },
    serviceablePincodes: { type: [String], default: [] },
    tags:                { type: [String], default: [] },
    isFeatured:          { type: Boolean, default: false },
    isOrganic:           { type: Boolean, default: false },
    rating:              { type: Number, default: 0 },
    reviewCount:         { type: Number, default: 0 },
    createdBy:           { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const UserModel     = mongoose.models.User     ?? mongoose.model("User",     UserSchema);
const CategoryModel = mongoose.models.Category ?? mongoose.model("Category", CategorySchema);
const PincodeModel  = mongoose.models.Pincode  ?? mongoose.model("Pincode",  PincodeSchema);
const ProductModel  = mongoose.models.Product  ?? mongoose.model("Product",  ProductSchema);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function pick<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));
}

function makeSku(slug: string, size: string, unit: string): string {
  const code = slug.replace(/-/g, "").substring(0, 10).toUpperCase();
  return `${code}-${size}${unit.toUpperCase()}`;
}

// ─── Pincode seed data ────────────────────────────────────────────────────────

const PINCODES = [
  { pincode: "400001", area: "CST / Fort",       city: "Mumbai",    state: "Maharashtra", isServiceable: true, estimatedDeliveryHours: { min: 1, max: 2 } },
  { pincode: "400051", area: "Bandra West",       city: "Mumbai",    state: "Maharashtra", isServiceable: true, estimatedDeliveryHours: { min: 1, max: 3 } },
  { pincode: "110001", area: "Connaught Place",   city: "New Delhi", state: "Delhi",       isServiceable: true, estimatedDeliveryHours: { min: 2, max: 4 } },
  { pincode: "560001", area: "MG Road",           city: "Bangalore", state: "Karnataka",   isServiceable: true, estimatedDeliveryHours: { min: 2, max: 4 } },
  { pincode: "600001", area: "Chennai GPO",       city: "Chennai",   state: "Tamil Nadu",  isServiceable: true, estimatedDeliveryHours: { min: 2, max: 4 } },
  { pincode: "700001", area: "Kolkata GPO",       city: "Kolkata",   state: "West Bengal", isServiceable: true, estimatedDeliveryHours: { min: 3, max: 6 } },
  { pincode: "500001", area: "Hyderabad GPO",     city: "Hyderabad", state: "Telangana",   isServiceable: true, estimatedDeliveryHours: { min: 2, max: 4 } },
  { pincode: "411001", area: "Pune GPO",          city: "Pune",      state: "Maharashtra", isServiceable: true, estimatedDeliveryHours: { min: 2, max: 3 } },
  { pincode: "380001", area: "Ahmedabad GPO",     city: "Ahmedabad", state: "Gujarat",     isServiceable: true, estimatedDeliveryHours: { min: 3, max: 5 } },
  { pincode: "302001", area: "Jaipur GPO",        city: "Jaipur",    state: "Rajasthan",   isServiceable: true, estimatedDeliveryHours: { min: 3, max: 6 } },
];

const PINCODE_CODES = PINCODES.map((p) => p.pincode);

// ─── User seed data ───────────────────────────────────────────────────────────

const USERS_SEED = [
  { name: "Admin User",    email: "admin@freshcart.com",  password: "Admin@123",  role: "admin", phone: "9876543210" },
  { name: "Test User",     email: "user@freshcart.com",   password: "User@123",   role: "user",  phone: "9876543211" },
  { name: "Arjun Mehta",  email: "arjun@example.com",    password: "Arjun@123",  role: "user",  phone: "9876001001" },
  { name: "Sunita Patel", email: "sunita@example.com",   password: "Sunita@123", role: "user",  phone: "9876001002" },
  { name: "Vikram Nair",  email: "vikram@example.com",   password: "Vikram@123", role: "user",  phone: "9876001003" },
  { name: "Deepika Iyer", email: "deepika@example.com",  password: "Deep@123",   role: "user",  phone: "9876001004" },
];

// ─── Category seed data ───────────────────────────────────────────────────────

const CATEGORY_DEFS = [
  {
    slug: "fruits-vegetables", name: "Fruits & Vegetables",
    description: "Fresh farm produce delivered daily",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400",
    sortOrder: 1,
    subs: [
      { slug: "fresh-fruits",     name: "Fresh Fruits",       sortOrder: 1 },
      { slug: "fresh-vegetables", name: "Fresh Vegetables",   sortOrder: 2 },
      { slug: "herbs-seasonings", name: "Herbs & Seasonings", sortOrder: 3 },
    ],
  },
  {
    slug: "dairy-eggs", name: "Dairy & Eggs",
    description: "Pure dairy from trusted farms",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400",
    sortOrder: 2,
    subs: [
      { slug: "milk",            name: "Milk",              sortOrder: 1 },
      { slug: "paneer-tofu",     name: "Paneer & Tofu",     sortOrder: 2 },
      { slug: "curd-buttermilk", name: "Curd & Buttermilk", sortOrder: 3 },
      { slug: "eggs",            name: "Eggs",              sortOrder: 4 },
      { slug: "butter-cheese",   name: "Butter & Cheese",   sortOrder: 5 },
    ],
  },
  {
    slug: "bakery-breads", name: "Bakery & Breads",
    description: "Freshly baked every morning",
    image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=400",
    sortOrder: 3,
    subs: [
      { slug: "breads",           name: "Breads",             sortOrder: 1 },
      { slug: "cakes-pastries",   name: "Cakes & Pastries",   sortOrder: 2 },
      { slug: "biscuits-cookies", name: "Biscuits & Cookies", sortOrder: 3 },
    ],
  },
  {
    slug: "beverages", name: "Beverages",
    description: "Refreshing drinks for every mood",
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400",
    sortOrder: 4,
    subs: [
      { slug: "juices",      name: "Juices",       sortOrder: 1 },
      { slug: "cold-drinks", name: "Cold Drinks",  sortOrder: 2 },
      { slug: "tea-coffee",  name: "Tea & Coffee", sortOrder: 3 },
      { slug: "water-soda",  name: "Water & Soda", sortOrder: 4 },
    ],
  },
  {
    slug: "snacks-branded", name: "Snacks & Branded Foods",
    description: "Your favourite branded snacks and instant foods",
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400",
    sortOrder: 5,
    subs: [
      { slug: "chips-namkeen",   name: "Chips & Namkeen",  sortOrder: 1 },
      { slug: "instant-noodles", name: "Instant Noodles",  sortOrder: 2 },
      { slug: "ready-to-eat",    name: "Ready to Eat",     sortOrder: 3 },
    ],
  },
  {
    slug: "meat-seafood", name: "Meat & Seafood",
    description: "Fresh, hygienic, and antibiotic-free meat",
    image: "https://images.unsplash.com/photo-1615937722923-67f6deaf2cc9?w=400",
    sortOrder: 6,
    subs: [
      { slug: "chicken",      name: "Chicken", sortOrder: 1 },
      { slug: "fish",         name: "Fish",    sortOrder: 2 },
      { slug: "poultry-eggs", name: "Eggs",    sortOrder: 3 },
    ],
  },
];

// ─── Product seed data ────────────────────────────────────────────────────────

interface VariantDef { size: string; unit: string; mrp: number; sellingPrice: number }
interface ProductDef {
  name: string; description: string;
  subDescription?: string; additionalInfo?: string;
  allergyInfo?: string; ingredients?: string;
  catSlug: string; subSlug: string;
  images: string[];
  variants: VariantDef[];
  stockQty: number; isOrganic: boolean; isFeatured: boolean;
  tags: string[]; rating: number; reviewCount: number;
  pincodeCount: number;
}

const PRODUCTS_DEF: ProductDef[] = [

  // ═══ Fruits & Vegetables → Fresh Fruits (4) ═══════════════════════════════
  {
    name: "Organic Alphonso Mangoes",
    description: "Premium Ratnagiri Alphonso mangoes, hand-picked at peak ripeness. Rich, creamy pulp with irresistible aroma.",
    subDescription: "Sourced directly from GI-tagged farms in Ratnagiri, Maharashtra.",
    catSlug: "fruits-vegetables", subSlug: "fresh-fruits",
    images: ["https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600"],
    variants: [
      { size: "1",  unit: "kg", mrp: 650,  sellingPrice: 549 },
      { size: "3",  unit: "kg", mrp: 1800, sellingPrice: 1449 },
    ],
    stockQty: 80, isOrganic: true, isFeatured: true,
    tags: ["mango", "alphonso", "fruit", "seasonal", "ratnagiri"],
    rating: 4.8, reviewCount: 342, pincodeCount: 8,
  },
  {
    name: "Royal Gala Apples",
    description: "Imported Royal Gala apples — perfectly sweet with a firm bite. Ideal for snacking and fruit salads.",
    catSlug: "fruits-vegetables", subSlug: "fresh-fruits",
    images: ["https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600"],
    variants: [
      { size: "1",  unit: "kg", mrp: 250,  sellingPrice: 219 },
      { size: "2",  unit: "kg", mrp: 480,  sellingPrice: 399 },
    ],
    stockQty: 60, isOrganic: false, isFeatured: true,
    tags: ["apple", "imported", "fruit", "gala"],
    rating: 4.6, reviewCount: 178, pincodeCount: 7,
  },
  {
    name: "Seedless Watermelon",
    description: "Jumbo seedless watermelon — naturally sweet and hydrating. The perfect summer refreshment.",
    catSlug: "fruits-vegetables", subSlug: "fresh-fruits",
    images: ["https://images.unsplash.com/photo-1563114773-84221bd62daa?w=600"],
    variants: [
      { size: "1",  unit: "pc", mrp: 170,  sellingPrice: 149 },
    ],
    stockQty: 45, isOrganic: false, isFeatured: false,
    tags: ["watermelon", "fruit", "summer", "seedless"],
    rating: 4.7, reviewCount: 203, pincodeCount: 6,
  },
  {
    name: "Mixed Berries Pack",
    description: "Imported blueberries, strawberries & raspberries. Antioxidant-rich, perfect for desserts or breakfast.",
    allergyInfo: "May contain traces of tree nuts from shared packaging lines.",
    catSlug: "fruits-vegetables", subSlug: "fresh-fruits",
    images: ["https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600"],
    variants: [
      { size: "200", unit: "g",  mrp: 449,  sellingPrice: 379 },
      { size: "400", unit: "g",  mrp: 849,  sellingPrice: 699 },
    ],
    stockQty: 35, isOrganic: false, isFeatured: true,
    tags: ["berries", "blueberry", "strawberry", "imported", "antioxidant"],
    rating: 4.8, reviewCount: 112, pincodeCount: 5,
  },

  // ═══ Fruits & Vegetables → Fresh Vegetables (4) ═══════════════════════════
  {
    name: "Fresh Spinach (Palak)",
    description: "Farm-fresh tender spinach leaves packed with iron and vitamins. Perfect for saag, smoothies, and salads.",
    catSlug: "fruits-vegetables", subSlug: "fresh-vegetables",
    images: ["https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600"],
    variants: [
      { size: "250", unit: "g",  mrp: 29,   sellingPrice: 25 },
      { size: "500", unit: "g",  mrp: 55,   sellingPrice: 45 },
    ],
    stockQty: 150, isOrganic: true, isFeatured: false,
    tags: ["spinach", "palak", "leafy", "greens", "organic"],
    rating: 4.5, reviewCount: 128, pincodeCount: 9,
  },
  {
    name: "Country Tomatoes",
    description: "Vine-ripened desi tomatoes with deep colour and tangy flavour. Essential for every Indian kitchen.",
    catSlug: "fruits-vegetables", subSlug: "fresh-vegetables",
    images: ["https://images.unsplash.com/photo-1546470427-e26264be0b11?w=600"],
    variants: [
      { size: "500", unit: "g",  mrp: 35,   sellingPrice: 30 },
      { size: "1",   unit: "kg", mrp: 65,   sellingPrice: 55 },
    ],
    stockQty: 200, isOrganic: false, isFeatured: false,
    tags: ["tomato", "vegetable", "desi", "sabzi"],
    rating: 4.2, reviewCount: 215, pincodeCount: 10,
  },
  {
    name: "Organic Cauliflower",
    description: "Fresh organic cauliflower, pesticide-free. Perfect for aloo gobi, soups, and rice dishes.",
    catSlug: "fruits-vegetables", subSlug: "fresh-vegetables",
    images: ["https://images.unsplash.com/photo-1568584711271-6c929fb49b60?w=600"],
    variants: [
      { size: "1",   unit: "pc", mrp: 75,   sellingPrice: 59 },
    ],
    stockQty: 90, isOrganic: true, isFeatured: false,
    tags: ["cauliflower", "gobi", "organic", "vegetable"],
    rating: 4.4, reviewCount: 67, pincodeCount: 7,
  },
  {
    name: "Baby Potatoes",
    description: "Tender baby potatoes with thin skin. Roast, boil, or fry — perfectly versatile for any recipe.",
    catSlug: "fruits-vegetables", subSlug: "fresh-vegetables",
    images: ["https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600"],
    variants: [
      { size: "500", unit: "g",  mrp: 45,   sellingPrice: 39 },
      { size: "1",   unit: "kg", mrp: 85,   sellingPrice: 72 },
    ],
    stockQty: 180, isOrganic: false, isFeatured: false,
    tags: ["potato", "baby potato", "vegetable"],
    rating: 4.1, reviewCount: 94, pincodeCount: 8,
  },

  // ═══ Fruits & Vegetables → Herbs & Seasonings (1) ════════════════════════
  {
    name: "Fresh Coriander (Dhania)",
    description: "Bunches of fresh, fragrant coriander leaves. Essential for chutneys, garnishing, and curries.",
    catSlug: "fruits-vegetables", subSlug: "herbs-seasonings",
    images: ["https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600"],
    variants: [
      { size: "1",   unit: "bunch", mrp: 15,   sellingPrice: 12 },
      { size: "3",   unit: "bunch", mrp: 40,   sellingPrice: 33 },
    ],
    stockQty: 200, isOrganic: true, isFeatured: false,
    tags: ["coriander", "dhania", "herb", "garnish"],
    rating: 4.6, reviewCount: 89, pincodeCount: 9,
  },

  // ═══ Dairy & Eggs → Milk (2) ══════════════════════════════════════════════
  {
    name: "Amul Taaza Toned Milk",
    description: "Fresh Amul toned milk, 3% fat, pasteurised and homogenised. Rich in calcium and protein.",
    ingredients: "Toned Milk",
    allergyInfo: "Contains milk and milk products.",
    catSlug: "dairy-eggs", subSlug: "milk",
    images: ["https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600"],
    variants: [
      { size: "500",  unit: "ml", mrp: 30,   sellingPrice: 28 },
      { size: "1000", unit: "ml", mrp: 60,   sellingPrice: 57 },
    ],
    stockQty: 300, isOrganic: false, isFeatured: false,
    tags: ["milk", "amul", "toned milk", "dairy"],
    rating: 4.6, reviewCount: 512, pincodeCount: 10,
  },
  {
    name: "Organic Full Cream Milk",
    description: "Certified organic full cream milk from grass-fed desi cows. Richer taste, naturally A2 protein.",
    allergyInfo: "Contains milk and milk products.",
    catSlug: "dairy-eggs", subSlug: "milk",
    images: ["https://images.unsplash.com/photo-1517093702194-2a75bb64b57d?w=600"],
    variants: [
      { size: "500",  unit: "ml", mrp: 45,   sellingPrice: 42 },
      { size: "1000", unit: "ml", mrp: 85,   sellingPrice: 79 },
    ],
    stockQty: 150, isOrganic: true, isFeatured: true,
    tags: ["milk", "organic", "full cream", "a2", "desi cow"],
    rating: 4.8, reviewCount: 234, pincodeCount: 8,
  },

  // ═══ Dairy & Eggs → Paneer & Tofu (2) ════════════════════════════════════
  {
    name: "Fresh Paneer",
    description: "Soft, fresh homestyle paneer made from full-fat cow milk. Perfect for paneer butter masala, tikka, and bhurji.",
    allergyInfo: "Contains milk and milk products.",
    catSlug: "dairy-eggs", subSlug: "paneer-tofu",
    images: ["https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600"],
    variants: [
      { size: "200",  unit: "g",  mrp: 115,  sellingPrice: 99 },
      { size: "500",  unit: "g",  mrp: 270,  sellingPrice: 239 },
    ],
    stockQty: 150, isOrganic: false, isFeatured: true,
    tags: ["paneer", "cottage cheese", "dairy"],
    rating: 4.7, reviewCount: 389, pincodeCount: 9,
  },
  {
    name: "Organic Firm Tofu",
    description: "High-protein firm tofu made from non-GMO soybeans. Great for stir-fries, curries, and grilling.",
    ingredients: "Organic Soybeans, Water, Calcium Sulphate (Coagulant)",
    allergyInfo: "Contains soy.",
    catSlug: "dairy-eggs", subSlug: "paneer-tofu",
    images: ["https://images.unsplash.com/photo-1622480916113-9000ac49b79d?w=600"],
    variants: [
      { size: "300", unit: "g",  mrp: 149,  sellingPrice: 129 },
    ],
    stockQty: 80, isOrganic: true, isFeatured: false,
    tags: ["tofu", "soy", "vegan", "protein", "plant-based"],
    rating: 4.4, reviewCount: 156, pincodeCount: 6,
  },

  // ═══ Dairy & Eggs → Curd & Buttermilk (2) ════════════════════════════════
  {
    name: "Organic Set Dahi",
    description: "Set dahi made from organic full-fat milk. Thick, creamy, with a pleasant tang — just like homemade.",
    allergyInfo: "Contains milk and milk products.",
    catSlug: "dairy-eggs", subSlug: "curd-buttermilk",
    images: ["https://images.unsplash.com/photo-1571212515416-fca988b73a36?w=600"],
    variants: [
      { size: "400", unit: "g",  mrp: 75,   sellingPrice: 65 },
      { size: "1",   unit: "kg", mrp: 175,  sellingPrice: 155 },
    ],
    stockQty: 180, isOrganic: true, isFeatured: false,
    tags: ["curd", "dahi", "yogurt", "probiotic", "organic"],
    rating: 4.5, reviewCount: 231, pincodeCount: 9,
  },
  {
    name: "Spiced Masala Chaas",
    description: "Chilled, mildly spiced buttermilk with roasted jeera and rock salt. A traditional digestive drink.",
    allergyInfo: "Contains milk and milk products.",
    catSlug: "dairy-eggs", subSlug: "curd-buttermilk",
    images: ["https://images.unsplash.com/photo-1600718374662-0483d2b9da44?w=600"],
    variants: [
      { size: "200", unit: "ml", mrp: 30,   sellingPrice: 25 },
      { size: "500", unit: "ml", mrp: 65,   sellingPrice: 55 },
    ],
    stockQty: 120, isOrganic: false, isFeatured: false,
    tags: ["chaas", "buttermilk", "lassi", "digestive", "refreshing"],
    rating: 4.6, reviewCount: 167, pincodeCount: 8,
  },

  // ═══ Dairy & Eggs → Eggs (1) ══════════════════════════════════════════════
  {
    name: "Farm Fresh Eggs",
    description: "Free-range white eggs, fresh from the farm. High protein, rich yolk. Available in packs of 6 or 12.",
    catSlug: "dairy-eggs", subSlug: "eggs",
    images: ["https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600"],
    variants: [
      { size: "6",   unit: "pc", mrp: 48,   sellingPrice: 42 },
      { size: "12",  unit: "pc", mrp: 92,   sellingPrice: 82 },
    ],
    stockQty: 200, isOrganic: false, isFeatured: false,
    tags: ["eggs", "white eggs", "protein", "farm fresh"],
    rating: 4.5, reviewCount: 334, pincodeCount: 10,
  },

  // ═══ Dairy & Eggs → Butter & Cheese (2) ══════════════════════════════════
  {
    name: "Amul Butter Salted",
    description: "Classic Amul salted butter — the taste of India. Perfect for toast, rotis, and baking.",
    allergyInfo: "Contains milk and milk products.",
    ingredients: "Milk Fat, Common Salt",
    catSlug: "dairy-eggs", subSlug: "butter-cheese",
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"],
    variants: [
      { size: "100", unit: "g",  mrp: 62,   sellingPrice: 58 },
      { size: "500", unit: "g",  mrp: 295,  sellingPrice: 275 },
    ],
    stockQty: 250, isOrganic: false, isFeatured: false,
    tags: ["butter", "amul", "salted butter", "dairy"],
    rating: 4.7, reviewCount: 445, pincodeCount: 10,
  },
  {
    name: "Mozzarella Cheese Block",
    description: "Premium Italian-style mozzarella. Melts beautifully on pizzas and grilled sandwiches.",
    allergyInfo: "Contains milk. May contain traces of other dairy products.",
    ingredients: "Pasteurised Cow Milk, Salt, Bacterial Culture, Microbial Rennet",
    catSlug: "dairy-eggs", subSlug: "butter-cheese",
    images: ["https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=600"],
    variants: [
      { size: "200", unit: "g",  mrp: 320,  sellingPrice: 279 },
      { size: "500", unit: "g",  mrp: 749,  sellingPrice: 649 },
    ],
    stockQty: 60, isOrganic: false, isFeatured: false,
    tags: ["cheese", "mozzarella", "pizza", "italian", "dairy"],
    rating: 4.6, reviewCount: 143, pincodeCount: 7,
  },

  // ═══ Bakery & Breads → Breads (3) ════════════════════════════════════════
  {
    name: "Whole Wheat Sandwich Bread",
    description: "Soft whole wheat sandwich bread with no maida. Rich in fibre, baked fresh every morning.",
    allergyInfo: "Contains wheat and gluten. Baked in a facility that also handles nuts and milk.",
    ingredients: "Whole Wheat Flour, Water, Yeast, Salt, Sugar, Vegetable Oil",
    catSlug: "bakery-breads", subSlug: "breads",
    images: ["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600"],
    variants: [
      { size: "400", unit: "g",  mrp: 60,   sellingPrice: 55 },
      { size: "800", unit: "g",  mrp: 115,  sellingPrice: 105 },
    ],
    stockQty: 100, isOrganic: false, isFeatured: false,
    tags: ["bread", "whole wheat", "sandwich", "healthy", "fibre"],
    rating: 4.4, reviewCount: 267, pincodeCount: 9,
  },
  {
    name: "Artisan Sourdough Loaf",
    description: "Artisan sourdough with a crispy crust and chewy crumb. Slow-fermented for 24 hours for deep flavour.",
    allergyInfo: "Contains wheat and gluten.",
    ingredients: "Organic Wheat Flour, Water, Sea Salt, Wild Yeast Starter",
    catSlug: "bakery-breads", subSlug: "breads",
    images: ["https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600"],
    variants: [
      { size: "600", unit: "g",  mrp: 310,  sellingPrice: 265 },
    ],
    stockQty: 30, isOrganic: false, isFeatured: true,
    tags: ["sourdough", "artisan", "bread", "fermented"],
    rating: 4.9, reviewCount: 154, pincodeCount: 5,
  },
  {
    name: "Mumbai Pav (Dinner Rolls)",
    description: "Soft Mumbai-style pav, freshly baked. Essential for bhaji pav, vada pav, and keema pav.",
    allergyInfo: "Contains wheat and gluten. May contain milk.",
    catSlug: "bakery-breads", subSlug: "breads",
    images: ["https://images.unsplash.com/photo-1568471173242-461f0a730452?w=600"],
    variants: [
      { size: "6",   unit: "pc", mrp: 40,   sellingPrice: 35 },
      { size: "12",  unit: "pc", mrp: 75,   sellingPrice: 68 },
    ],
    stockQty: 150, isOrganic: false, isFeatured: false,
    tags: ["pav", "dinner rolls", "mumbai", "soft"],
    rating: 4.6, reviewCount: 378, pincodeCount: 8,
  },

  // ═══ Bakery & Breads → Cakes & Pastries (3) ══════════════════════════════
  {
    name: "Chocolate Croissants",
    description: "Buttery, flaky croissants filled with rich dark chocolate. Freshly baked daily.",
    allergyInfo: "Contains wheat, gluten, milk, eggs, and soy lecithin.",
    catSlug: "bakery-breads", subSlug: "cakes-pastries",
    images: ["https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=600"],
    variants: [
      { size: "2",   unit: "pc", mrp: 180,  sellingPrice: 155 },
      { size: "4",   unit: "pc", mrp: 349,  sellingPrice: 299 },
    ],
    stockQty: 50, isOrganic: false, isFeatured: true,
    tags: ["croissant", "chocolate", "pastry", "bakery"],
    rating: 4.8, reviewCount: 212, pincodeCount: 6,
  },
  {
    name: "Banana Walnut Muffins",
    description: "Moist banana muffins loaded with crunchy walnuts. A wholesome snack baked fresh every morning.",
    allergyInfo: "Contains wheat, eggs, milk, and tree nuts (walnuts).",
    catSlug: "bakery-breads", subSlug: "cakes-pastries",
    images: ["https://images.unsplash.com/photo-1604882737273-3b0c9765b7d5?w=600"],
    variants: [
      { size: "2",   unit: "pc", mrp: 90,   sellingPrice: 79 },
      { size: "4",   unit: "pc", mrp: 175,  sellingPrice: 149 },
    ],
    stockQty: 60, isOrganic: false, isFeatured: false,
    tags: ["muffin", "banana", "walnut", "snack", "bakery"],
    rating: 4.5, reviewCount: 167, pincodeCount: 7,
  },
  {
    name: "Black Forest Pastry",
    description: "Classic Black Forest pastry with layers of chocolate sponge, cherries, and fresh cream.",
    allergyInfo: "Contains wheat, eggs, milk, and cherries.",
    catSlug: "bakery-breads", subSlug: "cakes-pastries",
    images: ["https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600"],
    variants: [
      { size: "1",   unit: "pc", mrp: 120,  sellingPrice: 99 },
    ],
    stockQty: 40, isOrganic: false, isFeatured: false,
    tags: ["cake", "pastry", "black forest", "chocolate", "cream"],
    rating: 4.7, reviewCount: 198, pincodeCount: 6,
  },

  // ═══ Bakery & Breads → Biscuits & Cookies (2) ════════════════════════════
  {
    name: "Oatmeal Raisin Cookies",
    description: "Soft and chewy oatmeal cookies packed with juicy raisins. No artificial colours or flavours.",
    allergyInfo: "Contains wheat, oats, eggs, and milk. May contain nuts.",
    ingredients: "Oats, Whole Wheat Flour, Raisins, Brown Sugar, Butter, Eggs, Vanilla",
    catSlug: "bakery-breads", subSlug: "biscuits-cookies",
    images: ["https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600"],
    variants: [
      { size: "150", unit: "g",  mrp: 135,  sellingPrice: 115 },
      { size: "300", unit: "g",  mrp: 259,  sellingPrice: 219 },
    ],
    stockQty: 100, isOrganic: false, isFeatured: false,
    tags: ["cookies", "oatmeal", "raisin", "bakery", "healthy"],
    rating: 4.5, reviewCount: 189, pincodeCount: 7,
  },
  {
    name: "Dark Choco Chip Biscuits",
    description: "Crispy biscuits studded with dark chocolate chips. The perfect companion for your evening chai.",
    allergyInfo: "Contains wheat, milk, soy lecithin, and cocoa.",
    ingredients: "Refined Flour, Dark Chocolate Chips (30%), Sugar, Vegetable Oil, Salt, Baking Powder",
    catSlug: "bakery-breads", subSlug: "biscuits-cookies",
    images: ["https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600"],
    variants: [
      { size: "100", unit: "g",  mrp: 85,   sellingPrice: 75 },
      { size: "250", unit: "g",  mrp: 199,  sellingPrice: 175 },
    ],
    stockQty: 150, isOrganic: false, isFeatured: false,
    tags: ["biscuits", "chocolate chip", "cookies", "snack", "chai"],
    rating: 4.4, reviewCount: 156, pincodeCount: 8,
  },

  // ═══ Beverages → Juices (2) ═══════════════════════════════════════════════
  {
    name: "Cold Pressed Orange Juice",
    description: "100% fresh-squeezed orange juice, cold-pressed to retain maximum nutrients. No added sugar or preservatives.",
    ingredients: "100% Fresh Oranges",
    allergyInfo: "No common allergens. Contains citrus fruit.",
    catSlug: "beverages", subSlug: "juices",
    images: ["https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600"],
    variants: [
      { size: "250", unit: "ml", mrp: 99,   sellingPrice: 85 },
      { size: "500", unit: "ml", mrp: 190,  sellingPrice: 165 },
    ],
    stockQty: 80, isOrganic: true, isFeatured: true,
    tags: ["juice", "orange", "cold pressed", "vitamin c", "fresh"],
    rating: 4.8, reviewCount: 234, pincodeCount: 8,
  },
  {
    name: "Mixed Fruit Juice Tetra Pack",
    description: "A delicious blend of mango, guava, pineapple, and orange. Packed with vitamins, no artificial colours.",
    ingredients: "Mixed Fruit Juice Concentrate (Mango, Guava, Pineapple, Orange), Water, Sugar, Citric Acid",
    allergyInfo: "No common allergens.",
    catSlug: "beverages", subSlug: "juices",
    images: ["https://images.unsplash.com/photo-1581375321224-79da6fd32442?w=600"],
    variants: [
      { size: "200",  unit: "ml", mrp: 35,   sellingPrice: 30 },
      { size: "1000", unit: "ml", mrp: 120,  sellingPrice: 105 },
    ],
    stockQty: 150, isOrganic: false, isFeatured: false,
    tags: ["juice", "mixed fruit", "tetra pack", "vitamin"],
    rating: 4.3, reviewCount: 189, pincodeCount: 9,
  },

  // ═══ Beverages → Cold Drinks (1) ═════════════════════════════════════════
  {
    name: "Sparkling Lime Water",
    description: "Refreshing carbonated lime water with real lime juice. Zero sugar, zero calories — a guilt-free fizz.",
    ingredients: "Carbonated Water, Lime Juice (5%), Salt, Black Pepper Extract",
    allergyInfo: "No common allergens.",
    catSlug: "beverages", subSlug: "cold-drinks",
    images: ["https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=600"],
    variants: [
      { size: "250", unit: "ml", mrp: 40,   sellingPrice: 35 },
      { size: "500", unit: "ml", mrp: 75,   sellingPrice: 65 },
    ],
    stockQty: 200, isOrganic: false, isFeatured: false,
    tags: ["sparkling water", "lime", "fizzy", "zero sugar", "refreshing"],
    rating: 4.4, reviewCount: 145, pincodeCount: 8,
  },

  // ═══ Beverages → Tea & Coffee (3) ════════════════════════════════════════
  {
    name: "Masala Chai Premix",
    description: "Authentic masala chai premix with ginger, cardamom, and cinnamon. Just add hot water or milk.",
    ingredients: "Sugar, Milk Solids, Tea Powder, Ginger Extract, Cardamom, Cinnamon, Black Pepper",
    allergyInfo: "Contains milk. May contain traces of soy.",
    catSlug: "beverages", subSlug: "tea-coffee",
    images: ["https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=600"],
    variants: [
      { size: "200", unit: "g",  mrp: 220,  sellingPrice: 185 },
      { size: "500", unit: "g",  mrp: 499,  sellingPrice: 429 },
    ],
    stockQty: 120, isOrganic: false, isFeatured: true,
    tags: ["chai", "tea", "masala chai", "premix", "ginger"],
    rating: 4.7, reviewCount: 428, pincodeCount: 10,
  },
  {
    name: "Cold Brew Coffee Bottle",
    description: "Smooth, low-acid cold brew coffee steeped for 18 hours. Ready to drink, no bitterness.",
    ingredients: "Water, Single-Origin Arabica Coffee (10%)",
    allergyInfo: "No common allergens. Contains caffeine.",
    catSlug: "beverages", subSlug: "tea-coffee",
    images: ["https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600"],
    variants: [
      { size: "350", unit: "ml", mrp: 270,  sellingPrice: 235 },
    ],
    stockQty: 60, isOrganic: false, isFeatured: false,
    tags: ["coffee", "cold brew", "caffeine", "arabica", "ready-to-drink"],
    rating: 4.6, reviewCount: 167, pincodeCount: 7,
  },
  {
    name: "Green Tea Tulsi Ginger",
    description: "Refreshing green tea with holy basil and ginger. Antioxidant-rich, immunity-boosting blend.",
    ingredients: "Green Tea Leaves, Tulsi (Holy Basil), Ginger Extract",
    allergyInfo: "No common allergens.",
    catSlug: "beverages", subSlug: "tea-coffee",
    images: ["https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600"],
    variants: [
      { size: "25",  unit: "bags", mrp: 275, sellingPrice: 239 },
      { size: "50",  unit: "bags", mrp: 499, sellingPrice: 429 },
    ],
    stockQty: 150, isOrganic: true, isFeatured: false,
    tags: ["green tea", "tulsi", "ginger", "immunity", "organic"],
    rating: 4.5, reviewCount: 312, pincodeCount: 9,
  },

  // ═══ Beverages → Water & Soda (2) ════════════════════════════════════════
  {
    name: "Himalayan Mineral Water",
    description: "Naturally sourced mineral water from the Himalayan foothills. Rich in essential minerals.",
    catSlug: "beverages", subSlug: "water-soda",
    images: ["https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600"],
    variants: [
      { size: "500",  unit: "ml", mrp: 20,   sellingPrice: 18 },
      { size: "1000", unit: "ml", mrp: 35,   sellingPrice: 32 },
    ],
    stockQty: 500, isOrganic: false, isFeatured: false,
    tags: ["water", "mineral water", "himalayan", "pure"],
    rating: 4.4, reviewCount: 267, pincodeCount: 10,
  },
  {
    name: "Tender Coconut Water Tetra",
    description: "Natural coconut water in a tetra pack. Refreshing, isotonic, loaded with electrolytes.",
    ingredients: "100% Natural Coconut Water",
    allergyInfo: "No common allergens. Contains tree nuts (coconut).",
    catSlug: "beverages", subSlug: "water-soda",
    images: ["https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600"],
    variants: [
      { size: "200", unit: "ml", mrp: 40,   sellingPrice: 35 },
      { size: "500", unit: "ml", mrp: 90,   sellingPrice: 79 },
    ],
    stockQty: 200, isOrganic: false, isFeatured: false,
    tags: ["coconut water", "electrolytes", "isotonic", "natural", "refreshing"],
    rating: 4.5, reviewCount: 312, pincodeCount: 9,
  },

  // ═══ Snacks & Branded → Chips & Namkeen (3) ══════════════════════════════
  {
    name: "Roasted Makhana (Foxnuts)",
    description: "Crunchy roasted makhana in a light butter-pepper seasoning. Low calorie, high protein guilt-free snack.",
    ingredients: "Foxnuts (Makhana), Butter, Black Pepper, Sea Salt, Curry Leaf Flavouring",
    allergyInfo: "Contains milk (butter). May contain traces of nuts.",
    catSlug: "snacks-branded", subSlug: "chips-namkeen",
    images: ["https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600"],
    variants: [
      { size: "60",  unit: "g",  mrp: 120,  sellingPrice: 99 },
      { size: "150", unit: "g",  mrp: 275,  sellingPrice: 235 },
    ],
    stockQty: 200, isOrganic: true, isFeatured: true,
    tags: ["makhana", "foxnuts", "roasted", "healthy snack", "low calorie"],
    rating: 4.7, reviewCount: 456, pincodeCount: 10,
  },
  {
    name: "Haldiram's Bhujia Sev",
    description: "Iconic spicy Bikaner-style bhujia sev from Haldiram's. The perfect tea-time snack.",
    ingredients: "Gram Flour, Vegetable Oil, Spices, Salt",
    allergyInfo: "Contains groundnut oil. May contain milk and gluten.",
    catSlug: "snacks-branded", subSlug: "chips-namkeen",
    images: ["https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600"],
    variants: [
      { size: "150", unit: "g",  mrp: 75,   sellingPrice: 68 },
      { size: "400", unit: "g",  mrp: 185,  sellingPrice: 169 },
    ],
    stockQty: 300, isOrganic: false, isFeatured: false,
    tags: ["bhujia", "sev", "haldirams", "namkeen", "spicy"],
    rating: 4.6, reviewCount: 789, pincodeCount: 10,
  },
  {
    name: "Roasted Almonds Salted",
    description: "Premium California almonds, dry-roasted with sea salt. Packed with healthy fats and Vitamin E.",
    allergyInfo: "Contains tree nuts (almonds). Processed in a facility handling other tree nuts and peanuts.",
    catSlug: "snacks-branded", subSlug: "chips-namkeen",
    images: ["https://images.unsplash.com/photo-1536816579748-4ecb3f03d72a?w=600"],
    variants: [
      { size: "100", unit: "g",  mrp: 199,  sellingPrice: 169 },
      { size: "250", unit: "g",  mrp: 475,  sellingPrice: 399 },
    ],
    stockQty: 110, isOrganic: false, isFeatured: false,
    tags: ["almonds", "roasted", "healthy", "nuts", "california"],
    rating: 4.8, reviewCount: 378, pincodeCount: 9,
  },

  // ═══ Snacks & Branded → Instant Noodles (2) ══════════════════════════════
  {
    name: "Masala Instant Noodles",
    description: "The classic spicy masala instant noodles, ready in 2 minutes. A childhood favourite.",
    ingredients: "Refined Wheat Flour, Palm Oil, Salt, Tapioca Starch; Masala Packet: Spices, Salt, Sugar",
    allergyInfo: "Contains wheat and gluten. May contain milk, soy.",
    catSlug: "snacks-branded", subSlug: "instant-noodles",
    images: ["https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600"],
    variants: [
      { size: "70",  unit: "g",  mrp: 15,   sellingPrice: 14 },
      { size: "4",   unit: "pc", mrp: 56,   sellingPrice: 50 },
    ],
    stockQty: 500, isOrganic: false, isFeatured: false,
    tags: ["noodles", "instant", "masala", "quick", "2-minute"],
    rating: 4.5, reviewCount: 892, pincodeCount: 10,
  },
  {
    name: "Korean Ramen Cup Noodles",
    description: "Spicy Korean-style ramen in a convenient cup. Rich broth with authentic flavours.",
    ingredients: "Noodles (Wheat Flour, Palm Oil, Salt), Seasoning Pack (Soy Sauce, Chilli, Garlic)",
    allergyInfo: "Contains wheat, soy. May contain eggs and shellfish.",
    catSlug: "snacks-branded", subSlug: "instant-noodles",
    images: ["https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600"],
    variants: [
      { size: "75",  unit: "g",  mrp: 80,   sellingPrice: 69 },
    ],
    stockQty: 200, isOrganic: false, isFeatured: false,
    tags: ["ramen", "korean", "noodles", "spicy", "cup noodles"],
    rating: 4.4, reviewCount: 312, pincodeCount: 8,
  },

  // ═══ Snacks & Branded → Ready to Eat (3) ════════════════════════════════
  {
    name: "Natural Peanut Butter Crunchy",
    description: "All-natural crunchy peanut butter with no added sugar, oil, or salt. Just 100% roasted peanuts.",
    ingredients: "100% Dry Roasted Peanuts",
    allergyInfo: "Contains peanuts. Processed in a facility handling tree nuts.",
    catSlug: "snacks-branded", subSlug: "ready-to-eat",
    images: ["https://images.unsplash.com/photo-1501012980720-b5e79f1a9e98?w=600"],
    variants: [
      { size: "200", unit: "g",  mrp: 179,  sellingPrice: 155 },
      { size: "400", unit: "g",  mrp: 329,  sellingPrice: 285 },
    ],
    stockQty: 100, isOrganic: false, isFeatured: false,
    tags: ["peanut butter", "protein", "natural", "no sugar", "crunchy"],
    rating: 4.7, reviewCount: 512, pincodeCount: 9,
  },
  {
    name: "Dark Chocolate 70% Cocoa",
    description: "Premium 70% dark chocolate bar with rich, complex flavour. Antioxidant-rich and mood-boosting.",
    ingredients: "Cocoa Mass, Sugar, Cocoa Butter, Vanilla Extract, Soy Lecithin",
    allergyInfo: "Contains soy. May contain milk and nuts.",
    catSlug: "snacks-branded", subSlug: "ready-to-eat",
    images: ["https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=600"],
    variants: [
      { size: "80",  unit: "g",  mrp: 220,  sellingPrice: 189 },
      { size: "2",   unit: "pc", mrp: 420,  sellingPrice: 359 },
    ],
    stockQty: 120, isOrganic: false, isFeatured: false,
    tags: ["chocolate", "dark chocolate", "antioxidant", "70 percent", "premium"],
    rating: 4.8, reviewCount: 345, pincodeCount: 8,
  },
  {
    name: "Trail Mix Nuts and Berries",
    description: "Premium trail mix with almonds, cashews, dried cranberries, and pumpkin seeds. Energy-packed snack.",
    allergyInfo: "Contains tree nuts (almonds, cashews). May contain peanuts.",
    catSlug: "snacks-branded", subSlug: "ready-to-eat",
    images: ["https://images.unsplash.com/photo-1562802378-063ec186a863?w=600"],
    variants: [
      { size: "100", unit: "g",  mrp: 189,  sellingPrice: 159 },
      { size: "250", unit: "g",  mrp: 445,  sellingPrice: 375 },
    ],
    stockQty: 80, isOrganic: false, isFeatured: true,
    tags: ["trail mix", "nuts", "berries", "energy", "healthy snack"],
    rating: 4.6, reviewCount: 267, pincodeCount: 8,
  },

  // ═══ Meat & Seafood → Chicken (3) ════════════════════════════════════════
  {
    name: "Chicken Breast Boneless",
    description: "Fresh, antibiotic-free boneless chicken breast. High-protein, low-fat — ideal for grilling and curries.",
    additionalInfo: "Sourced from FSSAI-certified farms. Cleaned and ready to cook.",
    catSlug: "meat-seafood", subSlug: "chicken",
    images: ["https://images.unsplash.com/photo-1615937722923-67f6deaf2cc9?w=600"],
    variants: [
      { size: "250", unit: "g",  mrp: 159,  sellingPrice: 139 },
      { size: "500", unit: "g",  mrp: 299,  sellingPrice: 265 },
    ],
    stockQty: 80, isOrganic: false, isFeatured: true,
    tags: ["chicken", "boneless", "protein", "fresh", "breast"],
    rating: 4.6, reviewCount: 312, pincodeCount: 7,
  },
  {
    name: "Chicken Keema Minced",
    description: "Fresh minced chicken keema, freshly ground. Ideal for keema pav, stuffed parathas, and pasta.",
    additionalInfo: "Freshly ground daily. Store below 4°C and use within 24 hours.",
    catSlug: "meat-seafood", subSlug: "chicken",
    images: ["https://images.unsplash.com/photo-1544025162-d76538829db0?w=600"],
    variants: [
      { size: "250", unit: "g",  mrp: 139,  sellingPrice: 119 },
      { size: "500", unit: "g",  mrp: 265,  sellingPrice: 235 },
    ],
    stockQty: 70, isOrganic: false, isFeatured: false,
    tags: ["keema", "minced chicken", "fresh", "kheema"],
    rating: 4.5, reviewCount: 223, pincodeCount: 6,
  },
  {
    name: "Whole Chicken Curry Cut",
    description: "Farm-fresh whole chicken, dressed and curry-cut into 12 pieces. Perfect for biryanis and curries.",
    additionalInfo: "Fresh, not frozen. Vacuum-packed for hygiene.",
    catSlug: "meat-seafood", subSlug: "chicken",
    images: ["https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600"],
    variants: [
      { size: "800",  unit: "g",  mrp: 380,  sellingPrice: 335 },
      { size: "1200", unit: "g",  mrp: 560,  sellingPrice: 495 },
    ],
    stockQty: 60, isOrganic: false, isFeatured: false,
    tags: ["chicken", "whole chicken", "curry cut", "biryani", "fresh"],
    rating: 4.5, reviewCount: 198, pincodeCount: 6,
  },

  // ═══ Meat & Seafood → Fish (3) ════════════════════════════════════════════
  {
    name: "Rohu Fish Steaks",
    description: "Fresh river Rohu fish, cleaned and cut into steaks. Rich in Omega-3 fatty acids.",
    additionalInfo: "Freshly cleaned and scaled. Not frozen.",
    catSlug: "meat-seafood", subSlug: "fish",
    images: ["https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600"],
    variants: [
      { size: "500", unit: "g",  mrp: 380,  sellingPrice: 335 },
      { size: "1",   unit: "kg", mrp: 720,  sellingPrice: 649 },
    ],
    stockQty: 60, isOrganic: false, isFeatured: false,
    tags: ["fish", "rohu", "omega 3", "seafood", "freshwater"],
    rating: 4.4, reviewCount: 189, pincodeCount: 5,
  },
  {
    name: "Tiger Prawns Large",
    description: "Fresh tiger prawns, deveined and shell-on. Succulent and meaty — perfect for tandoor and masala.",
    additionalInfo: "Deveined, shell-on. Best cooked on the day of delivery.",
    catSlug: "meat-seafood", subSlug: "fish",
    images: ["https://images.unsplash.com/photo-1481671703460-040cb8a2d909?w=600"],
    variants: [
      { size: "250", unit: "g",  mrp: 280,  sellingPrice: 249 },
      { size: "500", unit: "g",  mrp: 549,  sellingPrice: 489 },
    ],
    stockQty: 40, isOrganic: false, isFeatured: true,
    tags: ["prawns", "tiger prawns", "seafood", "fresh", "shrimp"],
    rating: 4.8, reviewCount: 256, pincodeCount: 5,
  },
  {
    name: "Atlantic Salmon Fillet",
    description: "Premium Atlantic salmon fillet, sustainably sourced. Rich in Omega-3. Pan-fry, bake, or grill.",
    additionalInfo: "Sourced from MSC-certified sustainable fisheries. Fresh, not frozen.",
    catSlug: "meat-seafood", subSlug: "fish",
    images: ["https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600"],
    variants: [
      { size: "200", unit: "g",  mrp: 850,  sellingPrice: 749 },
      { size: "400", unit: "g",  mrp: 1650, sellingPrice: 1449 },
    ],
    stockQty: 30, isOrganic: false, isFeatured: false,
    tags: ["salmon", "fish", "omega 3", "imported", "atlantic", "premium"],
    rating: 4.9, reviewCount: 145, pincodeCount: 4,
  },

  // ═══ Meat & Seafood → Poultry Eggs (2) ═══════════════════════════════════
  {
    name: "Country Eggs Brown",
    description: "Farm-fresh brown country eggs from free-range hens. Richer yolk, higher Omega-3.",
    catSlug: "meat-seafood", subSlug: "poultry-eggs",
    images: ["https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600"],
    variants: [
      { size: "6",   unit: "pc", mrp: 55,   sellingPrice: 49 },
      { size: "12",  unit: "pc", mrp: 105,  sellingPrice: 92 },
    ],
    stockQty: 150, isOrganic: false, isFeatured: false,
    tags: ["eggs", "brown eggs", "country eggs", "free range"],
    rating: 4.6, reviewCount: 278, pincodeCount: 8,
  },
  {
    name: "Omega-3 Enriched Eggs",
    description: "Specially enriched eggs from hens fed on an Omega-3-rich flaxseed diet. Better nutrition for your family.",
    catSlug: "meat-seafood", subSlug: "poultry-eggs",
    images: ["https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600"],
    variants: [
      { size: "6",   unit: "pc", mrp: 75,   sellingPrice: 65 },
      { size: "12",  unit: "pc", mrp: 145,  sellingPrice: 125 },
    ],
    stockQty: 100, isOrganic: false, isFeatured: false,
    tags: ["eggs", "omega 3", "enriched", "healthy", "nutrition"],
    rating: 4.5, reviewCount: 189, pincodeCount: 7,
  },
];

// Indices (0-based) of products to mark as unavailable (~20%)
const UNAVAILABLE_INDICES = new Set([3, 12, 17, 22, 28, 36, 38, 44, 47, 49]);

// ─── Main seed function ───────────────────────────────────────────────────────

export async function runSeed(): Promise<void> {
  console.log("🥕 FreshCart Seed Script");
  console.log("─".repeat(50));

  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // Idempotency guard
  const existingCount = await ProductModel.countDocuments();
  if (existingCount > 0) {
    console.log(`⏭️  Already seeded (${existingCount} products found). Skipping.`);
    await mongoose.disconnect();
    return;
  }

  // 1. Pincodes
  await PincodeModel.deleteMany({});
  await PincodeModel.insertMany(PINCODES);
  console.log(`✅ Seeded ${PINCODES.length} pincodes`);

  // 2. Users — hash passwords manually (insertMany skips pre-save hooks)
  await UserModel.deleteMany({});
  const usersToInsert = await Promise.all(
    USERS_SEED.map(async ({ name, email, password, role, phone }) => ({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role,
      phone,
      addresses: [],
    }))
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insertedUsers = await UserModel.insertMany(usersToInsert) as any[];
  const adminUser = insertedUsers.find((u) => u.role === "admin");
  if (!adminUser) throw new Error("Admin user not found after insert");
  console.log(`✅ Seeded ${USERS_SEED.length} users`);

  // 3. Categories — sequential to build slug → _id map
  await CategoryModel.deleteMany({});
  const catMap = new Map<string, Types.ObjectId>();

  for (const def of CATEGORY_DEFS) {
    const parent = await CategoryModel.create({
      name: def.name, slug: def.slug, image: def.image,
      description: def.description, sortOrder: def.sortOrder,
      parentCategory: null, isActive: true,
    });
    catMap.set(def.slug, parent._id as Types.ObjectId);

    for (const sub of def.subs) {
      const child = await CategoryModel.create({
        name: sub.name, slug: sub.slug, sortOrder: sub.sortOrder,
        parentCategory: parent._id, isActive: true,
      });
      catMap.set(sub.slug, child._id as Types.ObjectId);
    }
  }
  console.log(`✅ Seeded ${catMap.size} categories & subcategories`);

  // 4. Products
  await ProductModel.deleteMany({});
  const productsToInsert = PRODUCTS_DEF.map((p, idx) => {
    const catId = catMap.get(p.catSlug);
    const subId = catMap.get(p.subSlug) ?? null;
    if (!catId) throw new Error(`Unknown catSlug "${p.catSlug}"`);

    const productSlug = slugify(p.name);
    const variants = p.variants.map((v) => ({
      ...v,
      sku: makeSku(productSlug, v.size, v.unit),
    }));

    return {
      name:                p.name,
      slug:                productSlug,
      description:         p.description,
      subDescription:      p.subDescription,
      additionalInfo:      p.additionalInfo,
      allergyInfo:         p.allergyInfo,
      ingredients:         p.ingredients,
      category:            catId,
      subCategory:         subId,
      images:              p.images,
      variants,
      stockQty:            p.stockQty,
      isAvailable:         !UNAVAILABLE_INDICES.has(idx),
      serviceablePincodes: pick(PINCODE_CODES, p.pincodeCount),
      tags:                p.tags,
      isFeatured:          p.isFeatured,
      isOrganic:           p.isOrganic,
      rating:              p.rating,
      reviewCount:         p.reviewCount,
      createdBy:           adminUser._id,
    };
  });

  await ProductModel.insertMany(productsToInsert);
  console.log(`✅ Seeded ${productsToInsert.length} products`);

  await mongoose.disconnect();
  console.log("\n🎉 FreshCart seeded successfully!");
  console.log("─".repeat(50));
  console.log("Admin : admin@freshcart.com / Admin@123");
  console.log("User  : user@freshcart.com  / User@123");
}

/** Backward-compat alias */
export const seedDatabase = runSeed;

// Auto-run when executed directly
if (require.main === module) {
  runSeed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
}
