import { create } from "zustand";
import type { PharmacySlug } from "@/lib/types";

export type SortOption = "price" | "name";

interface FilterState {
  activePharmacies: Set<PharmacySlug> | null; // null = todas activas (default)
  sortBy: SortOption;
  setActivePharmacies: (p: Set<PharmacySlug> | null) => void;
  setSortBy: (s: SortOption) => void;
  isPharmacyVisible: (slug: PharmacySlug) => boolean;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  activePharmacies: null,
  sortBy: "price",

  setActivePharmacies: (p) => set({ activePharmacies: p }),
  setSortBy: (s) => set({ sortBy: s }),

  isPharmacyVisible: (slug) => {
    const { activePharmacies } = get();
    return activePharmacies === null || activePharmacies.has(slug);
  },
}));
