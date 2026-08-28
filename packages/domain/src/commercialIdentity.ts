/**
 * Identidad comercial (FASE 1 — Product Identity, 2026-08-19; FASE P1 —
 * Hardening, 2026-08-19).
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
 *
 * FASE P1 (hardening, 2026-08-19) — motivación: la auditoría de producción
 * real (5 búsquedas: omeprazol, paracetamol, losartán, ibuprofeno,
 * amoxicilina) encontró `commercialIdentity` claramente inválidos —
 * "detalleproducto", "recubiertos", "chile" (cuando viene de URL), "blandas",
 * "100ml", "x30com", "losartanhidroclorotiazida", el propio principio activo
 * ("omeprazol", "ibuprofeno") como si fuera marca, etc. Esto no rompía la
 * política conservadora (sigue siendo cierto que known != unknown), pero SÍ
 * creaba el riesgo de que dos productos genuinamente distintos terminaran
 * compartiendo una "marca" que en realidad era ruido de URL o de un campo
 * estructurado de mala calidad — ver docs/technology/domain/
 * COMMERCIAL_IDENTITY.md para el detalle completo de la auditoría y las
 * reglas agregadas en esta fase.
 *
 * El flujo ahora tiene 4 pasos explícitos y separables:
 *   A. EXTRACCIÓN   — obtener un candidato crudo (campo estructurado, o URL
 *                      solo para farmacias con patrón verificado).
 *   B. NORMALIZACIÓN — normalizeBrandToken(): minúsculas, sin acentos, sin
 *                      frases de ruido conocidas, alias explícitos.
 *   C. VALIDACIÓN    — isPlausibleCommercialIdentity(): rechaza categorías
 *                      que NUNCA son una marca (principio activo, forma
 *                      farmacéutica, token de cantidad/dosis, texto de
 *                      navegación/URL genérico, "oraciones" completas coladas
 *                      en un campo estructurado). Un candidato implausible
 *                      SIEMPRE se degrada a "unknown", sin importar su fuente.
 *   D. CONFIANZA     — HIGH solo si es estructurado Y plausible; MEDIUM solo
 *                      si viene de una URL con patrón verificado Y plausible;
 *                      UNKNOWN en cualquier otro caso.
 */

export type CommercialIdentitySource = "structured" | "name" | "url" | "unknown";
export type CommercialIdentityConfidence = "high" | "medium" | "unknown";

export interface CommercialIdentityInput {
  /**
   * Campo YA estructurado que entrega la farmacia (`laboratory`/`brand`/
   * `manufacturer` — cada cliente lo mapea a `ScrapedProduct.laboratory`
   * hoy). Es la fuente de mayor confianza porque viene de un campo dedicado
   * del catálogo de la farmacia, no de texto libre — pero FASE P1 ya NO
   * asume que todo valor estructurado es automáticamente válido: se valida
   * igual que cualquier otro candidato (ver `isPlausibleCommercialIdentity`).
   */
  structuredBrand?: string | null;
  /** Nombre crudo del producto, tal como lo entrega la farmacia. */
  name: string;
  /** URL de producto de la farmacia, si existe. */
  onlineUrl?: string | null;
  /**
   * `matchKey` YA calculado para esta misma oferta (packages/domain/src/
   * matching.ts). Se usa ÚNICAMENTE como guardia de "principio activo no es
   * marca" (FASE P1, sección 6): el primer segmento de `matchKey` (antes del
   * primer `|`) es el mismo algoritmo `first` de `matchKey()` — el principio
   * activo o primera palabra-marca del nombre. Si el candidato de identidad
   * comercial coincide con ese segmento (o es un "run-on" que empieza con
   * él), se rechaza como ACTIVE_INGREDIENT_NOT_BRAND. Opcional por
   * compatibilidad hacia atrás; si no se provee, esa guardia específica
   * simplemente no se aplica (las demás reglas de plausibilidad sí).
   */
  matchKey?: string;
}

export interface CommercialIdentityResult {
  /** Token normalizado (ej. "ascend"), o literalmente `"unknown"`. */
  commercialIdentity: string;
  commercialIdentitySource: CommercialIdentitySource;
  commercialIdentityConfidence: CommercialIdentityConfidence;
}

export const UNKNOWN_COMMERCIAL_IDENTITY = "unknown";

