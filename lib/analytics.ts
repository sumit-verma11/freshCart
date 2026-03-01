/**
 * Analytics event helpers — console.log placeholders.
 * Replace console.log with your analytics provider (GA4, Mixpanel, PostHog, etc.)
 */

type EventProperties = Record<string, string | number | boolean | undefined>;

export function trackEvent(event: string, properties?: EventProperties): void {
  if (typeof window === "undefined") return;
  console.log("[analytics]", event, properties ?? {});
  // TODO: window.gtag?.("event", event, properties);
  // TODO: mixpanel.track(event, properties);
}

// ── Typed helpers ──────────────────────────────────────────────────────────────

export function trackProductViewed(productId: string, productName: string, category?: string) {
  trackEvent("product_viewed", { productId, productName, category });
}

export function trackAddToCart(productId: string, productName: string, price: number, qty: number) {
  trackEvent("add_to_cart", { productId, productName, price, qty });
}

export function trackRemoveFromCart(productId: string, productName: string) {
  trackEvent("remove_from_cart", { productId, productName });
}

export function trackCheckoutStarted(total: number, itemCount: number) {
  trackEvent("checkout_started", { total, itemCount });
}

export function trackOrderPlaced(orderId: string, total: number, itemCount: number) {
  trackEvent("order_placed", { orderId, total, itemCount });
}

export function trackWishlistAdd(productId: string, productName: string) {
  trackEvent("wishlist_add", { productId, productName });
}

export function trackWishlistRemove(productId: string, productName: string) {
  trackEvent("wishlist_remove", { productId, productName });
}

export function trackSearch(query: string, resultCount?: number) {
  trackEvent("search", { query, resultCount });
}
