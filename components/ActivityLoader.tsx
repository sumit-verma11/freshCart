"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUserActivity } from "@/store/userActivity";

/**
 * Invisible component placed in the shop layout.
 * On login, fetches the last 20 orders and populates the userActivity store
 * so ProductCard, search, and ShopSection can use it.
 */
export default function ActivityLoader() {
  const { data: session } = useSession();
  const { loaded, setOrderHistory, reset } = useUserActivity();

  useEffect(() => {
    if (!session?.user?.id) {
      reset();
      return;
    }
    if (loaded) return;

    fetch("/api/orders?limit=20")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success || !d.data?.length) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orders: any[] = d.data;

        // Build ordered items: {productId, lastOrderedAt}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const itemMap: Record<string, string> = {};
        const catCount: Record<string, number> = {};

        for (const order of orders) {
          const placedAt: string = order.placedAt ?? order.createdAt;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const item of order.items as any[]) {
            const pid = item.productId?.toString?.() ?? item.productId;
            if (!itemMap[pid] || placedAt > itemMap[pid]) {
              itemMap[pid] = placedAt;
            }
          }
          // category info isn't on order items directly — fetch via recommendations later
        }

        const orderedItems = Object.entries(itemMap).map(([productId, lastOrderedAt]) => ({
          productId,
          lastOrderedAt,
        }));

        // Fetch recommendations to get preferred category IDs
        fetch("/api/recommendations")
          .then((r) => r.json())
          .then((rec) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const catIds: string[] = [];
            const seen = new Set<string>();
            if (rec.success && rec.data) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              for (const p of rec.data as any[]) {
                const cid = p.category?._id ?? p.category;
                if (cid && !seen.has(cid)) {
                  seen.add(cid);
                  catIds.push(cid);
                }
              }
            }
            // Count categories from catCount too
            Object.entries(catCount)
              .sort((a, b) => b[1] - a[1])
              .forEach(([cid]) => {
                if (!seen.has(cid)) {
                  seen.add(cid);
                  catIds.push(cid);
                }
              });

            setOrderHistory(orderedItems, catIds);
          })
          .catch(() => {
            setOrderHistory(orderedItems, []);
          });
      })
      .catch(() => {});
  }, [session?.user?.id, loaded, setOrderHistory, reset]);

  return null;
}
