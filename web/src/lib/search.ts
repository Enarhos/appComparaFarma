import type { MedicationResult } from "@comparafarma/domain";

const API_URL = (process.env.API_URL ?? "https://comparafarma-api.vercel.app").replace(/\/$/, "");

export interface SearchOutcome {
  results: MedicationResult[];
  error: string | null;
}

export async function searchMedications(query: string): Promise<SearchOutcome> {
  try {
    const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`, {
      next: { revalidate: 300 }, // mismo TTL que el caché del backend (SEARCH_CACHE_TTL_MS)
    });
    if (!res.ok) {
      return { results: [], error: "No pudimos completar la búsqueda en este momento." };
    }
    const results = (await res.json()) as MedicationResult[];
    return { results, error: null };
  } catch {
    return { results: [], error: "No pudimos completar la búsqueda en este momento." };
  }
}
