/**
 * Magnitudes y concentración farmacológica — primitivas compartidas.
 *
 * POR QUÉ ESTE MÓDULO EXISTE
 * --------------------------
 * Todo lo que hay acá se escribió en CF-SEARCH-002 dentro de `queryIntent.ts`,
 * para leer la CONSULTA del usuario. CF-SEARCH-003 necesita exactamente las
 * mismas primitivas para leer el NOMBRE DEL PRODUCTO desde la capa de identidad
 * (`productIdentity.ts`), y esa capa no puede importar `queryIntent.ts`:
 * `queryIntent.ts` ya importa `dosageFormClass` de `productIdentity.ts`, así que
 * la dependencia sería circular.
 *
 * Las dos alternativas —duplicar el parser en la capa de identidad, o invertir
 * la dependencia— están descartadas: la primera viola la regla de no duplicar
 * reglas de negocio (§7 del acuerdo operativo) y garantiza que las dos copias
 * diverjan; la segunda rompería `queryIntent.ts`, que necesita clasificar la
 * forma farmacéutica de la consulta.
 *
 * Este archivo es, salvo por dos agregados documentados abajo, un MOVIMIENTO
 * literal de código: `Measurement`, `Concentration`, las tablas de unidades,
 * `isSameMeasurement`, `isSameConcentration`, `parseConcentration` y
 * `concentrationKey` conservan su semántica exacta, y `queryIntent.ts` /
 * `relevance.ts` / `index.ts` los siguen exponiendo con la misma firma. Los dos
 * agregados son:
 *
 *   1. `parseMeasurements()` — devuelve TODAS las magnitudes del texto en orden,
 *      no solo la primera. `parseConcentration()` pasa a construirse sobre ella
 *      sin cambiar de comportamiento, y la capa de identidad la usa para
 *      encontrar la razón masa/volumen aunque no sea la primera magnitud del
 *      nombre ("Ambroxol **100 ml** 30 mg/5 ml").
 *   2. Tolerancia a la abreviatura con punto (`30mg./5ml.`) y al separador
 *      `cada` — ver `MEASUREMENT_RE`.
 *
 * Este módulo no importa nada del dominio: es la hoja del grafo de dependencias.
 */

/**
 * Una magnitud escrita en el nombre o en la consulta: valor + unidad ya
 * normalizada (minúscula, sin variantes tipográficas).
 *
 * `unit` es un `string` y no una unión cerrada a propósito: el modelo debe
 * poder representar unidades que hoy no se comparan (`%`, `ui`, dosis por
 * inhalación) sin cambiar el tipo ni las firmas públicas. Lo que está acotado
 * —y es lo único que hay que ampliar para soportar una unidad nueva— es la
 * tabla de conversión `UNIT_DIMENSIONS`.
 */
export interface Measurement {
  value: number;
  unit: string;
}

/**
 * Concentración como RAZÓN estructurada, nunca como cadena compuesta.
 *
 * Decisión explícita del ticket: "250 mg / 5 ml" se representa con
 * `numerator = {250, "mg"}` y `denominator = {5, "ml"}` — NO se colapsa a una
 * unidad inventada tipo `"mg/5ml"`, que sería imposible de comparar contra
 * "50 mg/ml" (la misma concentración escrita de otra forma) y bloquearía
 * cualquier extensión futura.
 *
 * `denominator === null` significa "dosis absoluta por unidad de
 * presentación" ("600 mg" en un comprimido), que es un concepto DISTINTO de
 * una razón: una dosis absoluta nunca se considera igual a una concentración
 * por volumen, por más que los números coincidan.
 *
 * NORMALIZACIÓN DOCUMENTADA — denominador implícito: "20 mg/ml" se normaliza a
 * `denominator = {value: 1, unit: "ml"}`. Escribir la unidad sin cantidad
 * significa "por UNA unidad" en todos los catálogos observados, y normalizarlo
 * a 1 permite compararlo con "100 mg/5 ml" por razón (20 mg/ml en ambos casos)
 * en vez de tratarlos como incomparables.
 */
export interface Concentration {
  numerator: Measurement;
  denominator: Measurement | null;
}

/**
 * Familias de unidades convertibles entre sí, con su factor a la unidad base
 * de la familia. Dos magnitudes solo se comparan numéricamente si pertenecen a
 * la MISMA familia; si una unidad no está acá (`"ui"`, `"%"`, o cualquiera que
 * se agregue mañana), la comparación exige igualdad literal de unidad — nunca
 * se inventa una conversión.
 *
 * Ampliar el soporte a una unidad nueva es agregar una entrada acá; el tipo
 * `Measurement` y la firma de `parseConcentration` no cambian.
 */
const UNIT_DIMENSIONS: Record<string, { dimension: string; factor: number }> = {
  mcg: { dimension: "mass", factor: 0.001 },
  mg: { dimension: "mass", factor: 1 },
  g: { dimension: "mass", factor: 1000 },
  ml: { dimension: "volume", factor: 1 },
  l: { dimension: "volume", factor: 1000 },
};

