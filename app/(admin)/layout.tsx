import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminSidebar from "./_components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/login");

  const name    = session.user.name ?? "Admin";
  const initial = name[0]?.toUpperCase() ?? "A";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar adminName={name} adminInitial={initial} />

      {/* Main content — offset by sidebar width on desktop */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Top bar (mobile padding for hamburger) */}
        <div className="lg:hidden h-14" />
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
