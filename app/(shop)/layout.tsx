import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import ActivityLoader from "@/components/ActivityLoader";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <ActivityLoader />
      <Navbar />
      {/* pb-16 on mobile gives room for the fixed BottomNav */}
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <div className="hidden lg:block"><Footer /></div>
      <BottomNav />
    </div>
  );
}
