"use client";

import { useState, useEffect } from "react";

export interface StockInfo {
  stockQty: number;
  isAvailable: boolean;
}

/**
 * Opens a single SSE connection to /api/stock/watch?products=id1,id2,...
 * and returns a map of productId → { stockQty, isAvailable }.
 *
 * The map is updated in real-time as the admin modifies product stock.
 */
export function useStockWatch(
  productIds: string[]
): Record<string, StockInfo> {
  const [stockData, setStockData] = useState<Record<string, StockInfo>>({});
  const key = productIds.join(",");

  useEffect(() => {
    if (!key) return;

    const es = new EventSource(`/api/stock/watch?products=${key}`);

    es.addEventListener("stockUpdate", (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data) as {
          productId: string;
          stockQty: number;
          isAvailable: boolean;
        };
        setStockData((prev) => ({
          ...prev,
          [d.productId]: { stockQty: d.stockQty, isAvailable: d.isAvailable },
        }));
      } catch { /* ignore */ }
    });

    return () => es.close();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return stockData;
}
