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
