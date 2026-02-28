import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ICartItem } from "@/types";
import { getDeliveryCharge } from "@/lib/utils";

interface CartState {
  items: ICartItem[];
  addItem: (item: ICartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: () => number;
  deliveryCharge: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.min(quantity, i.stock) }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      subtotal: () => {
        return get().items.reduce((sum, i) => {
          const price = i.salePrice ?? i.price;
          return sum + price * i.quantity;
        }, 0);
      },

      deliveryCharge: () => getDeliveryCharge(get().subtotal()),

      total: () => get().subtotal() + get().deliveryCharge(),
    }),
    {
      name: "freshcart-cart",
    }
  )
);
