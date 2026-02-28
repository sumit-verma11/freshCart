/**
 * FreshCart Seed Script
 * Run: npx ts-node lib/seed.ts
 * Idempotent — skips if DB already has data
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://freshcart_admin:freshcart_secret@localhost:27017/freshcart?authSource=admin";

// ─── Inline schemas (avoid circular imports in seed context) ─────────────────

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    phone: String,
    addresses: [
      {
        label: String,
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
        isDefault: Boolean,
      },
    ],
  },
  { timestamps: true }
);

const ProductSchema = new mongoose.Schema(
  {
    name: String,
    slug: { type: String, unique: true },
    description: String,
    category: String,
    price: Number,
    salePrice: Number,
    unit: String,
    stock: Number,
    images: [String],
    tags: [String],
    isOrganic: Boolean,
    isFeatured: Boolean,
    rating: Number,
    reviewCount: Number,
    serviceablePincodes: [String],
  },
  { timestamps: true }
);

const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
const ProductModel = mongoose.models.Product || mongoose.model("Product", ProductSchema);

// ─── Seed Data ────────────────────────────────────────────────────────────────

const PINCODES = {
  mumbai: ["400001", "400002", "400003", "400050", "400060"],
  delhi: ["110001", "110005", "110010", "110020", "110030"],
  bangalore: ["560001", "560002", "560010", "560020", "560038"],
  hyderabad: ["500001", "500002", "500010", "500016", "500032"],
  chennai: ["600001", "600002", "600010", "600018", "600040"],
  pune: ["411001", "411002", "411005", "411014", "411021"],
};

// Pick 5 random pincodes from any city
function randomPincodes(): string[] {
  const allPincodes = Object.values(PINCODES).flat();
  const shuffled = allPincodes.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 5);
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
}

// Unsplash image placeholders per category
const IMG = {
  "Fruits & Vegetables": [
    "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400",
    "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400",
    "https://images.unsplash.com/photo-1573246123716-6b1782bfc499?w=400",
  ],
  "Dairy & Eggs": [
    "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400",
    "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400",
    "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400",
  ],
  Bakery: [
    "https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=400",
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
    "https://images.unsplash.com/photo-1568471173242-461f0a730452?w=400",
  ],
  Beverages: [
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
    "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=400",
  ],
  Snacks: [
    "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400",
    "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400",
    "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400",
  ],
  "Meat & Seafood": [
    "https://images.unsplash.com/photo-1615937722923-67f6deaf2cc9?w=400",
    "https://images.unsplash.com/photo-1544025162-d76538829db0?w=400",
    "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400",
  ],
};

type Category = keyof typeof IMG;

function img(cat: Category): string[] {
  const arr = IMG[cat];
  return [arr[Math.floor(Math.random() * arr.length)]];
}

interface ProductSeed {
  name: string;
  description: string;
  category: Category;
  price: number;
  salePrice?: number;
  unit: string;
  stock: number;
  tags: string[];
  isOrganic: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
}

const PRODUCTS: ProductSeed[] = [
  // ── Fruits & Vegetables (12) ──────────────────────────────────────────────
  {
    name: "Organic Alphonso Mangoes",
    description: "Premium Ratnagiri Alphonso mangoes, hand-picked at peak ripeness. Rich, creamy pulp with irresistible aroma.",
    category: "Fruits & Vegetables",
    price: 599, salePrice: 499, unit: "1 kg", stock: 80,
    tags: ["mango", "fruit", "seasonal", "alphonso"], isOrganic: true, isFeatured: true,
    rating: 4.8, reviewCount: 342,
  },
  {
    name: "Fresh Spinach (Palak)",
    description: "Farm-fresh tender spinach leaves, packed with iron and vitamins. Perfect for saag, smoothies, and salads.",
    category: "Fruits & Vegetables",
    price: 45, salePrice: 39, unit: "500g", stock: 150,
    tags: ["spinach", "palak", "leafy greens", "healthy"], isOrganic: true, isFeatured: false,
    rating: 4.5, reviewCount: 128,
  },
  {
    name: "Tomatoes (Country)",
    description: "Vine-ripened desi tomatoes with deep colour and tangy flavour. Essential for every Indian kitchen.",
    category: "Fruits & Vegetables",
    price: 60, unit: "1 kg", stock: 200,
    tags: ["tomato", "vegetable", "desi"], isOrganic: false, isFeatured: false,
    rating: 4.2, reviewCount: 215,
  },
  {
    name: "Green Capsicum",
    description: "Crisp, fresh green bell peppers. Low in calories, high in Vitamin C. Great for stir-fries and salads.",
    category: "Fruits & Vegetables",
    price: 80, salePrice: 69, unit: "500g", stock: 120,
    tags: ["capsicum", "bell pepper", "green"], isOrganic: false, isFeatured: false,
    rating: 4.3, reviewCount: 89,
  },
  {
    name: "Royal Gala Apples",
    description: "Imported Royal Gala apples — perfectly sweet with a firm bite. Ideal for snacking and fruit salads.",
    category: "Fruits & Vegetables",
    price: 220, salePrice: 189, unit: "1 kg (6–8 pcs)", stock: 60,
    tags: ["apple", "imported", "fruit"], isOrganic: false, isFeatured: true,
    rating: 4.6, reviewCount: 178,
  },
  {
    name: "Baby Potatoes",
    description: "Tender baby potatoes with thin skin. Roast, boil, or fry — perfectly versatile for any recipe.",
    category: "Fruits & Vegetables",
    price: 55, unit: "1 kg", stock: 180,
    tags: ["potato", "baby potato", "vegetable"], isOrganic: false, isFeatured: false,
    rating: 4.1, reviewCount: 94,
  },
  {
    name: "Organic Cauliflower",
    description: "Fresh organic cauliflower head, pesticide-free. Perfect for aloo gobi, soups, and rice dishes.",
    category: "Fruits & Vegetables",
    price: 65, salePrice: 55, unit: "1 pc (~600g)", stock: 90,
    tags: ["cauliflower", "gobi", "organic"], isOrganic: true, isFeatured: false,
    rating: 4.4, reviewCount: 67,
  },
  {
    name: "Watermelon (Seedless)",
    description: "Jumbo seedless watermelon, naturally sweet and hydrating. Perfect summer refreshment.",
    category: "Fruits & Vegetables",
    price: 149, salePrice: 129, unit: "per piece (~3–4 kg)", stock: 45,
    tags: ["watermelon", "fruit", "summer", "seedless"], isOrganic: false, isFeatured: true,
    rating: 4.7, reviewCount: 203,
  },
  {
    name: "Green Peas (Fresh)",
    description: "Sweet and tender fresh green peas, straight from the farm. Ideal for pulao, sabzi, and snacking.",
    category: "Fruits & Vegetables",
    price: 80, unit: "500g (shelled)", stock: 100,
    tags: ["peas", "matar", "green peas"], isOrganic: false, isFeatured: false,
    rating: 4.5, reviewCount: 56,
  },
  {
    name: "Tender Coconut",
    description: "Fresh tender coconut with natural electrolytes. Cool, hydrating coconut water inside.",
    category: "Fruits & Vegetables",
    price: 55, unit: "1 pc", stock: 70,
    tags: ["coconut", "tender coconut", "drink"], isOrganic: false, isFeatured: false,
    rating: 4.6, reviewCount: 145,
  },
  {
    name: "Organic Bottle Gourd (Lauki)",
    description: "Organically grown lauki, freshly harvested. Light, easy-to-digest — recommended for weight management.",
    category: "Fruits & Vegetables",
    price: 35, unit: "1 pc (~500g)", stock: 130,
    tags: ["lauki", "bottle gourd", "organic", "diet"], isOrganic: true, isFeatured: false,
    rating: 4.0, reviewCount: 43,
  },
  {
    name: "Mixed Berries Pack",
    description: "Imported blueberries, strawberries & raspberries. Antioxidant-rich and delicious for desserts or breakfast.",
    category: "Fruits & Vegetables",
    price: 399, salePrice: 349, unit: "200g", stock: 35,
    tags: ["berries", "blueberry", "strawberry", "imported"], isOrganic: false, isFeatured: true,
    rating: 4.8, reviewCount: 112,
  },

  // ── Dairy & Eggs (9) ──────────────────────────────────────────────────────
  {
    name: "Amul Taaza Toned Milk",
    description: "Fresh Amul toned milk, 3% fat, pasteurised and homogenised. Rich in calcium and protein.",
    category: "Dairy & Eggs",
    price: 68, unit: "1L Tetra Pack", stock: 300,
    tags: ["milk", "amul", "toned milk", "dairy"], isOrganic: false, isFeatured: false,
    rating: 4.6, reviewCount: 512,
  },
  {
    name: "Paneer (Fresh)",
    description: "Soft, fresh homestyle paneer made from full-fat cow milk. Perfect for paneer butter masala, tikka, and bhurji.",
    category: "Dairy & Eggs",
    price: 120, salePrice: 109, unit: "200g", stock: 150,
    tags: ["paneer", "cottage cheese", "dairy"], isOrganic: false, isFeatured: true,
    rating: 4.7, reviewCount: 389,
  },
  {
    name: "Desi Cow Ghee",
    description: "Pure A2 desi cow ghee, slow-churned using traditional bilona method. Rich aroma, golden colour.",
    category: "Dairy & Eggs",
    price: 899, salePrice: 799, unit: "500ml", stock: 80,
    tags: ["ghee", "a2 ghee", "desi cow", "organic"], isOrganic: true, isFeatured: true,
    rating: 4.9, reviewCount: 267,
  },
  {
    name: "Farm Fresh Eggs (White)",
    description: "Free-range white eggs, fresh from the farm. High protein, rich yolk. Pack of 12.",
    category: "Dairy & Eggs",
    price: 89, salePrice: 79, unit: "12 pcs (1 dozen)", stock: 200,
    tags: ["eggs", "white eggs", "protein"], isOrganic: false, isFeatured: false,
    rating: 4.5, reviewCount: 334,
  },
  {
    name: "Greek Yogurt (Plain)",
    description: "Thick, creamy Greek yogurt with 10g protein per serving. Probiotic-rich, zero added sugar.",
    category: "Dairy & Eggs",
    price: 149, salePrice: 129, unit: "400g", stock: 90,
    tags: ["yogurt", "greek yogurt", "probiotic"], isOrganic: false, isFeatured: false,
    rating: 4.6, reviewCount: 178,
  },
  {
    name: "Amul Butter (Salted)",
    description: "Classic Amul salted butter — the taste of India. Perfect for toast, rotis, and baking.",
    category: "Dairy & Eggs",
    price: 62, unit: "100g", stock: 250,
    tags: ["butter", "amul butter", "salted butter"], isOrganic: false, isFeatured: false,
    rating: 4.7, reviewCount: 445,
  },
  {
    name: "Flavoured Yogurt Assorted",
    description: "Fruity flavoured yogurt cups in mango, strawberry, and blueberry. A delightful snack for all ages.",
    category: "Dairy & Eggs",
    price: 120, salePrice: 99, unit: "4 cups × 100g", stock: 120,
    tags: ["yogurt", "flavoured", "kids"], isOrganic: false, isFeatured: false,
    rating: 4.4, reviewCount: 198,
  },
  {
    name: "Organic Dahi (Curd)",
    description: "Set dahi made from organic full-fat milk. Thick, creamy, with a pleasant tang.",
    category: "Dairy & Eggs",
    price: 65, unit: "400g", stock: 180,
    tags: ["curd", "dahi", "yogurt", "organic"], isOrganic: true, isFeatured: false,
    rating: 4.5, reviewCount: 231,
  },
  {
    name: "Mozzarella Cheese Block",
    description: "Premium Italian-style mozzarella. Melts beautifully on pizzas and grilled sandwiches.",
    category: "Dairy & Eggs",
    price: 299, salePrice: 249, unit: "200g", stock: 60,
    tags: ["cheese", "mozzarella", "pizza", "italian"], isOrganic: false, isFeatured: false,
    rating: 4.6, reviewCount: 143,
  },

  // ── Bakery (7) ────────────────────────────────────────────────────────────
  {
    name: "Whole Wheat Bread",
    description: "Soft whole wheat sandwich bread with no maida. Rich in fibre, baked fresh every morning.",
    category: "Bakery",
    price: 55, unit: "400g loaf", stock: 100,
    tags: ["bread", "whole wheat", "sandwich", "healthy"], isOrganic: false, isFeatured: false,
    rating: 4.4, reviewCount: 267,
  },
  {
    name: "Multigrain Buns",
    description: "Soft burger buns with sesame topping, made with multigrain flour. Perfect for burgers and sliders.",
    category: "Bakery",
    price: 70, unit: "6 pcs", stock: 80,
    tags: ["bun", "burger", "multigrain"], isOrganic: false, isFeatured: false,
    rating: 4.3, reviewCount: 89,
  },
  {
    name: "Sourdough Loaf",
    description: "Artisan sourdough with a crispy crust and chewy crumb. Slow-fermented for 24 hours for deep flavour.",
    category: "Bakery",
    price: 280, salePrice: 250, unit: "600g loaf", stock: 30,
    tags: ["sourdough", "artisan", "bread"], isOrganic: false, isFeatured: true,
    rating: 4.9, reviewCount: 154,
  },
  {
    name: "Chocolate Croissants (2 pcs)",
    description: "Buttery, flaky croissants filled with rich dark chocolate. Freshly baked daily.",
    category: "Bakery",
    price: 160, salePrice: 139, unit: "2 pcs", stock: 50,
    tags: ["croissant", "chocolate", "pastry"], isOrganic: false, isFeatured: true,
    rating: 4.8, reviewCount: 212,
  },
  {
    name: "Pav (Dinner Rolls)",
    description: "Soft Mumbai-style pav, freshly baked. Essential for bhaji pav, vada pav, and keema pav.",
    category: "Bakery",
    price: 35, unit: "6 pcs", stock: 150,
    tags: ["pav", "dinner roll", "mumbai"], isOrganic: false, isFeatured: false,
    rating: 4.6, reviewCount: 378,
  },
  {
    name: "Banana Walnut Muffins",
    description: "Moist banana muffins loaded with crunchy walnuts. A wholesome snack baked fresh every morning.",
    category: "Bakery",
    price: 120, salePrice: 99, unit: "4 pcs", stock: 60,
    tags: ["muffin", "banana", "walnut", "snack"], isOrganic: false, isFeatured: false,
    rating: 4.5, reviewCount: 167,
  },
  {
    name: "Focaccia Bread",
    description: "Italian-style focaccia with rosemary, sea salt, and olive oil. Perfect with soups and dips.",
    category: "Bakery",
    price: 199, unit: "300g", stock: 25,
    tags: ["focaccia", "italian", "bread"], isOrganic: false, isFeatured: false,
    rating: 4.7, reviewCount: 78,
  },

  // ── Beverages (7) ─────────────────────────────────────────────────────────
  {
    name: "Cold Pressed Orange Juice",
    description: "100% fresh-squeezed orange juice, cold-pressed to retain maximum nutrients. No added sugar or preservatives.",
    category: "Beverages",
    price: 180, salePrice: 159, unit: "500ml", stock: 80,
    tags: ["juice", "orange", "cold pressed", "vitamin c"], isOrganic: true, isFeatured: true,
    rating: 4.8, reviewCount: 234,
  },
  {
    name: "Tender Coconut Water",
    description: "Natural coconut water packed in a tetra pack. Refreshing, isotonic, and loaded with electrolytes.",
    category: "Beverages",
    price: 65, unit: "200ml", stock: 200,
    tags: ["coconut water", "beverage", "electrolytes"], isOrganic: false, isFeatured: false,
    rating: 4.5, reviewCount: 312,
  },
  {
    name: "Masala Chai Premix",
    description: "Authentic masala chai premix with ginger, cardamom, and cinnamon. Just add hot water or milk.",
    category: "Beverages",
    price: 199, salePrice: 175, unit: "250g (30 cups)", stock: 120,
    tags: ["chai", "tea", "masala chai", "premix"], isOrganic: false, isFeatured: true,
    rating: 4.7, reviewCount: 428,
  },
  {
    name: "Cold Brew Coffee",
    description: "Smooth, low-acid cold brew coffee, steeped for 18 hours. Ready to drink, no bitterness.",
    category: "Beverages",
    price: 249, salePrice: 219, unit: "350ml", stock: 60,
    tags: ["coffee", "cold brew", "caffeine"], isOrganic: false, isFeatured: false,
    rating: 4.6, reviewCount: 167,
  },
  {
    name: "Almond Milk (Unsweetened)",
    description: "Creamy dairy-free almond milk with no added sugar. Perfect for vegans, lactose-intolerant, and keto diet.",
    category: "Beverages",
    price: 299, salePrice: 269, unit: "1L", stock: 70,
    tags: ["almond milk", "vegan", "dairy free", "keto"], isOrganic: false, isFeatured: false,
    rating: 4.4, reviewCount: 198,
  },
  {
    name: "Mango Lassi",
    description: "Thick, creamy mango lassi made with real Alphonso mango pulp and fresh dahi. Traditional Indian delight.",
    category: "Beverages",
    price: 99, unit: "300ml", stock: 90,
    tags: ["lassi", "mango", "dahi", "indian"], isOrganic: false, isFeatured: false,
    rating: 4.7, reviewCount: 289,
  },
  {
    name: "Green Tea (Tulsi Ginger)",
    description: "Refreshing green tea with holy basil and ginger. Antioxidant-rich, immunity-boosting blend.",
    category: "Beverages",
    price: 249, unit: "25 tea bags", stock: 150,
    tags: ["green tea", "tulsi", "ginger", "immunity"], isOrganic: true, isFeatured: false,
    rating: 4.5, reviewCount: 312,
  },

  // ── Snacks (8) ────────────────────────────────────────────────────────────
  {
    name: "Roasted Makhana (Foxnuts)",
    description: "Crunchy roasted makhana in a light butter-pepper seasoning. Low calorie, high protein guilt-free snack.",
    category: "Snacks",
    price: 199, salePrice: 175, unit: "100g", stock: 200,
    tags: ["makhana", "foxnuts", "roasted", "healthy snack"], isOrganic: true, isFeatured: true,
    rating: 4.7, reviewCount: 456,
  },
  {
    name: "Haldiram's Bhujia Sev",
    description: "Iconic spicy Bikaner-style bhujia sev from Haldiram's. The perfect tea-time snack.",
    category: "Snacks",
    price: 85, unit: "200g", stock: 300,
    tags: ["bhujia", "sev", "haldirams", "namkeen"], isOrganic: false, isFeatured: false,
    rating: 4.6, reviewCount: 789,
  },
  {
    name: "Dark Chocolate (70% Cocoa)",
    description: "Premium 70% dark chocolate bar with rich, complex flavour. Antioxidant-rich and mood-boosting.",
    category: "Snacks",
    price: 199, salePrice: 169, unit: "80g bar", stock: 120,
    tags: ["chocolate", "dark chocolate", "antioxidant"], isOrganic: false, isFeatured: false,
    rating: 4.8, reviewCount: 345,
  },
  {
    name: "Trail Mix (Nuts & Berries)",
    description: "Premium trail mix with almonds, cashews, dried cranberries, and pumpkin seeds. Energy-packed snack.",
    category: "Snacks",
    price: 349, salePrice: 299, unit: "200g", stock: 80,
    tags: ["trail mix", "nuts", "berries", "energy"], isOrganic: false, isFeatured: true,
    rating: 4.6, reviewCount: 267,
  },
  {
    name: "Peanut Butter (Crunchy)",
    description: "All-natural crunchy peanut butter with no added sugar, oil, or salt. Just 100% roasted peanuts.",
    category: "Snacks",
    price: 299, salePrice: 259, unit: "400g", stock: 100,
    tags: ["peanut butter", "protein", "natural"], isOrganic: false, isFeatured: false,
    rating: 4.7, reviewCount: 512,
  },
  {
    name: "Multigrain Khakhra",
    description: "Crispy Gujarati-style multigrain khakhra with jeera and methi. Light, healthy, and addictive.",
    category: "Snacks",
    price: 120, unit: "200g", stock: 150,
    tags: ["khakhra", "gujarati", "multigrain", "crispy"], isOrganic: false, isFeatured: false,
    rating: 4.4, reviewCount: 189,
  },
  {
    name: "Popcorn (Caramel & Sea Salt)",
    description: "Handcrafted caramel popcorn with fleur de sel. Perfectly balanced sweet and salty crunch.",
    category: "Snacks",
    price: 149, salePrice: 129, unit: "100g", stock: 90,
    tags: ["popcorn", "caramel", "snack"], isOrganic: false, isFeatured: false,
    rating: 4.5, reviewCount: 234,
  },
  {
    name: "Roasted Almonds (Salted)",
    description: "Premium California almonds, dry-roasted with sea salt. Packed with healthy fats and Vitamin E.",
    category: "Snacks",
    price: 449, salePrice: 399, unit: "250g", stock: 110,
    tags: ["almonds", "roasted", "healthy", "nuts"], isOrganic: false, isFeatured: false,
    rating: 4.8, reviewCount: 378,
  },

  // ── Meat & Seafood (7) ────────────────────────────────────────────────────
  {
    name: "Chicken Breast (Boneless)",
    description: "Fresh, antibiotic-free boneless chicken breast. High-protein, low-fat — ideal for grilling and curries.",
    category: "Meat & Seafood",
    price: 299, salePrice: 269, unit: "500g", stock: 80,
    tags: ["chicken", "boneless", "protein", "fresh"], isOrganic: false, isFeatured: true,
    rating: 4.6, reviewCount: 312,
  },
  {
    name: "Rohu Fish (Cleaned)",
    description: "Fresh river Rohu fish, cleaned and cut into steaks. Rich in Omega-3 fatty acids.",
    category: "Meat & Seafood",
    price: 349, unit: "500g", stock: 60,
    tags: ["fish", "rohu", "omega 3", "seafood"], isOrganic: false, isFeatured: false,
    rating: 4.4, reviewCount: 189,
  },
  {
    name: "Tiger Prawns (Large)",
    description: "Fresh tiger prawns, deveined and shell-on. Succulent and meaty — perfect for tandoor and masala.",
    category: "Meat & Seafood",
    price: 499, salePrice: 449, unit: "500g (8–10 pcs)", stock: 40,
    tags: ["prawns", "tiger prawns", "seafood", "fresh"], isOrganic: false, isFeatured: true,
    rating: 4.8, reviewCount: 256,
  },
  {
    name: "Mutton (Curry Cut)",
    description: "Tender goat mutton, curry-cut from fresh stock. Best for biryani, rogan josh, and dal gosht.",
    category: "Meat & Seafood",
    price: 699, salePrice: 649, unit: "500g", stock: 50,
    tags: ["mutton", "goat", "biryani", "fresh"], isOrganic: false, isFeatured: false,
    rating: 4.7, reviewCount: 198,
  },
  {
    name: "Salmon Fillet (Atlantic)",
    description: "Premium Atlantic salmon fillet, sustainably sourced. Rich in Omega-3. Pan-fry, bake, or grill.",
    category: "Meat & Seafood",
    price: 799, salePrice: 699, unit: "200g", stock: 30,
    tags: ["salmon", "fish", "omega 3", "imported"], isOrganic: false, isFeatured: false,
    rating: 4.9, reviewCount: 145,
  },
  {
    name: "Chicken Keema (Minced)",
    description: "Fresh minced chicken keema, freshly ground. Ideal for keema pav, stuffed parathas, and pasta.",
    category: "Meat & Seafood",
    price: 259, unit: "500g", stock: 70,
    tags: ["keema", "minced chicken", "fresh"], isOrganic: false, isFeatured: false,
    rating: 4.5, reviewCount: 223,
  },
  {
    name: "Bombay Duck (Bombil)",
    description: "Fresh Bombil (Bombay Duck) — a Mumbai coastal delicacy. Best for frying with rice coat.",
    category: "Meat & Seafood",
    price: 249, unit: "500g", stock: 45,
    tags: ["bombil", "bombay duck", "coastal", "fish"], isOrganic: false, isFeatured: false,
    rating: 4.3, reviewCount: 134,
  },
];

// ─── Users ────────────────────────────────────────────────────────────────────

const USERS = [
  // Admins
  {
    name: "Raj Kumar (Admin)",
    email: "admin@freshcart.in",
    password: "Admin@1234",
    role: "admin",
    phone: "9876543210",
  },
  {
    name: "Priya Sharma (Admin)",
    email: "priya.admin@freshcart.in",
    password: "Admin@5678",
    role: "admin",
    phone: "9876543211",
  },
  // Regular users
  {
    name: "Arjun Mehta",
    email: "arjun@example.com",
    password: "User@1234",
    role: "user",
    phone: "9876001001",
  },
  {
    name: "Sunita Patel",
    email: "sunita@example.com",
    password: "User@5678",
    role: "user",
    phone: "9876001002",
  },
  {
    name: "Vikram Nair",
    email: "vikram@example.com",
    password: "User@9012",
    role: "user",
    phone: "9876001003",
  },
  {
    name: "Deepika Iyer",
    email: "deepika@example.com",
    password: "User@3456",
    role: "user",
    phone: "9876001004",
  },
  {
    name: "Rohan Gupta",
    email: "rohan@example.com",
    password: "User@7890",
    role: "user",
    phone: "9876001005",
  },
];

// ─── Main seed function ───────────────────────────────────────────────────────

export async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: "freshcart" });
    console.log("✅ Connected to MongoDB");

    // Check if already seeded
    const existingProducts = await ProductModel.countDocuments();
    const existingUsers = await UserModel.countDocuments();

    if (existingProducts > 0 && existingUsers > 0) {
      console.log(
        `⏭️  Database already seeded (${existingProducts} products, ${existingUsers} users). Skipping.`
      );
      await mongoose.disconnect();
      return;
    }

    console.log("🌱 Seeding database...");

    // Seed users
    if (existingUsers === 0) {
      const usersWithHashedPasswords = await Promise.all(
        USERS.map(async (u) => ({
          ...u,
          password: await bcrypt.hash(u.password, 12),
        }))
      );
      await UserModel.insertMany(usersWithHashedPasswords);
      console.log(`✅ Seeded ${USERS.length} users (2 admins, 5 regular)`);
    }

    // Seed products
    if (existingProducts === 0) {
      const productsWithSlug = PRODUCTS.map((p) => ({
        ...p,
        slug: slug(p.name),
        images: img(p.category as Category),
        serviceablePincodes: randomPincodes(),
      }));
      await ProductModel.insertMany(productsWithSlug);
      console.log(`✅ Seeded ${PRODUCTS.length} products across 6 categories`);
    }

    console.log("\n🎉 FreshCart database seeded successfully!\n");
    console.log("Admin credentials:");
    console.log("  📧 admin@freshcart.in  |  🔑 Admin@1234");
    console.log("  📧 priya.admin@freshcart.in  |  🔑 Admin@5678");
    console.log("\nUser credentials (any):");
    console.log("  📧 arjun@example.com  |  🔑 User@1234\n");

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Seed failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run directly if called as a script
seedDatabase();
