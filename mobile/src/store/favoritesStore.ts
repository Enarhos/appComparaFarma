import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MedicationResult } from "@/lib/types";

interface FavoritesState {
  keys: string[];
  cachedResults: Record<string, MedicationResult>;
  toggle: (med: MedicationResult) => void;
  isFavorite: (key: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      keys: [],
      cachedResults: {},
      toggle: (med) =>
        set((state) => {
          const exists = state.keys.includes(med.matchKey);
          return {
            keys: exists
              ? state.keys.filter((k) => k !== med.matchKey)
              : [med.matchKey, ...state.keys],
            cachedResults: { ...state.cachedResults, [med.matchKey]: med },
          };
        }),
      isFavorite: (key) => get().keys.includes(key),
    }),
    {
      name: "favorites-v1",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
