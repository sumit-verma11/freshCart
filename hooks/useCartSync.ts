"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/cart";
import { IClientCartItem } from "@/types";

/**
 * Syncs the cart across browser tabs (BroadcastChannel) and across devices (SSE).
 *
 * - Same device / multiple tabs: BroadcastChannel fires instantly, zero server cost.
 * - Cross-device (mobile + desktop): POSTs cart to /api/cart/sync on change;
 *   server broadcasts to all other SSE connections belonging to the same user.
 */
export function useCartSync() {
  const { items, setItems } = useCartStore();
  const { data: session } = useSession();

  // Stable client ID for this browser tab (persists across renders, not page reloads)
  const clientId  = useRef(
    typeof crypto !== "undefined"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  );
  const prevJson  = useRef("");
  const debouncer = useRef<ReturnType<typeof setTimeout>>();

  // ── BroadcastChannel: instant cross-tab sync (same device) ─────────────────
  useEffect(() => {
    const bc = new BroadcastChannel("freshcart-cart");
    bc.onmessage = (e: MessageEvent<{ from: string; items: IClientCartItem[] }>) => {
      if (e.data.from !== clientId.current) {
        setItems(e.data.items);
      }
    };
    return () => bc.close();
  }, [setItems]);

  // ── Publish changes to BroadcastChannel + SSE (debounced 500ms) ────────────
  useEffect(() => {
    const json = JSON.stringify(items);
    if (json === prevJson.current) return;
    prevJson.current = json;

    // BroadcastChannel (instant)
    try {
      const bc = new BroadcastChannel("freshcart-cart");
      bc.postMessage({ from: clientId.current, items });
      bc.close();
    } catch { /* SSR guard */ }

    // SSE server push (cross-device, logged-in users only)
    if (session?.user?.id) {
      clearTimeout(debouncer.current);
      debouncer.current = setTimeout(() => {
        fetch("/api/cart/sync", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ items, clientId: clientId.current }),
        }).catch(() => {});
      }, 500);
    }
  }, [items, session]);

  // ── SSE: receive cross-device updates ──────────────────────────────────────
  useEffect(() => {
    if (!session?.user?.id) return;

    const es = new EventSource(`/api/cart/sync?clientId=${clientId.current}`);
    es.addEventListener("cartUpdate", (e: MessageEvent) => {
      try {
        const { items: newItems } = JSON.parse(e.data) as { items: IClientCartItem[] };
        setItems(newItems);
      } catch { /* ignore */ }
    });

    return () => es.close();
  }, [session?.user?.id, setItems]);
}
