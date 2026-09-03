/**
 * Search Engine v2 — concentración como EVIDENCIA (CF-SEARCH-011, S0).
 *
 * QUÉ CAMBIA RESPECTO DE v1 Y POR QUÉ NO SE TOCA v1
 * -------------------------------------------------
 * El modelo estructurado de `concentration.ts` (CF-SEARCH-003) es correcto y se
 * reutiliza entero: `parseMeasurements`, `isSameMeasurement`,
 * `isSameConcentration` y `concentrationRatio` se llaman desde acá sin
 * modificarlos.
 *
 * Lo que cambia es QUÉ SE LEE y CÓMO SE COMPARA:
 *
 *   1. `liquidConcentration()` (v1) devuelve una masa absoluta SOLO cuando el
 *      nombre también declara un volumen — condición correcta para su propósito
 *      (aportar información que `matchKey` descartó al preferir el `ml`), pero
 *      que deja sin concentración a TODOS los sólidos: "Paracetamol 500 mg x 16"
 *      devuelve `null`. En el EDM, `500 mg` ES la concentración de ese concepto.
 *      v2 la lee; v1 sigue exactamente igual.
 *
 *   2. `isCompatibleConcentration()` (v1) devuelve `true` para razón-vs-masa,
 *      lo cual es correcto para NO PROHIBIR una fusión, pero colapsa dos hechos
 *      distintos: "son equivalentes" y "una es más débil que la otra". v2 los
 *      separa con un tercer estado (`subsumable`), que es lo que permite que
 *      "Ambroxol 30 mg 100 ml" se resuelva al MISMO concepto que "Ambroxol
 *      30 mg/5 mL Jarabe 100 ml" en vez de quedar en un concepto propio.
 *
 * LAS TRES DIMENSIONES QUE NUNCA SE CONFUNDEN (CANONICAL_IDENTITY_MODEL §3.1):
 *   concentración   `30 mg/5 mL`  → acá
 *   volumen envase  `100 mL`      → `CanonicalPresentation.packageVolume`
 *   contenido total `600 mg`      → derivado, nunca almacenado
 */

import {
  concentrationRatio,
  isSameConcentration,
  isSameMeasurement,
  isMassUnit,
  isVolumeUnit,
  parseMeasurements,
  type Concentration,
  type Measurement,
} from "../concentration.js";
import type { AxisComparison, ConcentrationEvidence } from "./canonicalTypes.js";

type MassOnly = Extract<ConcentrationEvidence, { kind: "mass-only" }>;
type RatioEvidence = Extract<ConcentrationEvidence, { kind: "ratio" }>;

/**
 * Concentración declarada por el nombre de un producto, con su nivel de
 * evidencia.
 *
 * ORDEN DE LECTURA (de más fuerte a más débil, se corta en la primera que
 * aplica):
 *
 *   1. RAZÓN masa/volumen explícita, aunque no sea la primera magnitud del
 *      nombre: "Ambroxol Jarabe **100 ml** 15 mg/5 ml" → `15 mg/5 ml`. Misma
 *      regla que `liquidConcentration()` nivel 1.
 *
 *   2. MASA ABSOLUTA: la primera magnitud de masa del nombre. Cubre tanto el
 *      sólido ("Paracetamol **500 mg** x 16") como el líquido escrito sin
 *      separador ("Jarabe Ambroxol clorhidrato **30mg** 5ml 100ml").
 *
 *   3. `absent`.
 *
 * PROHIBICIÓN EXPLÍCITA (R4 del modelo aprobado): NUNCA se infiere una razón por
 * yuxtaposición. "Ambroxol 30 mg 100 ml" es masa `30 mg` + volumen de envase
 * `100 mL`, jamás `30 mg/100 mL` — leerlo como razón inventaría una potencia 20
 * veces menor. Y un volumen suelto (`100 ml`) NUNCA entra acá: no es una
 * concentración, es el frasco.
 */
export function readConcentrationEvidence(name: string): ConcentrationEvidence {
  const measurements = parseMeasurements(name);

  for (const candidate of measurements) {
    if (
      candidate.denominator !== null &&
      isMassUnit(candidate.numerator.unit) &&
      isVolumeUnit(candidate.denominator.unit)
    ) {
      return { kind: "ratio", value: candidate };
    }
  }

  const mass = measurements.find(
    (m) => m.denominator === null && isMassUnit(m.numerator.unit)
  );
  if (mass) return { kind: "mass-only", value: mass.numerator };

  return { kind: "absent" };
}

/**
 * Firma canónica y NUMÉRICA de una evidencia de concentración, para derivar el
 * `conceptId`.
 *
 * Es numérica y no literal a propósito: `600mg/100ml`, `30mg/5ml` y `6mg/ml` son
 * tres escrituras reales del mismo jarabe de Ambroxol en tres farmacias
 * distintas, y las tres deben derivar la MISMA firma —y por lo tanto el mismo
 * `conceptId`— o el modelo v2 reproduciría la fragmentación que viene a
 * corregir (CF-SEARCH-011 §7, R1 del modelo aprobado).
 *
 * `toPrecision(12)` normaliza el error de punto flotante de la conversión de
 * unidades (`0,5 g` → `500 mg`) sin colapsar potencias realmente distintas: la
 * separación mínima observada en el catálogo (`7,5` vs `3` mg/mL) es doce
 * órdenes de magnitud mayor que el residuo que esa precisión descarta.
 *
 * Cuando la unidad está fuera de las familias convertibles (`ui`, `%`) no existe
 * valor numérico comparable y se cae a la representación literal: nunca se
 * inventa una conversión.
 */
