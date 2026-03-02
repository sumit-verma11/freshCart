"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/**
 * Sticky amber banner shown when the browser has no network connectivity.
 * Slides in from the top when offline; removed when online.
 */
export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  return (
    <div
      className={`fixed top-0 inset-x-0 z-[200] transition-transform duration-300
                  ${isOnline ? "-translate-y-full" : "translate-y-0"}`}
    >
      <div className="bg-amber-500 text-white text-sm font-semibold
                      flex items-center justify-center gap-2 py-2.5 px-4
                      shadow-lg text-center">
        <span>📶</span>
        <span>No internet connection · Cart is saved locally</span>
      </div>
    </div>
  );
}