/**
 * Grafías reales de cada unidad en los catálogos de las 9 farmacias, mapeadas
 * a su forma canónica. `cc` es la grafía de mililitro que usan las fichas de
 * inyectables; `gr` la de gramo que usan AraucoMed y EasyFarma.
 */
const UNIT_ALIASES: Record<string, string> = {
  mg: "mg",
  mgs: "mg",
  mcg: "mcg",
  ug: "mcg",
  "µg": "mcg",
  g: "g",
  gr: "g",
  grs: "g",
  ml: "ml",
  mls: "ml",
  cc: "ml",
  l: "l",
  lt: "l",
  ui: "ui",
  iu: "ui",
  "%": "%",
};

/** Grafías aceptadas, ordenadas por longitud descendente para que la alternancia del regex no corte "mcg" en "mg". */
const UNIT_ALTERNATION = Object.keys(UNIT_ALIASES)
  .filter((u) => u !== "%")
  .sort((a, b) => b.length - a.length)
  .join("|");

/**
 * Una magnitud, opcionalmente seguida de su denominador.
 *
 * `(?![a-zà-ü])` en vez de `\b` para que "500 gramos" o "20 mgs" no
 * se lean como "500 g" / "20 mg" truncados: la unidad tiene que terminar ahí,
 * no ser el prefijo de otra palabra. (`mgs` y `grs` sí están en `UNIT_ALIASES`
 * como grafías completas.)
 *
 * El denominador acepta la cantidad ausente ("20 mg/ml"), que se normaliza a 1
 * — ver `Concentration`.
 *
 * DOS TOLERANCIAS TIPOGRÁFICAS agregadas por CF-SEARCH-003, ambas necesarias
 * para que dos escrituras de la MISMA concentración deriven el mismo valor:
 *
 *   - `\.?` después de la unidad del numerador: Ahumada abrevia con punto
 *     ("Ambroxol **30mg./5ml.** Jarabe Fco. 100ml"). Sin esta tolerancia el
 *     punto cortaba la razón y el nombre se leía como una masa absoluta de
 *     30 mg, indistinguible de un producto realmente distinto. Es la única
 *     grafía del catálogo (1 de 2.255 nombres únicos) que lo necesita, pero es
 *     una de las cuatro ofertas del falso merge de Ambroxol.
 *   - Separador `cada` ("30 mg cada 5 ml"), además de `/`. **`por` NO se acepta
 *     como separador**: en estos catálogos es un multiplicador de CANTIDAD
 *     ("Diclofenaco 75 mg/3 ml **por 5 Ampollas**", "**por 10** caps."), y de
 *     hecho `unitCountKey()` ya lo lee así. Aceptarlo acá haría que la misma
 *     palabra significara dos cosas incompatibles en dos ejes distintos.
 */
const MEASUREMENT_RE = new RegExp(
  `(\\d+(?:[.,]\\d+)?)\\s*(?:(${UNIT_ALTERNATION})(?![a-z\\u00e0-\\u00fc])|(%))\\.?` +
    `(?:(?:\\s*\\/\\s*|\\s+cada\\s+)(\\d+(?:[.,]\\d+)?)?\\s*(?:(${UNIT_ALTERNATION})(?![a-z\\u00e0-\\u00fc])|(%)))?`,
  "gi"
);

function stripAccentsLower(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function toNumber(raw: string): number {
  return parseFloat(raw.replace(",", "."));
}

function canonicalUnit(raw: string | undefined): string | null {
  if (!raw) return null;
  return UNIT_ALIASES[raw.toLowerCase()] ?? null;
}

function dimensionOf(unit: string): string {
  return UNIT_DIMENSIONS[unit]?.dimension ?? `literal:${unit}`;
}

/** `true` si la unidad pertenece a la familia de masa (`mcg`/`mg`/`g`). */
export function isMassUnit(unit: string): boolean {
  return dimensionOf(unit) === "mass";
}

/** `true` si la unidad pertenece a la familia de volumen (`ml`/`cc`/`l`). */
export function isVolumeUnit(unit: string): boolean {
  return dimensionOf(unit) === "volume";
}

function baseValue(m: Measurement): number {
  const spec = UNIT_DIMENSIONS[m.unit];
  return spec ? m.value * spec.factor : m.value;
}

/**
 * Dos magnitudes describen la misma cantidad física. Dentro de una familia
 * conocida se convierte a la unidad base ("0,5 g" === "500 mg"); fuera de
 * ella, se exige la misma unidad literal.
 */
export function isSameMeasurement(a: Measurement, b: Measurement): boolean {
  if (dimensionOf(a.unit) !== dimensionOf(b.unit)) return false;
  return closeEnough(baseValue(a), baseValue(b));
}

/**
 * Comparación con tolerancia relativa. Los catálogos escriben la misma dosis
 * con distinta precisión decimal ("12.5" vs "12,50"), y la conversión de
 * gramos a miligramos introduce error de punto flotante.
 */
function closeEnough(a: number, b: number): boolean {
  if (a === b) return true;
  const scale = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) / scale < 1e-9;
}

