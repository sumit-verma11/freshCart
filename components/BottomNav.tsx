"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, Package, User } from "lucide-react";
import { useCartStore } from "@/store/cart";

const NAV_ITEMS = [
  { href: "/",           label: "Home",       icon: Home },
  { href: "/categories", label: "Categories", icon: LayoutGrid },
  { href: "/cart",       label: "Cart",       icon: ShoppingCart },
  { href: "/orders",     label: "Orders",     icon: Package },
  { href: "/profile",    label: "Profile",    icon: User },
];

export default function BottomNav() {
  const pathname    = usePathname();
  const cartCount   = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-border
                    safe-area-inset-bottom">
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/"
            ? pathname === "/"
            : pathname.startsWith(href);
          const isCart = href === "/cart";

          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px]
                          font-semibold transition-colors relative
                          ${isActive ? "text-primary" : "text-muted hover:text-dark"}`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                {isCart && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px]
                                   font-bold rounded-full w-4 h-4 flex items-center justify-center
                                   leading-none">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
