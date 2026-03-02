/**
 * Auto-fix product images using the Unsplash Source API (no API key required).
 *
 * For every product in MongoDB it:
 *  1. Sends a keyword search to https://source.unsplash.com/featured/600x600/?{keywords}
 *  2. Follows the HTTP redirect to capture the stable images.unsplash.com CDN URL
 *  3. Stores that URL in the product's images[] field
 *
 * Rate limit: Unsplash Source allows ~50 requests / hour without a key.
 * The script waits 1.3 s between requests to stay well within that limit.
 *
 * Usage:
 *   node scripts/auto-fix-images.mjs              # update all products
 *   node scripts/auto-fix-images.mjs --dry-run    # preview without writing
 *   node scripts/auto-fix-images.mjs --only-broken # skip products with unique images
 */

import mongoose from "mongoose";

const MONGO_URI =
  process.env.MONGO_URI ??
  "mongodb://freshcart_admin:freshcart_secret@localhost:27017/freshcart?authSource=admin";

const DRY_RUN     = process.argv.includes("--dry-run");
const ONLY_BROKEN = process.argv.includes("--only-broken");
const DELAY_MS    = 1300; // stay under 50 req / hr

// ── Keyword map ───────────────────────────────────────────────────────────────
const KEYWORDS = {
  // Fruits
  "organic-alphonso-mangoes":      "alphonso mango fruit india",
  "royal-gala-apples":             "gala red apple fruit",
  "seedless-watermelon":           "seedless watermelon fresh",
  "mixed-berries-pack":            "mixed berries blueberry strawberry",
  // Vegetables
  "fresh-spinach-palak":           "fresh spinach leaves green",
  "country-tomatoes":              "fresh red tomatoes vine",
  "organic-cauliflower":           "cauliflower organic white",
  "baby-potatoes":                 "baby potatoes harvest",
  // Herbs
  "fresh-coriander-dhania":        "fresh coriander cilantro herb green",
  // Dairy – Milk
  "amul-taaza-toned-milk":         "milk bottle glass pour",
  "organic-full-cream-milk":       "organic full cream milk glass",
  // Dairy – Paneer & Tofu
  "fresh-paneer":                  "paneer cottage cheese Indian",
  "organic-firm-tofu":             "firm tofu soy block",
  // Dairy – Curd
  "organic-set-dahi":              "yogurt curd bowl thick",
  "spiced-masala-chaas":           "buttermilk spiced Indian drink",
  // Dairy – Eggs
  "farm-fresh-eggs":               "farm white eggs basket",
  // Dairy – Butter & Cheese
  "amul-butter-salted":            "salted butter yellow block",
  "mozzarella-cheese-block":       "mozzarella cheese block white",
  // Bakery – Breads
  "whole-wheat-sandwich-bread":    "whole wheat sandwich bread loaf",
  "artisan-sourdough-loaf":        "artisan sourdough bread crust",
  "mumbai-pav-dinner-rolls":       "soft dinner rolls pav bread",
  // Bakery – Cakes & Pastries
  "chocolate-croissants":          "chocolate croissant pastry flaky",
  "banana-walnut-muffins":         "banana walnut muffin baked",
  "black-forest-pastry":           "black forest cake pastry cream",
  // Bakery – Biscuits & Cookies
  "oatmeal-raisin-cookies":        "oatmeal raisin cookies baked",
  "dark-choco-chip-biscuits":      "dark chocolate chip cookie biscuit",
  // Beverages – Juices
  "cold-pressed-orange-juice":     "fresh squeezed orange juice glass",
  "mixed-fruit-juice-tetra-pack":  "mixed fruit juice pack colorful",
  // Beverages – Cold Drinks
  "sparkling-lime-water":          "sparkling water lime fizzy drink",
  // Beverages – Tea & Coffee
  "masala-chai-premix":            "masala chai tea cup spices india",
  "cold-brew-coffee-bottle":       "cold brew coffee bottle dark",
  "green-tea-tulsi-ginger":        "green tea cup herbs ginger",
  // Beverages – Water & Soda
  "himalayan-mineral-water":       "mineral water bottle pure mountain",
  "tender-coconut-water-tetra":    "coconut water fresh tropical",
  // Snacks – Chips & Namkeen
  "roasted-makhana-foxnuts":       "makhana foxnuts roasted snack bowl",
  "haldirams-bhujia-sev":          "Indian namkeen sev crispy snack",
  "roasted-almonds-salted":        "roasted salted almonds nuts bowl",
  // Snacks – Instant Noodles
  "masala-instant-noodles":        "instant noodles masala bowl",
  "korean-ramen-cup-noodles":      "korean ramen spicy noodles cup",
  // Snacks – Ready to Eat
  "natural-peanut-butter-crunchy": "peanut butter crunchy jar spread",
  "dark-chocolate-70-cocoa":       "dark chocolate bar 70 percent",
  "trail-mix-nuts-and-berries":    "trail mix nuts dried berries energy",
  // Meat – Chicken
  "chicken-breast-boneless":       "boneless chicken breast raw fresh",
  "chicken-keema-minced":          "minced chicken meat raw ground",
  "whole-chicken-curry-cut":       "fresh whole chicken cut pieces",
  // Meat – Fish
  "rohu-fish-steaks":              "fresh river fish steak raw",
  "tiger-prawns-large":            "tiger prawns shrimp fresh seafood",
  "atlantic-salmon-fillet":        "atlantic salmon fillet fresh pink",
  // Meat – Poultry Eggs
  "country-eggs-brown":            "brown free range country eggs",
  "omega-3-enriched-eggs":         "enriched omega eggs healthy nutrition",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchUnsplashUrl(keywords) {
  const query = encodeURIComponent(keywords);
  const res = await fetch(
    `https://source.unsplash.com/featured/600x600/?${query}`,
    { redirect: "follow", headers: { "User-Agent": "FreshCart-image-fixer/1.0" } }
  );
  const match = res.url.match(/^https:\/\/images\.unsplash\.com\/photo-[^?]+/);
  return match ? `${match[0]}?w=600&q=80` : null;
}

const ProductSchema = new mongoose.Schema(
  { slug: String, name: String, images: [String] },
  { strict: false }
);
const Product =
  mongoose.models.Product ?? mongoose.model("Product", ProductSchema);

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🖼  FreshCart — Auto-fix Product Images${DRY_RUN ? " [DRY RUN]" : ""}${ONLY_BROKEN ? " [ONLY BROKEN]" : ""}`);
  console.log("─".repeat(60));

  await mongoose.connect(MONGO_URI);
  console.log("✅  Connected to MongoDB\n");

  let skipSet = new Set();
  if (ONLY_BROKEN) {
    const all = await Product.find(
      { slug: { $in: Object.keys(KEYWORDS) } },
      { slug: 1, images: 1 }
    ).lean();
    const urlCount = {};
    for (const p of all) {
      const url = p.images?.[0];
      if (url) urlCount[url] = (urlCount[url] ?? 0) + 1;
    }
    for (const p of all) {
      if (p.images?.[0] && urlCount[p.images[0]] === 1) skipSet.add(p.slug);
    }
    console.log(`ℹ️  Skipping ${skipSet.size} products with unique images.\n`);
  }

  let updated = 0, failed = 0, skipped = 0;

  for (const [slug, keywords] of Object.entries(KEYWORDS)) {
    if (skipSet.has(slug)) { skipped++; continue; }

    const product = await Product.findOne({ slug }, { slug: 1, name: 1 });
    if (!product) {
      console.warn(`  ⚠️  Not found: ${slug}`);
      failed++;
      continue;
    }

    process.stdout.write(`  → ${product.name.padEnd(42)} `);

    try {
      const imageUrl = await fetchUnsplashUrl(keywords);
      if (!imageUrl) {
        console.log("❌  No redirect URL captured");
        failed++;
      } else {
        console.log(`✓`);
        if (!DRY_RUN) {
          await Product.updateOne({ slug }, { $set: { images: [imageUrl] } });
        }
        updated++;
      }
    } catch (err) {
      console.log(`❌  ${err.message}`);
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log("\n" + "─".repeat(60));
  const verb = DRY_RUN ? "would be updated" : "updated";
  console.log(`✅  Done — ${updated} ${verb}, ${skipped} skipped, ${failed} failed.\n`);
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
