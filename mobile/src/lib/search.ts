import { mergeDuplicates, toMedicationResult } from "@/lib/normalization";
import type { MedicationResult } from "@/lib/types";
import { PHARMACIES } from "@/constants/pharmacies";
import { searchCruzVerde } from "./clients/cruzverde";
import { searchSalcobrand } from "./clients/salcobrand";
import { searchAhumada } from "./clients/ahumada";

export async function searchMedications(
  query: string,
  signal?: AbortSignal
): Promise<MedicationResult[]> {
  const [cvResult, sbResult, ahResult] = await Promise.allSettled([
    searchCruzVerde(query, signal),
    searchSalcobrand(query, signal),
    searchAhumada(query, signal),
  ]);

  const all: MedicationResult[] = [];

  if (cvResult.status === "fulfilled") {
    for (const p of cvResult.value)
      all.push(toMedicationResult(p, "cruz-verde", PHARMACIES["cruz-verde"].name));
  }
  if (sbResult.status === "fulfilled") {
    for (const p of sbResult.value)
      all.push(toMedicationResult(p, "salcobrand", PHARMACIES["salcobrand"].name));
  }
  if (ahResult.status === "fulfilled") {
    for (const p of ahResult.value)
      all.push(toMedicationResult(p, "ahumada", PHARMACIES["ahumada"].name));
  }

  return mergeDuplicates(all).sort((a, b) => a.bestPrice - b.bestPrice);
}
