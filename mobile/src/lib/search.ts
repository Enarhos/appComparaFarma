import type { MedicationResult } from "@/lib/types";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";

// La busqueda es publica (Sprint SEC-001): el backend ya no exige x-api-key
// para /api/search. EXPO_PUBLIC_API_KEY se retiro porque, al ir empaquetada
// en el binario de la app, nunca fue realmente secreta — API_SECRET_KEY
// queda reservado para superficies privilegiadas del backend (debug=1,
// /api/subscriptions grant-manual/revoke-manual), nunca para Mobile.
export async function searchMedications(
  query: string,
  signal?: AbortSignal,
  onlyPharmacies?: string[]
): Promise<MedicationResult[]> {
  if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL is required for mobile search.");
  }

  const params = new URLSearchParams({ q: query });
  if (onlyPharmacies && onlyPharmacies.length > 0) {
    params.set("pharmacies", onlyPharmacies.join(","));
  }

  const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/search?${params.toString()}`, {
    signal,
  });

  if (!res.ok) throw new Error(`API search failed with status ${res.status}`);
  return await res.json() as MedicationResult[];
}
