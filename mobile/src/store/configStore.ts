import { create } from "zustand";
import type { PharmacySlug } from "@/lib/types";

export interface PharmacyConfig {
  slug: PharmacySlug;
  name: string;
  active: boolean;
}

interface ConfigState {
  pharmacies: PharmacyConfig[];
  loaded: boolean;
  fetch: () => Promise<void>;
  isActive: (slug: PharmacySlug) => boolean;
  activePharmacySlugs: () => PharmacySlug[];
}

const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";

export const useConfigStore = create<ConfigState>((set, get) => ({
  pharmacies: [],
  loaded: false,

  fetch: async () => {
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/config`);
      if (!res.ok) return;
      const data = (await res.json()) as { pharmacies: PharmacyConfig[] };
      set({ pharmacies: data.pharmacies, loaded: true });
    } catch {
      // Falla silenciosamente — la app asume todas las farmacias activas
    }
  },

  /** Devuelve true si la farmacia está activa (o si el config aún no cargó). */
  isActive: (slug) => {
    const { pharmacies, loaded } = get();
    if (!loaded || pharmacies.length === 0) return true;
    const found = pharmacies.find((p) => p.slug === slug);
    return found ? found.active : true;
  },

  /** Lista de slugs activos. */
  activePharmacySlugs: () => {
    const { pharmacies, loaded } = get();
    if (!loaded || pharmacies.length === 0) {
      return ["cruz-verde", "salcobrand", "ahumada", "dr-simi"];
    }
    return pharmacies.filter((p) => p.active).map((p) => p.slug);
  },
}));
