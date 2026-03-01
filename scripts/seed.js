#!/usr/bin/env node
"use strict";

/**
 * scripts/seed.js
 * Thin Node.js entry-point that registers ts-node and runs the seed.
 * Usage: node scripts/seed.js
 *        npm run seed
 */

const path = require("path");

require("ts-node").register({
  project: path.join(__dirname, "../tsconfig.seed.json"),
  transpileOnly: true,
});

require("../lib/seed").runSeed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
