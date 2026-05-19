import type { MedicationResult, PharmacyPrice, ScrapedProduct, PharmacySlug } from "./types";

const GENERIC_WORDS = new Set([
  "comp", "comprimido", "comprimidos", "capsulas", "capsula", "cap", "tab",
  "tableta", "tabletas", "mast", "masticable", "masticables", "sol", "solucion",
  "jarabe", "suspension", "crema", "gel", "gotas", "ampolla", "inyectable",
  "recubierto", "liberacion", "prolongada", "retard", "simple",
  "inh", "inhalador", "inhalacion", "aerosol", "bucal", "oral", "topico",
  "spray", "polvo", "parche", "supositorio", "colirio", "nasal", "ocular",
  "oftalmico", "rectal", "vaginal", "sublingual",
  "inf", "jbe", "amp", "sus", "crm", "gts", "iny", "ovul", "liq", "pom",
  "ung", "oft", "otic", "cps",
  "facidose",
  "dosis", "ds", "aplic", "aplicacion", "sos", "horas", "hrs", "cada",
  "via", "veces", "dia", "dias", "semana",
  "x", "de", "la", "el", "los", "las", "con", "para", "sin", "por",
  "mg", "ml", "mcg", "ug", "gr", "ui", "iu", "g",
]);

const PRESCRIPTION_CUTOFF =
  /\b(principio\s+activo|dosis|cada|via|forma\s+farm|posologia|indicacion|instruccion|administrar|tomar|aplicar|frecuencia)\b/i;

export function cleanQuery(raw: string): string {
  const cutoffMatch = PRESCRIPTION_CUTOFF.exec(raw);
  const text = cutoffMatch ? raw.slice(0, cutoffMatch.index) : raw;

  const words = text
    .replace(/\[.*?\]/g, " ")
    .replace(/\(.*?\)/g, " ")
    .replace(/[.,:/]/g, " ")
    .split(/\s+/)
    .filter((w) => {
      const lower = w.toLowerCase();
      return (
        w.length >= 2 &&
        !GENERIC_WORDS.has(lower) &&
        !/^\d+$/.test(w) &&
        !/^\d+[\.,]?\d*\s*(mg|ml|mcg|ug|gr|ui|iu|g|µg)$/i.test(w)
      );
    });
  return [...new Set(words)].join(" ").trim();
}

const STOP_WORDS = new Set([
  "x", "de", "la", "el", "los", "las", "con", "para", "sin", "por",
  "comp", "comprimido", "comprimidos", "capsula", "capsulas", "tab",
  "tableta", "tabletas", "sol", "solucion", "jarabe", "suspension",
  "crema", "gel", "gotas", "ampolla", "inyectable", "recubierto",
  "liberacion", "prolongada", "inhalador", "aerosol", "polvo",
  "parche", "supositorio", "colirio", "nasal", "ocular", "rectal",
  "mg", "ml", "mcg", "g", "ui", "iu", "infantil", "adulto", "forte",
  "plus", "pediatrico", "nino",
]);

export function matchKey(name: string): string {
  const raw = name.toLowerCase();
  const mlHits  = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*ml\b/gi)];
  const mgHits  = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*mg\b/gi)];
  const mcgHits = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:mcg|µg|ug)\b/gi)];
  const lower = raw.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const words = lower.split(" ");

  let first = "";
  for (const w of words) {
    if (w.length >= 2 && !STOP_WORDS.has(w) && !/^\d/.test(w)) {
      first = w;
      break;
    }
  }

  let dose = "";
  if (mlHits.length) {
    const max = Math.max(...mlHits.map((m) => parseFloat(m[1].replace(",", "."))));
    dose = `${max}ml`;
  } else if (mcgHits.length) {
    dose = `${parseFloat(mcgHits[0][1].replace(",", "."))}mcg`;
  } else if (mgHits.length) {
    dose = `${parseFloat(mgHits[0][1].replace(",", "."))}mg`;
  }

  return first ? (dose ? `${first}|${dose}` : first) : lower.slice(0, 30);
}

export function effectivePrice(channels: { store: number; online: number | null; cmr: number | null }): number {
  return Math.min(
    channels.store,
    channels.online ?? channels.store,
    channels.cmr ?? channels.store
  );
}

export function toPharmacyPrice(
  product: ScrapedProduct,
  pharmacySlug: PharmacySlug,
  pharmacyName: string
): PharmacyPrice {
  const channels = {
    store: product.price,
    online: product.onlinePrice,
    cmr: product.cmrPrice,
    effective: effectivePrice({ store: product.price, online: product.onlinePrice, cmr: product.cmrPrice }),
  };
  return {
    pharmacySlug,
    pharmacyName,
    channels,
    hasStock: product.hasStock,
    hasOnlineDelivery: product.hasOnlineDelivery,
    onlineUrl: product.onlineUrl,
    fetchedAt: new Date().toISOString(),
  };
}

export function mergeDuplicates(results: MedicationResult[]): MedicationResult[] {
  const groups = new Map<string, MedicationResult[]>();
  for (const result of results) {
    const key = result.matchKey;
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

    // Merge prices: keep most recent per pharmacy
    const byPharmacy = new Map<PharmacySlug, PharmacyPrice>();
    for (const med of group) {
      for (const p of med.prices) {
        const ex = byPharmacy.get(p.pharmacySlug);
        if (!ex || new Date(p.fetchedAt) > new Date(ex.fetchedAt)) {
          byPharmacy.set(p.pharmacySlug, p);
        }
      }
    }

    const prices = [...byPharmacy.values()].sort(
      (a, b) => a.channels.effective - b.channels.effective
    );
    const bestPharmacy = prices[0];

    return {
      ...canonical,
      prices,
      bestPrice: bestPharmacy?.channels.effective ?? canonical.bestPrice,
      bestPharmacy: bestPharmacy?.pharmacySlug ?? canonical.bestPharmacy,
    };
  });
}

export function toMedicationResult(
  product: ScrapedProduct,
  pharmacySlug: PharmacySlug,
  pharmacyName: string
): MedicationResult {
  const price = toPharmacyPrice(product, pharmacySlug, pharmacyName);
  return {
    matchKey: matchKey(product.name),
    canonicalName: product.name,
    laboratory: product.laboratory,
    isBioequivalent: product.isBioequivalent,
    prices: [price],
    bestPrice: price.channels.effective,
    bestPharmacy: pharmacySlug,
  };
}
