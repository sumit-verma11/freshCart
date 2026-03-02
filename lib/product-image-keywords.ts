/**
 * Maps every product slug to an Unsplash keyword string used to
 * fetch a relevant image via the Unsplash Source API.
 * Shared by the admin fix-images API route and the CLI script.
 */
export const PRODUCT_IMAGE_KEYWORDS: Record<string, string> = {
  // ── Fruits ─────────────────────────────────────────────────────────────────
  "organic-alphonso-mangoes":      "alphonso mango fruit india",
  "royal-gala-apples":             "gala red apple fruit",
  "seedless-watermelon":           "seedless watermelon fresh",
  "mixed-berries-pack":            "mixed berries blueberry strawberry",

  // ── Vegetables ─────────────────────────────────────────────────────────────
  "fresh-spinach-palak":           "fresh spinach leaves green",
  "country-tomatoes":              "fresh red tomatoes vine",
  "organic-cauliflower":           "cauliflower organic white",
  "baby-potatoes":                 "baby potatoes harvest",

  // ── Herbs ──────────────────────────────────────────────────────────────────
  "fresh-coriander-dhania":        "fresh coriander cilantro herb green",

  // ── Dairy – Milk ───────────────────────────────────────────────────────────
  "amul-taaza-toned-milk":         "milk bottle glass pour",
  "organic-full-cream-milk":       "organic full cream milk glass",

  // ── Dairy – Paneer & Tofu ──────────────────────────────────────────────────
  "fresh-paneer":                  "paneer cottage cheese Indian",
  "organic-firm-tofu":             "firm tofu soy block",

  // ── Dairy – Curd ───────────────────────────────────────────────────────────
  "organic-set-dahi":              "yogurt curd bowl thick",
  "spiced-masala-chaas":           "buttermilk spiced Indian drink",

  // ── Dairy – Eggs ───────────────────────────────────────────────────────────
  "farm-fresh-eggs":               "farm white eggs basket",

  // ── Dairy – Butter & Cheese ────────────────────────────────────────────────
  "amul-butter-salted":            "salted butter yellow block",
  "mozzarella-cheese-block":       "mozzarella cheese block white",

  // ── Bakery – Breads ────────────────────────────────────────────────────────
  "whole-wheat-sandwich-bread":    "whole wheat sandwich bread loaf",
  "artisan-sourdough-loaf":        "artisan sourdough bread crust",
  "mumbai-pav-dinner-rolls":       "soft dinner rolls pav bread",

  // ── Bakery – Cakes & Pastries ──────────────────────────────────────────────
  "chocolate-croissants":          "chocolate croissant pastry flaky",
  "banana-walnut-muffins":         "banana walnut muffin baked",
  "black-forest-pastry":           "black forest cake pastry cream",

  // ── Bakery – Biscuits & Cookies ────────────────────────────────────────────
  "oatmeal-raisin-cookies":        "oatmeal raisin cookies baked",
  "dark-choco-chip-biscuits":      "dark chocolate chip cookie biscuit",

  // ── Beverages – Juices ─────────────────────────────────────────────────────
  "cold-pressed-orange-juice":     "fresh squeezed orange juice glass",
  "mixed-fruit-juice-tetra-pack":  "mixed fruit juice pack colorful",

  // ── Beverages – Cold Drinks ────────────────────────────────────────────────
  "sparkling-lime-water":          "sparkling water lime fizzy drink",

  // ── Beverages – Tea & Coffee ───────────────────────────────────────────────
  "masala-chai-premix":            "masala chai tea cup spices india",
  "cold-brew-coffee-bottle":       "cold brew coffee bottle dark",
  "green-tea-tulsi-ginger":        "green tea cup herbs ginger",

  // ── Beverages – Water & Soda ───────────────────────────────────────────────
  "himalayan-mineral-water":       "mineral water bottle pure mountain",
  "tender-coconut-water-tetra":    "coconut water fresh tropical",

  // ── Snacks – Chips & Namkeen ───────────────────────────────────────────────
  "roasted-makhana-foxnuts":       "makhana foxnuts roasted snack bowl",
  "haldirams-bhujia-sev":          "Indian namkeen sev crispy snack",
  "roasted-almonds-salted":        "roasted salted almonds nuts bowl",

  // ── Snacks – Instant Noodles ───────────────────────────────────────────────
  "masala-instant-noodles":        "instant noodles masala bowl",
  "korean-ramen-cup-noodles":      "korean ramen spicy noodles cup",

  // ── Snacks – Ready to Eat ──────────────────────────────────────────────────
  "natural-peanut-butter-crunchy": "peanut butter crunchy jar spread",
  "dark-chocolate-70-cocoa":       "dark chocolate bar 70 percent",
  "trail-mix-nuts-and-berries":    "trail mix nuts dried berries energy",

  // ── Meat – Chicken ─────────────────────────────────────────────────────────
  "chicken-breast-boneless":       "boneless chicken breast raw fresh",
  "chicken-keema-minced":          "minced chicken meat raw ground",
  "whole-chicken-curry-cut":       "fresh whole chicken cut pieces",

  // ── Meat – Fish ────────────────────────────────────────────────────────────
  "rohu-fish-steaks":              "fresh river fish steak raw",
  "tiger-prawns-large":            "tiger prawns shrimp fresh seafood",
  "atlantic-salmon-fillet":        "atlantic salmon fillet fresh pink",

  // ── Meat – Poultry Eggs ────────────────────────────────────────────────────
  "country-eggs-brown":            "brown free range country eggs",
  "omega-3-enriched-eggs":         "enriched omega eggs healthy nutrition",
};
