import { create } from "zustand";

interface CartSidebarState {
  open: boolean;
  toggle: () => void;
  close: () => void;
  openSidebar: () => void;
}

export const useCartSidebarStore = create<CartSidebarState>()((set) => ({
  open: false,
  toggle:      () => set((s) => ({ open: !s.open })),
  close:       () => set({ open: false }),
  openSidebar: () => set({ open: true }),
}));
