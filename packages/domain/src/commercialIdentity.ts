/**
 * Identidad comercial (FASE 1 — Product Identity, 2026-08-19).
 *
 * `matchKey` (matching.ts) es la identidad FARMACOLÓGICA amplia: principio
 * activo + dosis + cantidad (+ turno día/noche). Nunca distinguió marca ni
 * laboratorio — eso es correcto para su rol original (maximizar fusión entre
 * farmacias) pero insuficiente para decidir si dos ofertas son el MISMO
 * producto comercial (ver auditoría P0 Omeprazol, 2026-08-19: Ascend, OPKO/Ley
 * Cenabast y CuraeSpring comparten `matchKey` y terminaban fusionados como si
 * fueran el mismo artículo).
 *
 * Este módulo agrega una capa aditiva de identidad COMERCIAL:
 * `resolveCommercialIdentity()` decide, con evidencia auditable y en un orden
 * de prioridad explícito, qué marca/laboratorio representa una oferta —o
 * `"unknown"` si no hay evidencia suficiente. `presentationKey()` combina
 * `matchKey` + bioequivalencia + identidad comercial en la clave que
 * `mergeDuplicates` usa para decidir SAME_PRODUCT (ver deduplication.ts).
 *
 * Política explícita y deliberada: una oferta con identidad comercial
 * conocida NUNCA se fusiona con una de identidad `"unknown"`. Preferimos un
 * falso negativo temporal (mismo producto mostrado en dos tarjetas) antes que
 * un falso positivo de precio (dos productos distintos mostrados como uno).
 * Dos ofertas `"unknown"` sí pueden agruparse entre sí bajo
 * `brand:unknown` — es una limitación conocida y aceptada, no un bug: sin
 * ningún dato de marca en ninguna de las dos, no hay evidencia para
 * separarlas ni para fusionarlas con seguridad; se mantiene el comportamiento
 * histórico (agrupar por `matchKey`+bio) para ese caso específico.
 */

export type CommercialIdentitySource = "structured" | "name" | "url" | "unknown";
export type CommercialIdentityConfidence = "high" | "medium" | "unknown";

export interface CommercialIdentityInput {
  /**
   * Campo YA estructurado que entrega la farmacia (`laboratory`/`brand`/
   * `manufacturer` — cada cliente lo mapea a `ScrapedProduct.laboratory`
   * hoy). Es la fuente de mayor confianza porque viene de un campo dedicado
   * del catálogo de la farmacia, no de texto libre.
   */
  structuredBrand?: string | null;
  /** Nombre crudo del producto, tal como lo entrega la farmacia. */
  name: string;
  /** URL de producto de la farmacia, si existe. */
  onlineUrl?: string | null;
}

export interface CommercialIdentityResult {
  /** Token normalizado (ej. "ascend"), o literalmente `"unknown"`. */
  commercialIdentity: string;
  commercialIdentitySource: CommercialIdentitySource;
  commercialIdentityConfidence: CommercialIdentityConfidence;
}

export const UNKNOWN_COMMERCIAL_IDENTITY = "unknown";

// ---------------------------------------------------------------------------
// Normalización — reglas pequeñas, explícitas y testeadas (NO una lista
// gigante arbitraria). Cada entrada existe porque se observó en datos reales
// (ver docs/technology/domain/COMMERCIAL_IDENTITY.md).
// ---------------------------------------------------------------------------

/**
 * Frases de ruido que NO representan marca — programas de descuento/compra
 * pública o calificadores comerciales genéricos. Se eliminan como frase
 * completa (con límite de palabra) antes de tokenizar, nunca como substring
 * arbitrario, para no comerse pedazos de una marca real por accidente.
 */
const NOISE_PHRASES = [
  "ley cenabast",
  "cenabast",
  "descuento",
  "laboratorios",
  "laboratorio",
  "labs",
  "lab",
];

/**
 * Alias explícitos de variantes de escritura REALES observadas en producción
 * para el mismo laboratorio (no una heurística fonética/fuzzy genérica — cada
 * entrada es una corrección puntual y documentada). "Curaspring" y
 * "CuraeSpring"/"Curae Spring" (normalizado a "curaespring") se observaron
 * como el mismo laboratorio en la auditoría P0 Omeprazol 20mg (Farmex vs
 * EasyFarma, 2026-08-19) — ver docs/technology/domain/COMMERCIAL_IDENTITY.md.
 * Deliberadamente NO se usa distancia de edición (Levenshtein) genérica: la
 * política conservadora de esta fase prefiere alias explícitos y auditables
 * sobre una heurística que podría fusionar marcas distintas por accidente.
 */
const KNOWN_BRAND_ALIASES: Record<string, string> = {
  curaspring: "curaespring",
};

/**
 * Normaliza un fragmento de texto de marca a un token comparable:
 * NFD + sin acentos, minúsculas, sin frases de ruido conocidas, sin
 * puntuación/espacios. Retorna "" si no queda nada representativo.
 */
export function normalizeBrandToken(raw: string): string {
  let s = raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

  for (const phrase of NOISE_PHRASES) {
    s = s.replace(new RegExp(`\\b${phrase.replace(/ /g, "\\s+")}\\b`, "g"), " ");
  }

  s = s.replace(/[^a-z0-9]+/g, "").trim();
  if (!s) return "";

  return KNOWN_BRAND_ALIASES[s] ?? s;
}

