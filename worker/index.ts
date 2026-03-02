/**
 * Custom service worker additions — merged into the Workbox-generated SW by next-pwa.
 *
 * Handles:
 * - Web Push notifications (push event)
 * - Notification click navigation (notificationclick event)
 */

declare let self: ServiceWorkerGlobalScope;

// ─── Push event ─────────────────────────────────────────────────────────────
// Receives payloads sent via web-push (VAPID) and shows a system notification.

self.addEventListener("push", (event) => {
  const data = event.data?.json() as {
    title?: string;
    body?: string;
    url?: string;
    tag?: string;
  } ?? {};

  const title = data.title ?? "FreshCart";
  const options: NotificationOptions = {
    body:  data.body  ?? "You have a new update.",
    icon:  "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag:   data.tag   ?? "freshcart-notification",
    data:  { url: data.url ?? "/" },
    // Show even if another notification with same tag is pending
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification click ──────────────────────────────────────────────────────
// Focus an existing window on the target URL, or open a new one.

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl: string = (event.notification.data as { url?: string })?.url ?? "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(targetUrl);
      })
  );
});
