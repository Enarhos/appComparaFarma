"use server";

import type { MedicationResult } from "@comparafarma/domain";
import { searchMedications } from "@/lib/search";

export interface RecipePriceLookup {
  matchKey: string;
  canonicalName: string;
}

/**
 * Resuelve precios frescos para cada item de "mi receta" (Sprint E).
 * No se guarda ningún MedicationResult en localStorage — solo matchKey +
 * canonicalName — para que la comparación siempre refleje precios actuales
 * en vez de una foto vieja del momento en que se agregó el medicamento.
 *
 * Server Action (no Route Handler): mantiene el patrón existente de
 * web/lib/search.ts, donde el fetch al backend corre siempre server-side
 * (ver comentario en web/.env.example) sin exponer API_URL al cliente.
 *
 * Devuelve `null` en la posición de cualquier item que ya no aparezca en el
 * backend (ej. producto descontinuado o renombrado) — nunca rompe el array
 * completo por un item faltante.
 */
export async function getRecipePrices(items: RecipePriceLookup[]): Promise<(MedicationResult | null)[]> {
  return Promise.all(
    items.map(async (item) => {
      const { results } = await searchMedications(item.canonicalName);
      return results.find((result) => result.matchKey === item.matchKey) ?? null;
    })
  );
}
