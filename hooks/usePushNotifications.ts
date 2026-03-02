"use client";

import { useState, useEffect } from "react";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

interface UsePushNotifications {
  permission:            PermissionState;
  requestAndSubscribe:   () => Promise<void>;
  unsubscribe:           () => Promise<void>;
}

/**
 * Converts a base64url-encoded VAPID public key to a Uint8Array
 * as required by pushManager.subscribe({ applicationServerKey }).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding  = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64   = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData  = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Manages the full web push lifecycle:
 * - Checks current Notification permission
 * - requestAndSubscribe(): asks permission → registers SW push subscription →
 *   POSTs to /api/push/subscribe
 * - unsubscribe(): unsubscribes from SW + DELETEs from /api/push/unsubscribe
 */
export function usePushNotifications(): UsePushNotifications {
  const [permission, setPermission] = useState<PermissionState>("default");

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PermissionState);
  }, []);

  const requestAndSubscribe = async () => {
    if (typeof Notification === "undefined" || !("serviceWorker" in navigator)) return;

    const result = await Notification.requestPermission();
    setPermission(result as PermissionState);

    if (result !== "granted") return;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.warn("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set");
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
    } catch (err) {
      console.error("[push] subscribe failed:", err);
    }
  };

  const unsubscribe = async () => {
    if (!("serviceWorker" in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;

      await fetch("/api/push/unsubscribe", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ endpoint: sub.endpoint }),
      });

      await sub.unsubscribe();
      setPermission("default");
    } catch (err) {
      console.error("[push] unsubscribe failed:", err);
    }
  };

  return { permission, requestAndSubscribe, unsubscribe };
}
