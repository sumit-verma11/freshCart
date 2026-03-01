"use client";

import { useEffect } from "react";
import { trackProductViewed } from "@/lib/analytics";

interface Props {
  productId: string;
  productName: string;
  category?: string;
}

/** Mounts invisibly on the product detail page to fire a product_viewed event. */
export default function ProductViewTracker({ productId, productName, category }: Props) {
  useEffect(() => {
    trackProductViewed(productId, productName, category);
  }, [productId, productName, category]);
  return null;
}
