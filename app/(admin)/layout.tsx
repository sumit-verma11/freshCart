import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import {
  LayoutDashboard, Package, ShoppingBag, Users,
  Leaf, LogOut, PlusCircle
} from "lucide-react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/add-product", label: "Add Product", icon: PlusCircle },
  { href: "/manage-orders", label: "Manage Orders", icon: ShoppingBag },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/login");

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-dark text-white flex flex-col fixed h-full z-40">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <span className="bg-primary rounded-xl p-1.5">
              <Leaf className="w-5 h-5 text-white" />
            </span>
            <span className="text-lg font-bold">
              Fresh<span className="text-secondary">Cart</span>
            </span>
          </Link>
          <p className="text-xs text-gray-400 mt-1 ml-9">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                         text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-sm font-bold">
              {session.user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white truncate max-w-[140px]">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-400">Admin</p>
            </div>
          </div>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400
                       hover:text-danger hover:bg-red-900/20 rounded-xl transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
