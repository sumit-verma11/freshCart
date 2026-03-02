/**
 * Fix product images in existing MongoDB database.
 *
 * Resolves two issues found in the original seed data:
 *  1. Four pairs of products sharing the same Unsplash image URL.
 *  2. Updates image URLs to more accurate/distinct product photos.
 *
 * Run:
 *   node scripts/fix-product-images.mjs
 *   node scripts/fix-product-images.mjs --dry-run   (preview without writing)
 */

import mongoose from "mongoose";

const MONGO_URI =
  process.env.MONGO_URI ??
  "mongodb://freshcart_admin:freshcart_secret@localhost:27017/freshcart?authSource=admin";

const DRY_RUN = process.argv.includes("--dry-run");

// Map of product slug → corrected image URL(s)
// Only products whose images need changing are listed here.
const IMAGE_FIXES = {
  // ── Duplicates that shared the same Unsplash photo ──────────────────────────

  // Atlantic Salmon was sharing photo with Rohu Fish Steaks
  "atlantic-salmon-fillet": [
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600",
  ],

  // Natural Peanut Butter was sharing photo with Amul Butter Salted
  "natural-peanut-butter-crunchy": [
    "https://images.unsplash.com/photo-1540189549336-e6e99eb4b895?w=600",
  ],

  // Omega-3 Enriched Eggs was sharing photo with Farm Fresh Eggs
  "omega-3-enriched-eggs": [
    "https://images.unsplash.com/photo-1498654077703-1c3e72427c50?w=600",
  ],

  // Korean Ramen was sharing photo with Masala Instant Noodles
  "korean-ramen-cup-noodles": [
    "https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=600",
  ],
};

const ProductSchema = new mongoose.Schema(
  { slug: String, name: String, images: [String] },
  { strict: false }
);
const Product =
  mongoose.models.Product ?? mongoose.model("Product", ProductSchema);

async function main() {
  console.log(`🖼  FreshCart — Fix Product Images${DRY_RUN ? " [DRY RUN]" : ""}`);
  console.log("─".repeat(50));

  await mongoose.connect(MONGO_URI);
  console.log("✅  Connected to MongoDB\n");

  let fixed = 0;
  let notFound = 0;

  for (const [slug, images] of Object.entries(IMAGE_FIXES)) {
    const product = await Product.findOne({ slug });
    if (!product) {
      console.warn(`  ⚠️  Not found: ${slug}`);
      notFound++;
      continue;
    }

    const before = product.images[0] ?? "(none)";
    const after  = images[0];

    if (before === after) {
      console.log(`  ✓  Already correct: ${product.name}`);
      continue;
    }

    console.log(`  → ${product.name}`);
    console.log(`     before: ${before}`);
    console.log(`     after : ${after}`);

    if (!DRY_RUN) {
      await Product.updateOne({ slug }, { $set: { images } });
      fixed++;
    } else {
      fixed++;
    }
  }

  console.log("\n" + "─".repeat(50));
  if (DRY_RUN) {
    console.log(`🔍  Dry run complete — ${fixed} products would be updated, ${notFound} not found.`);
  } else {
    console.log(`✅  Done — ${fixed} products updated, ${notFound} not found.`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
