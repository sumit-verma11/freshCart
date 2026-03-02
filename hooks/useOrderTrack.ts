"use client";

import { useState, useEffect } from "react";
import { OrderStatus } from "@/types";

/**
 * Opens a SSE connection to /api/orders/[id]/track and returns the latest
 * live order status (null until the first event is received).
 *
 * @param orderId  MongoDB order _id string
 * @param enabled  Only opens the connection when true (set to `isExpanded`)
 */
export function useOrderTrack(
  orderId: string,
  enabled: boolean
): OrderStatus | null {
  const [liveStatus, setLiveStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (!enabled || !orderId) return;

    const es = new EventSource(`/api/orders/${orderId}/track`);

    es.addEventListener("statusUpdate", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as { status: OrderStatus };
        setLiveStatus(data.status);
      } catch { /* ignore malformed events */ }
    });

    es.onerror = () => {
      // Browser will auto-reconnect; nothing to do here
    };

    return () => {
      es.close();
      setLiveStatus(null);
    };
  }, [orderId, enabled]);

  return liveStatus;
}
