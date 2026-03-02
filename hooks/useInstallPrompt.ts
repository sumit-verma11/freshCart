"use client";

import { useState, useEffect } from "react";

const DISMISS_KEY = "pwa-install-dismissed";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface UseInstallPrompt {
  canInstall:    boolean;
  isStandalone:  boolean;
  isDismissed:   boolean;
  promptInstall: () => Promise<void>;
  dismiss:       () => void;
}

/**
 * Captures the browser's `beforeinstallprompt` event to enable a custom
 * "Add to Home Screen" prompt UI.
 *
 * - `canInstall`: true when the browser has a deferred install prompt ready
 * - `isStandalone`: true when already running as an installed PWA
 * - `isDismissed`: true when the user has previously dismissed our banner
 * - `promptInstall()`: shows the native install dialog
 * - `dismiss()`: persists dismissal to localStorage
 */
export function useInstallPrompt(): UseInstallPrompt {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [isDismissed,    setIsDismissed]    = useState(false);
  const [isStandalone,   setIsStandalone]   = useState(false);

  useEffect(() => {
    // Check if already installed / running in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
    }

    // Check persisted dismissal
    if (localStorage.getItem(DISMISS_KEY) === "true") {
      setIsDismissed(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as InstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // If installed from prompt, hide the banner
    window.addEventListener("appinstalled", () => setDeferredPrompt(null));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setIsDismissed(true);
  };

  return {
    canInstall:   !!deferredPrompt,
    isStandalone,
    isDismissed,
    promptInstall,
    dismiss,
  };
}
