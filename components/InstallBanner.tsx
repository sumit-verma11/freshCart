"use client";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";

/**
 * Dismissible bottom banner that prompts the user to install FreshCart as a PWA.
 * Only visible when the browser exposes a deferred install prompt and the user
 * hasn't dismissed it before.
 */
export default function InstallBanner() {
  const { canInstall, isStandalone, isDismissed, promptInstall, dismiss } = useInstallPrompt();

  if (!canInstall || isStandalone || isDismissed) return null;

  return (
    <div
      className="fixed bottom-16 lg:bottom-0 inset-x-0 z-[190]
                 animate-fade-in-up"
    >
      <div className="mx-4 mb-3 bg-white border border-border rounded-2xl
                      shadow-modal p-4 flex items-center gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center
                        justify-center text-2xl shrink-0">
          📲
        </div>

        {/* Copy */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-dark text-sm">Install FreshCart</p>
          <p className="text-xs text-muted mt-0.5">
            Add to Home Screen for a faster, app-like experience
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => void promptInstall()}
            className="btn-primary py-1.5 px-4 text-sm"
          >
            Install
          </button>
          <button
            onClick={dismiss}
            className="w-7 h-7 rounded-full bg-accent flex items-center justify-center
                       text-muted hover:text-dark transition-colors text-xs font-bold"
            aria-label="Dismiss install prompt"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
