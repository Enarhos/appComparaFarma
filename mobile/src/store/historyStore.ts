import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MAX_ITEMS = 10;

interface HistoryState {
  items: string[];
  add: (query: string) => void;
  remove: (query: string) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      items: [],
      add: (query) =>
        set((state) => ({
          items: [query, ...state.items.filter((i) => i !== query)].slice(0, MAX_ITEMS),
        })),
      remove: (query) =>
        set((state) => ({ items: state.items.filter((i) => i !== query) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "search-history",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
