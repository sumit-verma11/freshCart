import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistItem {
  productId: string;
  name: string;
  image: string;
  slug: string;
  price: number;
  mrp: number;
}

interface WishlistState {
  items: WishlistItem[];
  add: (item: WishlistItem) => void;
  remove: (productId: string) => void;
  toggle: (item: WishlistItem) => void;
  has: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (item) => {
        set((s) => {
          if (s.items.some((i) => i.productId === item.productId)) return s;
          return { items: [...s.items, item] };
        });
      },

      remove: (productId) => {
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) }));
      },

      toggle: (item) => {
        const { has, add, remove } = get();
        has(item.productId) ? remove(item.productId) : add(item);
      },

      has: (productId) => get().items.some((i) => i.productId === productId),

      clear: () => set({ items: [] }),
    }),
    { name: "freshcart-wishlist" }
  )
);
