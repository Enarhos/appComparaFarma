const STOP_WORDS = new Set([
  "x", "de", "la", "el", "los", "las", "con", "para", "sin", "por",
  "comp", "comprimido", "comprimidos", "capsula", "capsulas", "tab",
  "tableta", "tabletas", "sol", "solucion", "jarabe", "suspension",
  "crema", "gel", "gotas", "ampolla", "inyectable", "recubierto",
  "liberacion", "prolongada", "inhalador", "aerosol", "polvo",
  "parche", "supositorio", "colirio", "nasal", "ocular", "rectal",
  "mg", "ml", "mcg", "g", "ui", "iu", "infantil", "adulto", "forte",
  "plus", "pediatrico", "nino",
  "dia", "noche", "dn", "yn",
]);

export function matchKey(name: string): string {
  const raw = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const mlHits = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*ml\b/gi)];
  const mgHits = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*mg\b/gi)];
  const mcgHits = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:mcg|µg|ug)\b/gi)];
  const gHits = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*g\b/gi)];
  const lower = raw
    .replace(/(\w)-(\w)/g, "$1$2")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = lower.split(" ");

  const brandWords = words.filter(
    (w) => w.length >= 2 && !STOP_WORDS.has(w) && !/^\d/.test(w) && /^[a-z]+$/.test(w)
  );

  let first = brandWords[0] ?? "";
  if (first.length >= 2 && first.length <= 4 && brandWords[1] && brandWords[1].length <= 4) {
    first = first + brandWords[1];
  }

  if (!first) {
    for (const w of words) {
      if (w.length >= 2 && !STOP_WORDS.has(w) && !/^\d/.test(w)) {
        first = w;
        break;
      }
    }
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

  const qtyM = raw.match(
    /(?:\bx\s*(\d+)|\b(\d+)\s*(?:sobres?|comprimidos?|comp|c[aá]psulas?|cap|tab|tabletas?|amp(?:ollas?)?|parches?|grageas?|sachets?|unidades?)\b)/i
  );
  const qty = qtyM ? (qtyM[1] ?? qtyM[2] ?? "") : "";
  const normalizedQty = qty === "1" ? "" : qty;

  const turn = /\bnoche\b/.test(raw) ? "n" : /\bdia\b/.test(raw) ? "d" : "";

  return first ? [first, dose, turn, normalizedQty].filter(Boolean).join("|") : lower.slice(0, 30);
}
