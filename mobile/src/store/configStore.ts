import { create } from "zustand";
import type { PharmacySlug } from "@/lib/types";
import { PHARMACIES } from "@/constants/pharmacies";

export interface PharmacyConfig {
  slug: PharmacySlug;
  name: string;
  active: boolean;
}

export interface DonationBannerConfig {
  enabled: boolean;
  dismissDays: number;
}

const DEFAULT_DONATION_BANNER: DonationBannerConfig = { enabled: true, dismissDays: 7 };

interface ConfigState {
  pharmacies: PharmacyConfig[];
  donationBanner: DonationBannerConfig;
  loaded: boolean;
  fetch: () => Promise<void>;
  isActive: (slug: PharmacySlug) => boolean;
  activePharmacySlugs: () => PharmacySlug[];
}

const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";

export const useConfigStore = create<ConfigState>((set, get) => ({
  pharmacies: [],
  donationBanner: DEFAULT_DONATION_BANNER,
  loaded: false,

  fetch: async () => {
    if (!API_URL) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/config`, { signal: controller.signal });
      if (!res.ok) return;
      const data = (await res.json()) as {
        pharmacies: PharmacyConfig[];
        donationBanner?: DonationBannerConfig;
      };
      set({
        pharmacies: data.pharmacies,
        donationBanner: data.donationBanner ?? DEFAULT_DONATION_BANNER,
        loaded: true,
      });
    } catch {
      // Falla silenciosamente — la app asume todas las farmacias activas y banner por defecto
    } finally {
      clearTimeout(timeout);
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
      return Object.keys(PHARMACIES) as PharmacySlug[];
    }
    return pharmacies.filter((p) => p.active).map((p) => p.slug);
  },
}));