/**
 * Palabras que, si son el ÚLTIMO segmento de una URL de producto, casi
 * seguro son forma farmacéutica/cantidad y NO una marca — evita que
 * `extractBrandFromUrl` invente una marca a partir de "...-x-30-capsulas".
 * Deliberadamente pequeña: solo lo que ya vimos en URLs reales de EasyFarma.
 */
const URL_TAIL_NOISE_WORDS = new Set([
  "capsulas",
  "comprimidos",
  "tabletas",
  "comp",
  "cap",
  "caps",
  "ml",
  "mg",
  "und",
  "unidades",
  "sobres",
  "lab",
]);

/**
 * Extracción de marca desde `onlineUrl` — regla pequeña y explícita, NO un
 * parser genérico cross-farmacia (fuera de alcance de esta fase: "no
 * realizar un gran refactor de scrapers"). Toma el ÚLTIMO segmento
 * alfabético del último tramo de la URL (antes de la extensión), y lo
 * descarta si es puramente numérico, si es una palabra de forma/cantidad
 * conocida (`URL_TAIL_NOISE_WORDS`), o si es demasiado corto para ser
 * confiable.
 *
 * Verificado contra los dos patrones reales observados en EasyFarma
 * (auditoría P0 Omeprazol, 2026-08-19):
 *   ".../104320-omeprazol-20-mg-x-30-cap-lab-ascend.html"   → "ascend"
 *   ".../104458-omeprazol-20-mg-x-60-capsulas-curaspring.html" → "curaspring"
 *
 * Para farmacias cuya URL NO tiene el candidato de marca como último tramo
 * (ej. Cruz Verde: `/slug/12345.html`, donde el último tramo es solo el ID
 * numérico), esta función simplemente no encuentra nada útil y retorna
 * `null` — nunca inventa ni fuerza una marca incorrecta; es un fallback
 * seguro por diseño, no uno universal.
 */
export function extractBrandFromUrl(url: string): string | null {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    // URL relativa o malformada — se usa el string tal cual, sin host que aislar.
    pathname = url.split(/[?#]/)[0] ?? "";
  }
  const lastPathSegment = pathname.split("/").filter(Boolean).pop();
  if (!lastPathSegment) return null;

  const withoutExtension = lastPathSegment.replace(/\.[a-z0-9]+$/i, "");
  const segments = withoutExtension.split("-").filter(Boolean);
  if (segments.length === 0) return null;

  const candidate = segments[segments.length - 1];
  if (!candidate) return null;
  if (/^\d+$/.test(candidate)) return null;
  if (candidate.length < 3) return null;
  if (URL_TAIL_NOISE_WORDS.has(candidate.toLowerCase())) return null;

  return candidate;
}

/**
 * Resuelve la identidad comercial de una oferta con evidencia auditable, en
 * orden de prioridad HIGH → MEDIUM → UNKNOWN. Nunca inventa un laboratorio:
 * si no hay evidencia suficiente, retorna explícitamente `"unknown"` con
 * confianza `"unknown"`.
 *
 * Nota de alcance (Fase 1, deliberado): NO se implementa extracción de marca
 * desde texto libre de `name` en esta fase — ninguna de las farmacias
 * auditadas (Cruz Verde, AraucoMed, Farmex, EasyFarma) tiene un patrón de
 * nombre confiable para eso sin arriesgar falsos positivos (ej. "Cápsulas
 * con Gránulos" de Cruz Verde es forma farmacéutica, no marca). El tipo
 * `CommercialIdentitySource` ya contempla `"name"` para cuando se identifique
 * un patrón real y seguro en una fase futura — ver FOLLOW_UP en
 * docs/technology/domain/COMMERCIAL_IDENTITY.md.
 */
export function resolveCommercialIdentity(input: CommercialIdentityInput): CommercialIdentityResult {
  if (input.structuredBrand) {
    const token = normalizeBrandToken(input.structuredBrand);
    if (token) {
      return {
        commercialIdentity: token,
        commercialIdentitySource: "structured",
        commercialIdentityConfidence: "high",
      };
    }
  }

  if (input.onlineUrl) {
    const fromUrl = extractBrandFromUrl(input.onlineUrl);
    if (fromUrl) {
      const token = normalizeBrandToken(fromUrl);
      if (token) {
        return {
          commercialIdentity: token,
          commercialIdentitySource: "url",
          commercialIdentityConfidence: "medium",
        };
      }
    }
  }

  return {
    commercialIdentity: UNKNOWN_COMMERCIAL_IDENTITY,
    commercialIdentitySource: "unknown",
    commercialIdentityConfidence: "unknown",
  };
}

/** Clasificación de bioequivalencia como componente de clave — true/false/unknown, nunca se fusionan entre sí. */
export function bioequivalenceKey(value: boolean | null | undefined): "true" | "false" | "unknown" {
  if (value === true) return "true";
  if (value === false) return "false";
  return "unknown";
}

export interface PresentationKeyInput {
  matchKey: string;
  isBioequivalent: boolean | null | undefined;
  commercialIdentity: string;
}

/**
 * Identidad comercial completa para decidir SAME_PRODUCT:
 * `matchKey` (farmacológico) + bioequivalencia + identidad comercial.
 * Ejemplo: "omeprazol|20mg|30|bio:false|brand:ascend".
 */
export function presentationKey(input: PresentationKeyInput): string {
  return `${input.matchKey}|bio:${bioequivalenceKey(input.isBioequivalent)}|brand:${input.commercialIdentity}`;
}
