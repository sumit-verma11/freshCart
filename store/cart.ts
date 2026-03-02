import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IClientCartItem } from "@/types";
import { getDeliveryCharge } from "@/lib/utils";

interface CartState {
  items: IClientCartItem[];
  addItem: (item: IClientCartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setItems: (items: IClientCartItem[]) => void;
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
          const existing = state.items.find(
            (i) => i.productId === item.productId && i.variantSku === item.variantSku
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId && i.variantSku === item.variantSku
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

      setItems: (items) => set({ items }),

      clearCart: () => set({ items: [] }),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0),

      deliveryCharge: () => getDeliveryCharge(get().subtotal()),

      total: () => get().subtotal() + get().deliveryCharge(),
    }),
    { name: "freshcart-cart" }
  )
);
