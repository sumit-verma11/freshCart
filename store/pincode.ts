import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PincodeInfo {
  pincode: string;
  area: string;
  city: string;
  state: string;
  isServiceable: boolean;
  estimatedDelivery?: { min: number; max: number };
}

interface PincodeState {
  info: PincodeInfo | null;
  setPincode: (info: PincodeInfo) => void;
  clearPincode: () => void;
}

export const usePincodeStore = create<PincodeState>()(
  persist(
    (set) => ({
      info: null,
      setPincode: (info) => set({ info }),
      clearPincode: () => set({ info: null }),
    }),
    { name: "freshcart-pincode" }
  )
);
