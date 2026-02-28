import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: {
    default: "FreshCart — Premium Online Grocery",
    template: "%s | FreshCart",
  },
  description:
    "Fresh groceries delivered to your doorstep. Shop fruits, vegetables, dairy, bakery, beverages, snacks & more.",
  keywords: ["grocery", "fresh", "organic", "vegetables", "fruits", "delivery", "india"],
  openGraph: {
    title: "FreshCart — Premium Online Grocery",
    description: "Fresh groceries delivered to your doorstep.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#1C1C1E",
                color: "#FFFFFF",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "500",
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
      </body>
    </html>
  );
}