/**
 * Dos concentraciones son la misma.
 *
 *   - Dosis absoluta vs dosis absoluta ("600 mg" / "0,6 g"): se comparan las
 *     magnitudes.
 *   - Razón vs razón ("250 mg/5 ml" / "50 mg/ml"): se comparan las RAZONES,
 *     no los literales — es la misma concentración envasada distinto, y el
 *     tamaño del envase es una señal de cantidad, no de concentración. Exige
 *     que numerador y denominador pertenezcan a la misma familia de unidades
 *     en ambas.
 *   - Dosis absoluta vs razón: nunca son iguales, aunque los números
 *     coincidan. "600 mg" (comprimido) y "600 mg/ml" (jarabe) son productos
 *     distintos.
 */
export function isSameConcentration(a: Concentration, b: Concentration): boolean {
  if ((a.denominator === null) !== (b.denominator === null)) return false;
  if (a.denominator === null || b.denominator === null) {
    return isSameMeasurement(a.numerator, b.numerator);
  }
  if (dimensionOf(a.numerator.unit) !== dimensionOf(b.numerator.unit)) return false;
  if (dimensionOf(a.denominator.unit) !== dimensionOf(b.denominator.unit)) return false;
  const ratioA = baseValue(a.numerator) / baseValue(a.denominator);
  const ratioB = baseValue(b.numerator) / baseValue(b.denominator);
  return Number.isFinite(ratioA) && Number.isFinite(ratioB) && closeEnough(ratioA, ratioB);
}

/**
 * `true` si la razón es masa/masa entre dos unidades de dosis — la firma
 * tipográfica de una COMBINACIÓN de principios activos ("50 mg / 12,5 mg",
 * "800/160 mg"), no de una concentración.
 *
 * Es deliberadamente la MISMA regla que `DOSE_RATIO_RE` en matching.ts, que
 * S-1 (SEARCH-MATCHING-QA-01) usa para detectar combinaciones: si acá se
 * leyera "Losartán + Hidroclorotiazida 50 mg / 12,5 mg" como "una
 * concentración de 4 mg/mg", la consulta "losartán 50 mg" dejaría de
 * reconocer su propia dosis y la protección `combo:` quedaría contradicha por
 * una segunda lectura del mismo texto.
 *
 * Consecuencia aceptada y acotada: una concentración masa/masa legítima
 * ("0,05 g/100 g" en cremas) se lee hoy como dosis absoluta del numerador. El
 * MODELO no lo impide —`Concentration` admite cualquier par de unidades—; es
 * este heurístico de parsing el que prefiere la lectura de combinación, y
 * cambiarlo es cambiar esta única función.
 */
function looksLikeCombinationRatio(numerator: Measurement, denominator: Measurement): boolean {
  return dimensionOf(numerator.unit) === "mass" && dimensionOf(denominator.unit) === "mass";
}

/**
 * TODAS las magnitudes declaradas en un texto, en orden de aparición.
 *
 * Es el escáner de bajo nivel sobre el que se construyen tanto
 * `parseConcentration()` (que se queda con la primera) como el eje de
 * concentración de la capa de identidad (`liquidConcentration()`, que busca la
 * primera RAZÓN masa/volumen aunque no sea la primera magnitud del nombre).
 *
 * Aplica la misma colapso de combinación que `parseConcentration`: una razón
 * masa/masa se devuelve como dosis absoluta del numerador — ver
 * `looksLikeCombinationRatio`.
 */
export function parseMeasurements(text: string): Concentration[] {
  const haystack = stripAccentsLower(text);
  const out: Concentration[] = [];

  for (const match of haystack.matchAll(MEASUREMENT_RE)) {
    const unit = canonicalUnit(match[2] ?? match[3]);
    if (!unit) continue;

    const numerator: Measurement = { value: toNumber(match[1]), unit };
    const denomUnit = canonicalUnit(match[5] ?? match[6]);
    if (!denomUnit) {
      out.push({ numerator, denominator: null });
      continue;
    }

    // "20 mg/ml" — cantidad implícita de 1 (ver `Concentration`).
    const denominator: Measurement = {
      value: match[4] !== undefined ? toNumber(match[4]) : 1,
      unit: denomUnit,
    };

    out.push(
      looksLikeCombinationRatio(numerator, denominator)
        ? { numerator, denominator: null }
        : { numerator, denominator }
    );
  }

  return out;
}

/**
 * Primera concentración declarada en un texto libre (consulta o nombre de
 * producto), o `null` si no declara ninguna.
 *
 * Se toma la PRIMERA, misma convención que `matchKey()` con `mgHits[0]`: en
 * los nombres reales la concentración va delante y lo que sigue es cantidad,
 * envase, forma farmacéutica o laboratorio.
 */
export function parseConcentration(text: string): Concentration | null {
  return parseMeasurements(text)[0] ?? null;
}

/**
 * Representación canónica y estable de una concentración, para claves de
 * caché y para diagnóstico legible. No es un formato de presentación: la UI
 * nunca lo muestra.
 */
export function concentrationKey(concentration: Concentration): string {
  const { numerator, denominator } = concentration;
  const head = `${numerator.value}${numerator.unit}`;
  return denominator ? `${head}/${denominator.value}${denominator.unit}` : head;
}
