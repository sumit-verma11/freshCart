import { create } from "zustand";

interface OrderedItem {
  productId:   string;
  lastOrderedAt: string; // ISO string
}

interface UserActivityState {
  // Map of productId → ISO date string of last order
  orderedProducts: Record<string, string>;
  // Category IDs ordered by purchase frequency (most-bought first)
  preferredCategoryIds: string[];
  // Whether we've already loaded data (avoid re-fetching on every mount)
  loaded: boolean;

  setOrderHistory: (items: OrderedItem[], categoryIds: string[]) => void;
  hasOrdered:      (productId: string) => boolean;
  daysSinceOrder:  (productId: string) => number | null;
  reset:           () => void;
}

export const useUserActivity = create<UserActivityState>((set, get) => ({
  orderedProducts:      {},
  preferredCategoryIds: [],
  loaded:               false,

  setOrderHistory(items, categoryIds) {
    const map: Record<string, string> = {};
    for (const { productId, lastOrderedAt } of items) {
      // Keep the most recent order date if product appears multiple times
      if (!map[productId] || lastOrderedAt > map[productId]) {
        map[productId] = lastOrderedAt;
      }
    }
    set({ orderedProducts: map, preferredCategoryIds: categoryIds, loaded: true });
  },

  hasOrdered(productId) {
    return productId in get().orderedProducts;
  },

  daysSinceOrder(productId) {
    const date = get().orderedProducts[productId];
    if (!date) return null;
    const diff = Date.now() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  },

  reset() {
    set({ orderedProducts: {}, preferredCategoryIds: [], loaded: false });
  },
}));
