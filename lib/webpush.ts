import webpush from "web-push";

// Initialize VAPID details once at module load
// NEXT_PUBLIC_VAPID_PUBLIC_KEY is safe to expose (it's the public key)
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT    ?? "mailto:admin@freshcart.in",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY            ?? ""
);

export interface PushPayload {
  title: string;
  body:  string;
  url?:  string;
  tag?:  string;
}

interface PushSubscriptionKeys {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/**
 * Send a Web Push notification to a single subscription.
 *
 * Returns `true` on success, `false` on failure.
 * When the subscription is expired (HTTP 410), the caller should delete it.
 */
export async function sendPushNotification(
  subscription: PushSubscriptionKeys,
  payload:       PushPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 410 || status === 404) {
      // Subscription has expired or been cancelled by the user
      return false;
    }
    console.error("[webpush] sendNotification failed:", err);
    return false;
  }
}
