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
  "ung", "oft", "otic", "cps", "facidose",
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
    .replace(/\[.*?\]/g, " ").replace(/\(.*?\)/g, " ").replace(/[.,:/]/g, " ")
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
  "dia", "noche", "dn", "yn",  // descriptores de turno — se capturan como campo separado
]);

export function matchKey(name: string): string {
  // Normalizar acentos primero: "Día"→"Dia"→"dia", "Noche" queda igual
  const raw = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const mlHits  = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*ml\b/gi)];
  const mgHits  = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*mg\b/gi)];
  const mcgHits = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:mcg|µg|ug)\b/gi)];
  // gramos → convertir a mg para normalizar con "1000mg", "500mg"
  const gHits   = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*g\b/gi)];
  const lower = raw.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const words = lower.split(" ");
  let first = "";
  for (const w of words) {
    if (w.length >= 2 && !STOP_WORDS.has(w) && !/^\d/.test(w)) { first = w; break; }
  }
  let dose = "";
  if (mlHits.length) {
    dose = `${Math.max(...mlHits.map((m) => parseFloat(m[1].replace(",", "."))))}ml`;
  } else if (mcgHits.length) {
    dose = `${parseFloat(mcgHits[0][1].replace(",", "."))}mcg`;
  } else if (mgHits.length) {
    dose = `${parseFloat(mgHits[0][1].replace(",", "."))}mg`;
  } else if (gHits.length) {
    const mg = Math.max(...gHits.map((m) => parseFloat(m[1].replace(",", ".")) * 1000));
    dose = `${mg}mg`;
  }
  // cantidad de unidades: "30 sobres", "x20", "10 comprimidos", etc.
  const qtyM = raw.match(
    /(?:\bx\s*(\d+)|\b(\d+)\s*(?:sobres?|comprimidos?|comp|c[aá]psulas?|cap|tab|tabletas?|amp(?:ollas?)?|parches?|grageas?|sachets?|unidades?)\b)/i
  );
  const qty = qtyM ? (qtyM[1] ?? qtyM[2] ?? "") : "";
  // qty=1 es la unidad singular implícita — no añade información discriminatoria.
  const normalizedQty = qty === "1" ? "" : qty;
  // Indicador día/noche: diferenciador clave para multicomponentes antigripales.
  const turn = /\bnoche\b/.test(raw) ? "n" : /\bdia\b/.test(raw) ? "d" : "";
  return first
    ? [first, dose, turn, normalizedQty].filter(Boolean).join("|")
    : lower.slice(0, 30);
}

export function effectivePrice(channels: { store: number; online: number | null; cmr: number | null; sbpay: number | null }): number {
  return Math.min(
    channels.store,
    channels.online ?? channels.store,
    channels.cmr   ?? channels.store,
    channels.sbpay ?? channels.store,
  );
}

export function toPharmacyPrice(product: ScrapedProduct, pharmacySlug: PharmacySlug, pharmacyName: string): PharmacyPrice {
  const channels = {
    store: product.price,
    online: product.onlinePrice,
    cmr: product.cmrPrice,
    sbpay: product.sbpayPrice,
    effective: effectivePrice({ store: product.price, online: product.onlinePrice, cmr: product.cmrPrice, sbpay: product.sbpayPrice }),
  };
  return { pharmacySlug, pharmacyName, productName: product.name, channels, hasStock: product.hasStock, hasOnlineDelivery: product.hasOnlineDelivery, onlineUrl: product.onlineUrl, imageUrl: product.imageUrl, fetchedAt: new Date().toISOString() };
}

export function toMedicationResult(product: ScrapedProduct, pharmacySlug: PharmacySlug, pharmacyName: string): MedicationResult {
  const price = toPharmacyPrice(product, pharmacySlug, pharmacyName);
  return { matchKey: matchKey(product.name), canonicalName: product.name, laboratory: product.laboratory, isBioequivalent: product.isBioequivalent, prices: [price], bestPrice: price.channels.effective, bestPharmacy: pharmacySlug, imageUrl: product.imageUrl };
}

export function mergeDuplicates(results: MedicationResult[]): MedicationResult[] {
  const groups = new Map<string, MedicationResult[]>();
  for (const r of results) {
    const key = r.matchKey;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
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
      for (const p of med.prices) {
        const ex = byPharmacy.get(p.pharmacySlug);
        if (!ex || p.channels.effective < ex.channels.effective) byPharmacy.set(p.pharmacySlug, p);
      }
    }
    const prices = [...byPharmacy.values()].sort((a, b) => a.channels.effective - b.channels.effective);
    const best = prices[0];
    const imageUrl = group.map((m) => m.imageUrl).find((u) => u != null) ?? null;
    return { ...canonical, prices, bestPrice: best?.channels.effective ?? canonical.bestPrice, bestPharmacy: best?.pharmacySlug ?? canonical.bestPharmacy, imageUrl };
  });
}
