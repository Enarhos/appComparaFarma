import { create } from "zustand";
import type { MedicationResult } from "@/lib/types";

const MAX_ITEMS = 8;

interface CartState {
  items: MedicationResult[];
  add: (med: MedicationResult) => void;
  remove: (matchKey: string) => void;
  clear: () => void;
  isInCart: (matchKey: string) => boolean;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  add: (med) =>
    set((state) => {
      if (state.items.some((i) => i.matchKey === med.matchKey)) return state;
      return { items: [...state.items, med].slice(0, MAX_ITEMS) };
    }),
  remove: (matchKey) =>
    set((state) => ({ items: state.items.filter((i) => i.matchKey !== matchKey) })),
  clear: () => set({ items: [] }),
  isInCart: (matchKey) => get().items.some((i) => i.matchKey === matchKey),
}));
