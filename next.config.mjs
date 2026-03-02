import withPWA from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.openfoodfacts.org" },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000", "localhost:3007"] },
  },
};

export default withPWA({
  dest: "public",
  // SW is only registered in production; dev uses hot-reload without SW
  disable: process.env.NODE_ENV === "development",
  // Merges /worker/index.ts into the generated service worker
  customWorkerSrc: "worker",
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  fallbacks: { document: "/offline" },
  workboxOptions: {
    runtimeCaching: [
      {
        // Cache product API responses for offline browsing
        urlPattern: /^\/api\/products/,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-products",
          expiration: { maxEntries: 100, maxAgeSeconds: 3600 },
          networkTimeoutSeconds: 5,
        },
      },
      {
        // Cache flash-sale data
        urlPattern: /^\/api\/flash-sale/,
        handler: "StaleWhileRevalidate",
        options: { cacheName: "api-flash-sale", expiration: { maxAgeSeconds: 300 } },
      },
    ],
  },
})(nextConfig);
