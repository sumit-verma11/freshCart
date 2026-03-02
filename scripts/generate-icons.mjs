/**
 * One-time script to generate PWA icons from the SVG source.
 * Run: node scripts/generate-icons.mjs
 *
 * Uses sharp, which is bundled with Next.js — no extra install needed.
 */

import { readFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Try the sharp version bundled with Next.js first, then fall back to standalone
let sharp;
try {
  const mod = await import("sharp");
  sharp = mod.default;
} catch {
  console.error("sharp not found. Run: npm install sharp");
  process.exit(1);
}

mkdirSync(resolve(root, "public/icons"), { recursive: true });

const svg = readFileSync(resolve(root, "public/icons/icon.svg"));

await sharp(svg).resize(192).png().toFile(resolve(root, "public/icons/icon-192.png"));
console.log("✅ icon-192.png generated");

await sharp(svg).resize(512).png().toFile(resolve(root, "public/icons/icon-512.png"));
console.log("✅ icon-512.png generated");

await sharp(svg).resize(180).png().toFile(resolve(root, "public/icons/apple-touch-icon.png"));
console.log("✅ apple-touch-icon.png generated");

console.log("🎉 All icons generated in public/icons/");
