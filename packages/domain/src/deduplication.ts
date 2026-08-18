import type { MedicationResult, PharmacyPrice, PharmacySlug } from "./types.js";

export function mergeDuplicates(results: MedicationResult[]): MedicationResult[] {
  const groups = new Map<string, MedicationResult[]>();
  for (const result of results) {
    const key = `${result.matchKey}|bio:${bioequivalenceKey(result.isBioequivalent)}`;
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

function bioequivalenceKey(value: MedicationResult["isBioequivalent"]): "true" | "false" | "unknown" {
  if (value === true) return "true";
  if (value === false) return "false";
  return "unknown";
}
