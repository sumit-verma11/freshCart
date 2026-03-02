"use client";

import { useState, useEffect } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const SESSION_KEY = "push-prompt-dismissed";

/**
 * Bottom-sheet prompt shown after the user places their first order.
 * Asks permission to send push notifications for delivery updates.
 *
 * Dismissed state is stored in sessionStorage so it re-appears next session.
 */
export default function PushPermissionPrompt() {
  const { permission, requestAndSubscribe } = usePushNotifications();
  const [visible,  setVisible]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    // Only show if permission hasn't been decided yet and user hasn't dismissed
    if (
      permission === "default" &&
      !sessionStorage.getItem(SESSION_KEY)
    ) {
      // Small delay so it doesn't compete with the order success banner
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, [permission]);

  if (!visible) return null;

  const handleEnable = async () => {
    setLoading(true);
    await requestAndSubscribe();
    setLoading(false);
    setVisible(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(false);
  };

  return (
    /* Overlay */
    <div className="fixed inset-0 z-[300] flex items-end justify-center
                    bg-black/40 backdrop-blur-sm animate-fade-in"
         onClick={handleDismiss}>

      {/* Sheet */}
      <div className="w-full max-w-lg bg-white rounded-t-3xl p-6 shadow-modal
                      animate-fade-in-up"
           onClick={(e) => e.stopPropagation()}>

        {/* Bell icon */}
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center
                        justify-center text-3xl mx-auto mb-4">
          🔔
        </div>

        <h2 className="text-lg font-bold text-dark text-center mb-2">
          Stay updated on your order!
        </h2>
        <p className="text-sm text-muted text-center mb-6">
          Get notified when your order is confirmed, out for delivery, and more.
          We&apos;ll never spam you.
        </p>

        <button
          onClick={handleEnable}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 mb-3"
        >
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enabling…</>
            : "🔔 Enable Notifications"}
        </button>

        <button
          onClick={handleDismiss}
          className="w-full py-2.5 text-sm text-muted font-medium hover:text-dark transition-colors"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}
