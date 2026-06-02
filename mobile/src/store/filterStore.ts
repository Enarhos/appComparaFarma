import { create } from "zustand";
import type { PharmacySlug } from "@/lib/types";

interface FilterState {
  activePharmacies: Set<PharmacySlug> | null; // null = todas activas (default)
  setActivePharmacies: (p: Set<PharmacySlug>) => void;
  isPharmacyVisible: (slug: PharmacySlug) => boolean;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  activePharmacies: null,

  setActivePharmacies: (p) => set({ activePharmacies: p }),

  isPharmacyVisible: (slug) => {
    const { activePharmacies } = get();
    return activePharmacies === null || activePharmacies.has(slug);
  },
}));