export function concentrationSignature(evidence: ConcentrationEvidence): string {
  if (evidence.kind === "absent") return "conc:?";

  if (evidence.kind === "mass-only") {
    const ratio = concentrationRatio({ numerator: evidence.value, denominator: null });
    return ratio === null
      ? `conc:mass:lit:${evidence.value.value}${evidence.value.unit}`
      : `conc:mass:${normalizeNumber(ratio.value)}${ratio.unit}`;
  }

  const ratio = concentrationRatio(evidence.value);
  if (ratio === null) {
    const { numerator, denominator } = evidence.value;
    const literal = denominator
      ? `${numerator.value}${numerator.unit}/${denominator.value}${denominator.unit}`
      : `${numerator.value}${numerator.unit}`;
    return `conc:ratio:lit:${literal}`;
  }
  return `conc:ratio:${normalizeNumber(ratio.value)}${ratio.unit}`;
}

function normalizeNumber(value: number): string {
  return Number(value.toPrecision(12)).toString();
}

/**
 * Compara dos evidencias de concentración. Es la tabla R5 del modelo aprobado,
 * implementada literalmente:
 *
 * | A          | B          | condición              | resultado      |
 * |------------|------------|------------------------|----------------|
 * | `ratio`    | `ratio`    | misma razón            | `equal`        |
 * | `ratio`    | `ratio`    | razón distinta         | `incompatible` |
 * | `mass-only`| `mass-only`| misma masa             | `equal`        |
 * | `mass-only`| `mass-only`| masa distinta          | `incompatible` |
 * | `mass-only`| `ratio`    | mismo numerador        | `subsumable`   |
 * | `mass-only`| `ratio`    | numerador distinto     | `incompatible` |
 * | `absent`   | cualquiera | —                      | `subsumable`   |
 * | cualquiera | `absent`   | —                      | `subsumable`   |
 *
 * La fila en negrita del modelo —`mass-only` bajo `ratio` con el mismo
 * numerador— es la que hoy falta en v1 y la que resuelve el caso `ambroxol
 * 30mg`: "Ambroxol clorhidrato **30 mg** 100 ml" (EcoFarmacias) y "Ambroxol
 * **30mg/5ml** Jarabe 100ml" (Sermecoop) son el mismo concepto escrito con y sin
 * separador, y `mass-only` es la lectura INCOMPLETA del mismo hecho, no una
 * concentración distinta.
 *
 * `600 mg/100 ml` vs `mass-only 30 mg` da `incompatible`: son razón equivalente
 * a `30 mg/5 ml` pero numeradores distintos, y decidir lo contrario exigiría
 * inferir a qué volumen se refiere la masa — exactamente la inferencia que R4
 * prohíbe. Limitación conocida y registrada; la dirección del error es la
 * conservadora del proyecto (partir, no fusionar).
 */
export function compareConcentration(
  a: ConcentrationEvidence,
  b: ConcentrationEvidence
): AxisComparison {
  if (a.kind === "absent" || b.kind === "absent") return "subsumable";

  if (a.kind === "ratio" && b.kind === "ratio") {
    return isSameConcentration(a.value, b.value) ? "equal" : "incompatible";
  }

  if (a.kind === "mass-only" && b.kind === "mass-only") {
    return isSameMeasurement(a.value, b.value) ? "equal" : "incompatible";
  }

  // Niveles mixtos: exactamente uno es `ratio` y el otro `mass-only`.
  const mass: Measurement = a.kind === "mass-only" ? a.value : (b as MassOnly).value;
  const ratio: Concentration = a.kind === "ratio" ? a.value : (b as RatioEvidence).value;

  return isSameMeasurement(mass, ratio.numerator) ? "subsumable" : "incompatible";
}

/**
 * `true` si `weak` es una lectura estrictamente MÁS DÉBIL de `strong`.
 * Sirve para decidir la dirección de la subsunción cuando la comparación
 * devuelve `subsumable`: `absent` ⊂ `mass-only` ⊂ `ratio`.
 */
export function isWeakerConcentration(
  weak: ConcentrationEvidence,
  strong: ConcentrationEvidence
): boolean {
  return concentrationStrength(weak) < concentrationStrength(strong);
}

function concentrationStrength(evidence: ConcentrationEvidence): number {
  return evidence.kind === "absent" ? 0 : evidence.kind === "mass-only" ? 1 : 2;
}

/** Texto legible de una evidencia, para `canonicalName` y diagnóstico. */
export function formatConcentration(evidence: ConcentrationEvidence): string | null {
  if (evidence.kind === "absent") return null;
  if (evidence.kind === "mass-only") return `${evidence.value.value} ${evidence.value.unit}`;
  const { numerator, denominator } = evidence.value;
  if (denominator === null) return `${numerator.value} ${numerator.unit}`;
  const denom =
    denominator.value === 1 ? denominator.unit : `${denominator.value} ${denominator.unit}`;
  return `${numerator.value} ${numerator.unit}/${denom}`;
}
