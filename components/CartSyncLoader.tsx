"use client";

import { useCartSync } from "@/hooks/useCartSync";

/**
 * Invisible component mounted in the shop layout.
 * Activates cart sync across browser tabs (BroadcastChannel) and devices (SSE).
 */
export default function CartSyncLoader() {
  useCartSync();
  return null;
}
