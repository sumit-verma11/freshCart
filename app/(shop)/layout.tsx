import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import ActivityLoader from "@/components/ActivityLoader";
import CartSyncLoader from "@/components/CartSyncLoader";
import OfflineBanner from "@/components/OfflineBanner";
import InstallBanner from "@/components/InstallBanner";
import CartSidebar from "@/components/CartSidebar";
import CommandPalette from "@/components/CommandPalette";
import BackToTop from "@/components/BackToTop";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <ActivityLoader />
      <CartSyncLoader />
      <OfflineBanner />
      <Navbar />
      {/* pb-16 on mobile gives room for the fixed BottomNav */}
      <main id="main-content" className="flex-1 pb-16 lg:pb-0">{children}</main>
      <div className="hidden lg:block"><Footer /></div>
      <BottomNav />
      {/* Install prompt sits above BottomNav (bottom-16) */}
      <InstallBanner />
      <CartSidebar />
      <CommandPalette />
      <BackToTop />
    </div>
  );
}
