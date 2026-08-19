import type { MedicationResult, PharmacyPrice, PharmacySlug } from "./types.js";

/**
 * Agrupa ofertas SAME_PRODUCT. Desde FASE 1 — Product Identity (2026-08-19),
 * la clave de agrupación es `presentationKey` (matchKey + bioequivalencia +
 * identidad comercial — ver commercialIdentity.ts), no `matchKey` a secas.
 * `matchKey` sigue siendo la identidad farmacológica amplia que usan
 * historial/alertas/favoritos/tracking/CFM-ID, sin cambios.
 *
 * Como `presentationKey` ya incorpora la bioequivalencia
 * (`|bio:true|false|unknown`), agrupar por ella preserva automáticamente la
 * separación bio=true / bio=false / bio=unknown que ya exigía el fix previo
 * — nunca se fusionan entre sí.
 *
 * Política conservadora explícita: una oferta con identidad comercial
 * conocida (`brand:ascend`, `brand:curaespring`, ...) NUNCA comparte
 * `presentationKey` con una de identidad `brand:unknown` — cada valor
 * distinto de `commercialIdentity` (incluido `"unknown"`) produce su propio
 * grupo. Dos ofertas `brand:unknown` sí caen en el mismo grupo entre sí
 * (limitación conocida y aceptada, no un bug — ver commercialIdentity.ts).
 */
export function mergeDuplicates(results: MedicationResult[]): MedicationResult[] {
  const groups = new Map<string, MedicationResult[]>();
  for (const result of results) {
    const key = result.presentationKey;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(result);
  }

  return [...groups.values()].map((group) => {
    if (group.length === 1) return group[0];

    const canonical = group.reduce((best, cur) => {
      if (!best.laboratory && cur.laboratory) return cur;
      if (best.laboratory && !cur.laboratory) return best;
      return cur.canonicalName.length < best.canonicalName.length ? cur : best;
    });

    const byPharmacy = new Map<PharmacySlug, PharmacyPrice>();
    for (const med of group) {
      for (const price of med.prices) {
        const existing = byPharmacy.get(price.pharmacySlug);
        if (!existing || price.channels.effective < existing.channels.effective) {
          byPharmacy.set(price.pharmacySlug, price);
        }
      }
    }

    const prices = [...byPharmacy.values()].sort((a, b) => a.channels.effective - b.channels.effective);
    const best = prices[0];
    const imageUrl = group.map((med) => med.imageUrl).find((url) => url != null) ?? null;

    return {
      ...canonical,
      prices,
      bestPrice: best?.channels.effective ?? canonical.bestPrice,
      bestPharmacy: best?.pharmacySlug ?? canonical.bestPharmacy,
      imageUrl,
    };
  });
}
