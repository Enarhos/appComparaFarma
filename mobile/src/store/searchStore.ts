import { create } from "zustand";
import type { MedicationResult } from "@/lib/types";

type SearchStatus = "idle" | "loading" | "success" | "error";

interface SearchState {
  query: string;
  results: MedicationResult[];
  status: SearchStatus;
  errorMessage: string | null;
  setQuery: (q: string) => void;
  setLoading: () => void;
  setResults: (results: MedicationResult[]) => void;
  setError: (msg: string) => void;
  reset: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: "",
  results: [],
  status: "idle",
  errorMessage: null,
  setQuery: (q) => set({ query: q }),
  setLoading: () => set({ status: "loading", errorMessage: null }),
  setResults: (results) => set({ status: "success", results }),
  setError: (msg) => set({ status: "error", errorMessage: msg }),
  reset: () => set({ query: "", results: [], status: "idle", errorMessage: null }),
}));