// ---------------------------------------------------------------------------
// B. NORMALIZACIÓN — reglas pequeñas, explícitas y testeadas (NO una lista
// gigante arbitraria). Cada entrada existe porque se observó en datos reales
// (ver docs/technology/domain/COMMERCIAL_IDENTITY.md).
// ---------------------------------------------------------------------------

/**
 * Frases de ruido que NO representan marca — programas de descuento/compra
 * pública, calificadores comerciales genéricos o de estado del empaque. Se
 * eliminan como frase completa (con límite de palabra) antes de tokenizar,
 * nunca como substring arbitrario, para no comerse pedazos de una marca real
 * por accidente.
 *
 * FASE P1 agrega "genericos"/"genericas" (ver decisión documentada más abajo,
 * junto a `KNOWN_BRAND_ALIASES`) y los calificadores de estado de empaque
 * ("caja dañada"/"caja manchada", observados en canonicalName real de
 * EcoFarmacias — misma categoría semántica que "descuento": no identifican
 * un producto distinto, describen una condición comercial de la oferta).
 */
const NOISE_PHRASES = [
  "ley cenabast",
  "cenabast",
  "descuento",
  "caja danada",
  "caja manchada",
  "caja golpeada",
  "caja arrugada",
  "laboratorios",
  "laboratorio",
  "genericos",
  "genericas",
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
 *
 * FASE P1 — decisión documentada sobre "genericosascend": se observó en
 * producción como `commercialIdentity` resuelto (auditoría de 5 búsquedas,
 * 2026-08-19), token compuesto de "genericos" + "ascend". No se pudo
 * confirmar contra el `name`/`onlineUrl` exacto de esa oferta específica (sin
 * acceso a `debug=1` en esta sesión), pero "Genéricos Ascend" es una
 * convención de nomenclatura estándar en la industria (línea de genéricos de
 * un laboratorio) y el token mismo contiene literalmente "ascend" como
 * sufijo. Bajo la política conservadora (preferir falso negativo antes que
 * falso positivo) la opción más segura es tratar "genéricos"/"genéricas" como
 * frase de ruido (arriba, en `NOISE_PHRASES`) en vez de crear un alias
 * puntual — así, si de verdad identifica a Ascend, se normaliza
 * correctamente a "ascend"; si no lo fuera, el riesgo de una fusión
 * incorrecta es mínimo porque "genéricos" nunca es en sí mismo una marca.
 */
const KNOWN_BRAND_ALIASES: Record<string, string> = {
  curaspring: "curaespring",
};

/**
 * Normaliza un fragmento de texto de marca a un token comparable:
 * NFD + sin acentos, minúsculas, sin frases de ruido conocidas, sin
 * puntuación/espacios. Retorna "" si no queda nada representativo.
 *
 * Nota: esta función SOLO transforma texto — NO valida plausibilidad. Un
 * candidato puede normalizar a un token no vacío ("chile", "100ml",
 * "detalleproducto") y aun así ser rechazado por
 * `isPlausibleCommercialIdentity` (paso C). Mantener ambos pasos separados es
 * intencional: "chile" es un token normalizado legítimo cuando viene de
 * "Laboratorio Chile" (un laboratorio chileno real), pero es ruido cuando se
 * extrae de un sufijo de URL genérico — la validación de plausibilidad debe
 * poder aplicar ese criterio dependiente de la fuente sin reescribir la
 * normalización misma.
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

// ---------------------------------------------------------------------------
// C. VALIDACIÓN — isPlausibleCommercialIdentity() y categorías de rechazo.
// Reglas POR CATEGORÍA, no una blacklist gigante manual: cada categoría es
// una función/patrón pequeño y justificado, testeado en
// __tests__/commercialIdentity.test.ts.
// ---------------------------------------------------------------------------

/**
 * Vocabulario de formas farmacéuticas — un candidato que es EXACTAMENTE una
 * de estas palabras (tras normalizar) no es una marca, es una forma de
 * administración o presentación. Alineado deliberadamente con el espíritu de
 * `STOP_WORDS` de `matching.ts` (mismo dominio de palabras) pero mantenido
 * como lista propia aquí para no acoplar este módulo a los cambios internos
 * de `matching.ts` (que NO debe tocarse en esta fase). Incluye variantes en
 * plural/femenino observadas en producción ("recubiertos", "blandas",
 * "blanda") que no estaban en la lista original de `URL_TAIL_NOISE_WORDS`.
 */
const DOSAGE_FORM_WORDS = new Set([
  "comprimido", "comprimidos", "capsula", "capsulas", "tableta", "tabletas",
  "gragea", "grageas", "sobre", "sobres", "jarabe", "suspension", "crema",
  "gel", "gota", "gotas", "ampolla", "ampollas", "inyectable",
  "recubierto", "recubiertos", "recubierta", "recubiertas",
  "blando", "blanda", "blandos", "blandas",
  "granulo", "granulos",
  "masticable", "masticables", "dispersable", "dispersables",
  "polvo", "parche", "parches", "supositorio", "supositorios", "colirio",
  "oral", "topico", "nasal", "ocular", "rectal",
  "efervescente", "efervescentes", "liberacion", "prolongada",
  "inhalador", "aerosol", "frasco", "ampolleta",
]);

/**
 * Tokens de navegación/URL genéricos — SOLO se aplican a candidatos
 * extraídos de `onlineUrl` (paso A, extracción), nunca a campos
 * estructurados: "chile" es ruido cuando es un sufijo de URL de otra
 * farmacia (ej. Ahumada añade "-chile" a URLs de productos sin relación con
 * ningún laboratorio), pero es una marca real y válida cuando viene del
 * campo estructurado "Laboratorio Chile" (un laboratorio chileno real,
 * distinto de este sufijo de URL). Mantener esta lista separada de
 * `DOSAGE_FORM_WORDS` es lo que permite ese comportamiento dependiente de la
 * fuente sin ambigüedad.
 */
const URL_GENERIC_TOKENS = new Set([
  "detalleproducto", "detalle", "producto", "productos", "item", "articulo",
  "ficha", "categoria", "categorias", "tienda", "comprar", "buscar",
  "generico", "genericos", "chile", "home", "index", "page", "www",
  "cap", "caps", "comp", "und", "unidades",
]);

/**
 * Token de cantidad/dosis puro — ej. "100ml", "500mg", "x30com", "20mg".
 * Ancla completa (no substring) para no rechazar una marca real que
 * contenga dígitos de forma incidental (ninguna observada en los datos
 * reales auditados, pero se prioriza precisión sobre cobertura).
 */
const QUANTITY_TOKEN_PATTERN = /^x?\d+(ml|mg|mcg|g|com|cap|caps|und|un|mgml)?$/;

/**
 * Un candidato "run-on" excesivamente largo casi siempre es el nombre
 * completo del principio activo/composición colado en el campo de marca
 * (ej. "losartanhidroclorotiazida" = 24 caracteres,
 * "lorsartanpotasicohidroclorotiazida" = 34,
 * "amoxicilinaacidoclavulanico" = 27), no una marca real. El límite se fijó
 * mirando las marcas legítimas más largas observadas en la auditoría de
 * producción (2026-08-19): "chemopharma"/"interpharma" (11),
 * "kitadolinfantil" (15), "panadoladvance" (14) — todas muy por debajo de 20.
 */
const RUNON_LENGTH_THRESHOLD = 20;

/**
 * Principios activos (INN) conocidos, en su forma normalizada, contra los
 * que se compara el candidato para la guardia de "principio activo no es
 * marca" (sección 6). Lista pequeña y explícita, derivada directamente de
 * evidencia real: los 5 términos de la auditoría de producción de FASE P1
 * (omeprazol, paracetamol, losartán, ibuprofeno, amoxicilina) más las
 * moléculas relacionadas observadas en esos mismos resultados
 * (esomeprazol, la variante de escritura "lorsartan"). Deliberadamente NO es
 * un listado exhaustivo de principios activos farmacéuticos — es del mismo
 * espíritu que `NOISE_PHRASES`/`KNOWN_BRAND_ALIASES`: cada entrada existe
 * porque se observó en datos reales, no porque se haya intentado enumerar
 * "todos los principios activos posibles". Extenderla en el futuro debe
 * seguir el mismo criterio (evidencia real, no una lista genérica importada).
 *
 * Por qué esta lista es necesaria además de "el primer segmento de
 * `matchKey`": `matchKey()` (matching.ts) extrae la primera palabra-marca
 * del nombre sin distinguir si es un principio activo genérico (Omeprazol,
 * Ibuprofeno) o el nombre propio de un producto de marca (Tapsin, Actron,
 * Kitadol, Corodin, Cozaar, Hyzaar, Lomex — todos observados en la misma
 * auditoría). Si se rechazara cualquier candidato que coincida con el primer
 * segmento de `matchKey` sin este filtro adicional, se rechazarían también
 * marcas reales y válidas como "Tapsin" o "Actron" cuyo `matchKey` empieza
 * por ellas mismas — exactamente el tipo de pérdida de marca real que la
 * política conservadora prohíbe. Ver
 * docs/technology/domain/COMMERCIAL_IDENTITY.md para el caso documentado.
 */
export const KNOWN_ACTIVE_INGREDIENTS = new Set([
  "omeprazol",
  "esomeprazol",
  "ibuprofeno",
  "paracetamol",
  "losartan",
  "lorsartan",
  "amoxicilina",
]);

/**
 * Un valor `structuredBrand` crudo (ANTES de normalizar) con más de este
 * número de palabras separadas por espacio casi seguro no es un nombre de
 * marca/laboratorio sino una oración completa colada por error en el campo
 * (ej. un descriptor de suscripción: "susc-1 de 6 meses" en un caso real
 * observado). Los nombres de marca/laboratorio reales observados tienen a lo
 * sumo 2 palabras ("Seven Pharma", "Curae Spring", "Laboratorio Chile" antes
 * de stripping de "Laboratorio").
 */
const STRUCTURED_MAX_WORDS = 3;

export interface PlausibilityContext {
  /** Segmento de principio activo de `matchKey` (antes del primer `|`), si se conoce. */
  activeIngredientToken?: string;
  /**
   * `true` si el candidato proviene de extracción de URL (aplica
   * `URL_GENERIC_TOKENS` además de las categorías universales); `false`/
   * `undefined` para candidatos de campo estructurado (aplica en su lugar la
   * guardia de "oración completa", `STRUCTURED_MAX_WORDS`).
   */
  fromUrl?: boolean;
  /**
   * Texto crudo original (antes de `normalizeBrandToken`) — se usa solo para
   * la guardia de conteo de palabras en candidatos estructurados.
   */
  rawText?: string;
}

/**
 * D. VALIDACIÓN DE PLAUSIBILIDAD — rechaza categorías que nunca son una
 * marca comercial, sin importar cuán "limpio" salga el token de la
 * normalización. Devuelve `false` (implausible) si el candidato cae en
 * cualquiera de estas categorías:
 *
 *   - ACTIVE_INGREDIENT_NOT_BRAND — coincide con (o es un run-on que
 *     empieza por) el principio activo de esta misma oferta.
 *   - DOSAGE_FORM_NOT_BRAND — es una forma farmacéutica conocida.
 *   - QUANTITY_TOKEN — es un token de cantidad/dosis puro.
 *   - URL_GENERIC_TOKEN — (solo si `fromUrl`) es un token de
 *     navegación/URL genérico, no específico de ninguna marca.
 *   - RUNON_TOO_LONG — token anormalmente largo, típico de composiciones
 *     completas coladas como marca.
 *   - STRUCTURED_SENTENCE — (solo si NO `fromUrl`) el texto crudo original
 *     tiene más palabras de las que un nombre de marca/laboratorio real
 *     tendría.
 *
 * Política: ante la duda, rechazar (retornar `false`) — preferimos "unknown"
 * antes que una marca inventada o basura.
 */
export function isPlausibleCommercialIdentity(token: string, context: PlausibilityContext = {}): boolean {
  if (!token) return false;

  if (
    context.activeIngredientToken &&
    context.activeIngredientToken.length >= 3 &&
    KNOWN_ACTIVE_INGREDIENTS.has(context.activeIngredientToken)
  ) {
    if (token === context.activeIngredientToken || token.startsWith(context.activeIngredientToken)) {
      return false;
    }
  }

  if (DOSAGE_FORM_WORDS.has(token)) return false;
  if (QUANTITY_TOKEN_PATTERN.test(token)) return false;
  if (token.length > RUNON_LENGTH_THRESHOLD) return false;

  if (context.fromUrl) {
    if (URL_GENERIC_TOKENS.has(token)) return false;
  } else if (context.rawText) {
    const wordCount = context.rawText.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > STRUCTURED_MAX_WORDS) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// A. EXTRACCIÓN — desde URL, restringida a farmacias con patrón verificado.
// ---------------------------------------------------------------------------

/**
 * FASE P1 (sección 5) — la extracción desde URL se restringe a farmacias con
 * un patrón de URL VERIFICADO e inequívoco. Hoy solo EasyFarma cumple esa
 * condición (verificado contra los dos patrones reales observados en la
 * auditoría P0 Omeprazol, 2026-08-19). Para cualquier otra farmacia, aplicar
 * el mismo parser genérico de "último segmento de URL" producía basura
 * (Ahumada: "-chile" como sufijo de país, no de marca; Sermecoop: páginas
 * genéricas "detalle-producto"; EcoFarmacias/Cruz Verde: formas
 * farmacéuticas o cantidades en el último tramo). Preferencia explícita del
 * CTO: si una farmacia no tiene un patrón URL confiable, retornar `UNKNOWN`
 * en vez de inventar una marca por tener una palabra "atractiva" en la URL.
 *
 * Diseño elegido: OPTION_B (whitelist de hosts con patrón conocido) sobre
 * OPTION_A (parser específico por farmacia) u OPTION_C (genérico + validación
 * fuerte) — es el de menor riesgo: no requiere mantener un parser por cada
 * una de las 9 farmacias, y no vuelve a intentar adivinar sobre farmacias sin
 * evidencia de patrón seguro. Si en el futuro se verifica un patrón
 * inequívoco para otra farmacia, se agrega su host aquí con la misma
 * evidencia documentada que EasyFarma.
 */
const RELIABLE_URL_HOSTS = new Set(["nuevo.easyfarma.cl"]);

function isKnownReliableUrlHost(url: string): boolean {
  try {
    return RELIABLE_URL_HOSTS.has(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Palabras que, si son el ÚLTIMO segmento de una URL de producto, casi
 * seguro son forma farmacéutica/cantidad y NO una marca — evita que
 * `extractBrandFromUrl` invente una marca a partir de "...-x-30-capsulas".
 * Deliberadamente pequeña: solo lo que ya vimos en URLs reales de EasyFarma.
 * (Redundante en parte con `DOSAGE_FORM_WORDS`/`QUANTITY_TOKEN_PATTERN` del
 * paso de validación — se mantiene aquí como primer filtro barato antes de
 * normalizar; la validación de plausibilidad es la garantía real.)
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
 * FASE P1: esta función ya NO se llama para hosts fuera de
 * `RELIABLE_URL_HOSTS` — ver `resolveCommercialIdentity`. Se mantiene
 * exportada y funcional (sin restricción de host propia) para no romper su
 * contrato ni sus tests existentes; la restricción de host vive en el
 * llamador, no aquí, para mantener esta función como lo que su nombre dice:
 * un parser de URL, no una política de farmacias confiables.
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
 * Extrae, de `matchKey`, el segmento de principio activo (primer tramo,
 * antes del primer `|`) — el mismo valor que produce el algoritmo `first` de
 * `matching.ts::matchKey()`. Se usa exclusivamente como guardia de
 * plausibilidad (sección 6, "Active Ingredient Guard"); no reinterpreta ni
 * duplica el algoritmo de `matchKey`, solo lee su primer segmento ya
 * calculado.
 */
function activeIngredientFromMatchKey(mk: string | undefined): string | undefined {
  if (!mk) return undefined;
  const first = mk.split("|")[0];
  return first ? first.toLowerCase() : undefined;
}

/**
 * D. Resuelve la identidad comercial de una oferta con evidencia auditable,
 * en orden de prioridad HIGH → MEDIUM → UNKNOWN. Nunca inventa un
 * laboratorio: si no hay evidencia suficiente O el candidato no pasa la
 * validación de plausibilidad (paso C), retorna explícitamente `"unknown"`
 * con confianza `"unknown"` — FASE P1: esto aplica ahora TAMBIÉN a campos
 * estructurados de mala calidad (ver sección 4 del hardening), no solo a
 * candidatos de URL.
 *
 * Nota de alcance (Fase 1, deliberado, sigue vigente): NO se implementa
 * extracción de marca desde texto libre de `name` en esta fase — ninguna de
 * las farmacias auditadas tiene un patrón de nombre confiable para eso sin
 * arriesgar falsos positivos. El tipo `CommercialIdentitySource` ya
 * contempla `"name"` para cuando se identifique un patrón real y seguro en
 * una fase futura — ver FOLLOW_UP en docs/technology/domain/
 * COMMERCIAL_IDENTITY.md.
 */
export function resolveCommercialIdentity(input: CommercialIdentityInput): CommercialIdentityResult {
  const activeIngredientToken = activeIngredientFromMatchKey(input.matchKey);

  if (input.structuredBrand) {
    const token = normalizeBrandToken(input.structuredBrand);
    if (token && isPlausibleCommercialIdentity(token, { activeIngredientToken, rawText: input.structuredBrand })) {
      return {
        commercialIdentity: token,
        commercialIdentitySource: "structured",
        commercialIdentityConfidence: "high",
      };
    }
  }

  if (input.onlineUrl && isKnownReliableUrlHost(input.onlineUrl)) {
    const fromUrl = extractBrandFromUrl(input.onlineUrl);
    if (fromUrl) {
      const token = normalizeBrandToken(fromUrl);
      if (token && isPlausibleCommercialIdentity(token, { activeIngredientToken, fromUrl: true })) {
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
  /**
   * S-1 (SEARCH-MATCHING-QA-01, Gate 2) — token del SEGUNDO principio activo
   * cuando la oferta es una COMBINACIÓN (`combinationKey()` en matching.ts);
   * `null`/ausente para monofármacos, que es el caso mayoritario.
   *
   * Existe porque `matchKey` solo lee el primer principio activo y la primera
   * concentración, así que un monofármaco y su combinación comparten
   * `matchKey` y terminaban FUSIONADOS en una sola tarjeta (riesgo clínico:
   * dos medicamentos distintos con un "ahorro" que no existe). `matchKey` no
   * se puede cambiar — su valor está persistido en historiales y alertas — así
   * que la separación se resuelve en esta capa, que no persiste en ninguna
   * tabla.
   */
  combinationKey?: string | null;
  /**
   * CF-SEARCH-001 (2026-08-27) — calificador comercial dentro de la familia de
   * marca (`commercialVariantKey()` en productIdentity.ts): "rojo", "forte",
   * "instaflu", "periodo", "infantil", "m"... `null` cuando el nombre no
   * declara ninguno.
   *
   * Existe porque `matchKey` conserva UN solo token de nombre (la cabecera de
   * marca) y `brand:` no discrimina dentro de un mismo laboratorio: todas las
   * variantes de Tapsin de Maver con la misma cantidad colapsaban en una sola
   * tarjeta con precios de medicamentos distintos.
   */
  commercialVariant?: string | null;
  /**
   * CF-SEARCH-001 (2026-08-27) — clase gruesa de forma farmacéutica
   * (`dosageFormClass()` en productIdentity.ts). `null`/ausente cuando el
   * nombre no la declara, que es un caso frecuente y legítimo.
   *
   * Separa presentaciones que no pueden ser el mismo artículo: producción
   * 2026-08-27 fusionaba en una tarjeta `tapsin|1000mg|20|bio:false|brand:maver`
   * los comprimidos de Farmex con los sobres de polvo efervescente de
   * AraucoMed y Dr. Simi.
   */
  dosageForm?: string | null;
}

/**
 * Identidad comercial completa para decidir SAME_PRODUCT:
 * `matchKey` (farmacológico) + bioequivalencia + identidad comercial
 * (+ combinación, si corresponde).
 * Ejemplo: "omeprazol|20mg|30|bio:false|brand:ascend".
 * Ejemplo combinación: "losartan|50mg|30|bio:false|brand:ascend|combo:hidroclorotiazida".
 *
 * El segmento `|combo:` se AGREGA AL FINAL y solo cuando la oferta es una
 * combinación. Es deliberado: la clave de un monofármaco queda byte a byte
 * igual que antes de S-1, así que el fix no rota la identidad (ni, en Web, el
 * hash del slug) del ~99% del catálogo que no es combinación — ver la cadena
 * de generaciones en web/src/lib/resolveMedication.ts.
 *
 * CF-SEARCH-001 (2026-08-27) agrega `|var:` y `|form:` con la misma mecánica
 * aditiva y en ese orden fijo, siempre después de `|combo:`. A diferencia de
 * `|combo:`, `|form:` está presente en la mayoría del catálogo, así que esta
 * versión SÍ rota el hash de slug de la mayoría de las fichas Web — la cadena
 * de generaciones de `web/src/lib/resolveMedication.ts` incorpora Gen 5 para
 * que los links ya emitidos sigan resolviendo (y redirijan) en vez de romperse.
 */
export function presentationKey(input: PresentationKeyInput): string {
  let key = `${input.matchKey}|bio:${bioequivalenceKey(input.isBioequivalent)}|brand:${input.commercialIdentity}`;
  if (input.combinationKey) key += `|combo:${input.combinationKey}`;
  if (input.commercialVariant) key += `|var:${input.commercialVariant}`;
  if (input.dosageForm) key += `|form:${input.dosageForm}`;
  return key;
}
