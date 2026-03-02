"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Package, Tag, ShoppingBag, MapPin,
  Leaf, LogOut, Menu, X, ChevronRight, Bell, BarChart2,
} from "lucide-react";

const NAV = [
  { href: "/admin/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { href: "/admin/analytics",   label: "Analytics",   icon: BarChart2        },
  { href: "/admin/products",    label: "Products",     icon: Package          },
  { href: "/admin/categories",  label: "Categories",   icon: Tag              },
  { href: "/admin/orders",      label: "Orders",       icon: ShoppingBag      },
  { href: "/admin/pincodes",    label: "Pincodes",     icon: MapPin           },
  { href: "/admin/push",        label: "Push Notifs",  icon: Bell             },
];

interface Props {
  adminName: string;
  adminInitial: string;
}

export default function AdminSidebar({ adminName, adminInitial }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="bg-primary rounded-xl p-1.5">
            <Leaf className="w-5 h-5 text-white" />
          </span>
          <span className="text-lg font-bold text-white">
            Fresh<span className="text-secondary">Cart</span>
          </span>
        </Link>
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden text-gray-400 hover:text-white transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <p className="text-xs text-gray-500 px-5 pt-2 pb-1 font-semibold uppercase tracking-wider">
        Admin Panel
      </p>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                          transition-all group
                          ${active
                            ? "bg-white/15 text-white"
                            : "text-gray-400 hover:text-white hover:bg-white/8"
                          }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${active ? "text-secondary" : "text-gray-400 group-hover:text-gray-200"}`} />
              {label}
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-secondary" />}
            </Link>
          );
        })}
      </nav>

      {/* Admin info + sign out */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-1 mb-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center
                          text-sm font-extrabold text-white shrink-0">
            {adminInitial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{adminName}</p>
            <span className="text-xs bg-secondary/20 text-secondary font-semibold
                             px-2 py-0.5 rounded-full">Admin</span>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 w-full
                     hover:text-danger hover:bg-red-900/20 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-dark text-white p-2 rounded-xl shadow-lg"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-dark z-50
                    transform transition-transform duration-300
                    ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {SidebarContent}
      </aside>

      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-dark fixed h-full z-40">
        {SidebarContent}
      </aside>
    </>
  );
}
