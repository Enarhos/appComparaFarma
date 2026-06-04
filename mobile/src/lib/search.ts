import type { MedicationResult } from "@/lib/types";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";
const API_KEY = process.env.EXPO_PUBLIC_API_KEY?.trim() ?? "";

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
    headers: API_KEY ? { "x-api-key": API_KEY } : undefined,
  });

  if (!res.ok) throw new Error(`API search failed with status ${res.status}`);
  return await res.json() as MedicationResult[];
}
