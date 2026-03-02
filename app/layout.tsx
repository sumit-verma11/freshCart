import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "react-hot-toast";

export const viewport: Viewport = {
  themeColor:          "#1A6B3A",
  width:               "device-width",
  initialScale:        1,
  maximumScale:        5,
  userScalable:        true,
  viewportFit:         "cover",
};

export const metadata: Metadata = {
  title: {
    default:  "FreshCart — Premium Online Grocery",
    template: "%s | FreshCart",
  },
  description:
    "Fresh groceries delivered to your doorstep. Shop fruits, vegetables, dairy, bakery, beverages, snacks & more.",
  keywords: ["grocery", "fresh", "organic", "vegetables", "fruits", "delivery", "india"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable:         true,
    statusBarStyle:  "default",
    title:           "FreshCart",
  },
  formatDetection: { telephone: false },
  icons: {
    icon:  [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title:       "FreshCart — Premium Online Grocery",
    description: "Fresh groceries delivered to your doorstep.",
    type:        "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4
                     focus:z-[200] focus:bg-primary focus:text-white focus:px-4
                     focus:py-2 focus:rounded-xl focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ThemeProvider>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background:   "#1C1C1E",
                color:        "#FFFFFF",
                borderRadius: "12px",
                fontSize:     "14px",
                fontWeight:   "500",
              },
              success: {
                iconTheme: { primary: "#16A34A", secondary: "#FFFFFF" },
              },
              error: {
                iconTheme: { primary: "#DC2626", secondary: "#FFFFFF" },
              },
            }}
          />
        </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
