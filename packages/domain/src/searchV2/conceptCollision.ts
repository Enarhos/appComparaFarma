/**
 * Search Engine v2 — GATE D: Concept Semantic Collision Rate
 * (CF-SEARCH-012, S1). Umbral: 0. Automatizado.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ EXISTE ESTE GATE, Y POR QUÉ NO ALCANZABA CON LOS TRES DE S0
 * ---------------------------------------------------------------------------
 * En S0 los tres gates estaban en verde MIENTRAS la asociación
 * diclofenaco+tramadol de Adorlan compartía Concepto Farmacéutico con el
 * monofármaco de diclofenaco de Lertus, con resolución `complete` y confianza
 * `high` (`S0_FAILURES.md` §10). El Gate C mide contradicciones dentro de un
 * PRODUCTO; ese defecto vivía un nivel más arriba, dentro del CONCEPTO, y por
 * eso ningún gate lo veía.
 *
 * El Gate D mira el nivel donde vive el conocimiento farmacológico: dos
 * observaciones que el registro asignó al MISMO `CFM-CONCEPT-ID` no pueden
 * contradecirse en ninguno de los ocho ejes de abajo. Es una afirmación
 * clínica —"estas dos cosas son el mismo medicamento"— y una contradicción ahí
 * no es un defecto de agrupamiento, es una afirmación falsa.
 *
 * ---------------------------------------------------------------------------
 * QUÉ REPORTA
 * ---------------------------------------------------------------------------
 * Nunca un booleano. Cada colisión trae `collisionType`, las dos entidades
 * enfrentadas, la evidencia concreta de cada lado, la firma del concepto y el
 * motivo legible — lo suficiente para decidir sin reejecutar nada.
 *
 * ---------------------------------------------------------------------------
 * LO QUE ESTE DETECTOR NO HACE
 * ---------------------------------------------------------------------------
 * No compara evidencia AUSENTE contra evidencia PRESENTE. Que una farmacia
 * declare la forma farmacéutica y otra no, no es una contradicción: es una
 * lectura incompleta, y tratarla como colisión convertiría el gate en un
 * detector de fragmentación. Solo se cuenta contradicción cuando AMBOS lados
 * declaran y lo declarado es incompatible.
 */

import { compareConcentration } from "./canonicalConcentration.js";
import type { CanonicalAttributes } from "./canonicalTypes.js";

/** Las ocho clases mínimas de contradicción semántica dentro de un Concepto. */
export type ConceptCollisionType =
  /** 1. Un monofármaco y una asociación declarados como el mismo concepto. */
  | "MONOTHERAPY_VS_ASSOCIATION"
  /** 2. Dos conjuntos de principios activos completos y distintos. */
  | "INCOMPATIBLE_INGREDIENTS"
  /** 3. Concentraciones declaradas y contradictorias. */
  | "INCOMPATIBLE_CONCENTRATION"
  /** 4. Formas farmacéuticas declaradas y distintas (comprimido vs cápsula). */
  | "INCOMPATIBLE_DOSAGE_FORM"
  /** 5. Vías de administración declaradas y distintas (óvulo vs supositorio). */
  | "INCOMPATIBLE_ROUTE"
  /** 6. Unidades farmacéuticas declaradas y distintas (sobre vs comprimido). */
  | "INCOMPATIBLE_PHARMACEUTICAL_UNIT"
  /** 7. Un componente que un nombre declara AUSENTE y otro declara PRESENTE. */
  | "NEGATED_COMPONENT_PRESENT"
  /** 8. Un discriminante de identidad no resuelta tratado como principio activo. */
  | "UNRESOLVED_DISCRIMINATOR_AS_INGREDIENT";

/** Una observación ya asignada a un concepto, lista para auditar. */
export interface ConceptMember {
  /** ID de la observación (o cualquier referencia estable para el informe). */
  observationId: string;
  pharmacy: string;
  rawName: string;
  attributes: CanonicalAttributes;
}

export interface ConceptCollision {
  collisionType: ConceptCollisionType;
  conceptId: string;
  /** Firma canónica del concepto en la que ocurre la contradicción. */
  signature: string;
  left: { observationId: string; pharmacy: string; rawName: string; evidence: string };
  right: { observationId: string; pharmacy: string; rawName: string; evidence: string };
  reason: string;
}

function ingredientSet(attributes: CanonicalAttributes): string[] {
  return attributes.activeIngredients.map((i) => i.token).sort();
}

/** Una lectura de composición es COMPLETA cuando nombró todo lo que declara. */
function isCompleteComposition(attributes: CanonicalAttributes): boolean {
  const tokens = attributes.activeIngredients.length;
  return tokens > 0 && tokens >= attributes.declaredComponentCount;
}

function describe(attributes: CanonicalAttributes): string {
  const ing = ingredientSet(attributes);
  return [
    `ing=${ing.length > 0 ? ing.join("+") : "?"}`,
    `declared=${attributes.declaredComponentCount}`,
    `disc=${attributes.unresolvedIdentityDiscriminator ?? "none"}`,
  ].join(" ");
}

/**
 * Detecta contradicciones semánticas entre las observaciones asignadas a UN
 * concepto. Compara todos los pares una sola vez (i < j).
 */
export function detectConceptCollisions(
  conceptId: string,
  signature: string,
  members: ConceptMember[]
): ConceptCollision[] {
  const collisions: ConceptCollision[] = [];

  const push = (
    collisionType: ConceptCollisionType,
    left: ConceptMember,
    right: ConceptMember,
    leftEvidence: string,
    rightEvidence: string,
    reason: string
  ): void => {
    collisions.push({
      collisionType,
      conceptId,
      signature,
      left: {
        observationId: left.observationId,
        pharmacy: left.pharmacy,
        rawName: left.rawName,
        evidence: leftEvidence,
      },
      right: {
        observationId: right.observationId,
        pharmacy: right.pharmacy,
        rawName: right.rawName,
        evidence: rightEvidence,
      },
      reason,
    });
  };

  // --- CLASE 8, nivel de ENTIDAD ------------------------------------------
  // Un concepto no puede afirmar a la vez "contiene esta molécula" y "no pude
  // resolver qué es". Es la corrección del punto 2 de la revisión del PR #159
  // convertida en gate: si vuelve a pasar, se detecta sola.
  for (const member of members) {
    if (
      member.attributes.activeIngredients.length > 0 &&
      member.attributes.unresolvedIdentityDiscriminator !== null
    ) {
      push(
        "UNRESOLVED_DISCRIMINATOR_AS_INGREDIENT",
        member,
        member,
        describe(member.attributes),
        describe(member.attributes),
        `la observación afirma principios activos (${ingredientSet(member.attributes).join("+")}) y a la vez un discriminante de identidad no resuelta ("${member.attributes.unresolvedIdentityDiscriminator}"): son dos afirmaciones incompatibles sobre el mismo concepto`
      );
    }
  }

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const a = members[i]!;
      const b = members[j]!;
      const left = a.attributes;
      const right = b.attributes;

      // --- CLASE 1: monoterapia vs asociación ------------------------------
      const leftArity = Math.max(left.declaredComponentCount, left.activeIngredients.length);
      const rightArity = Math.max(right.declaredComponentCount, right.activeIngredients.length);
      if (leftArity >= 1 && rightArity >= 1 && (leftArity > 1) !== (rightArity > 1)) {
        push(
          "MONOTHERAPY_VS_ASSOCIATION",
          a,
          b,
          `componentes declarados=${leftArity} (${describe(left)})`,
          `componentes declarados=${rightArity} (${describe(right)})`,
          "una asociación y un monofármaco no pueden ser el mismo Concepto Farmacéutico"
        );
      }

      // --- CLASE 2: conjuntos de principios activos incompatibles ----------
      if (isCompleteComposition(left) && isCompleteComposition(right)) {
        const ls = ingredientSet(left).join("+");
        const rs = ingredientSet(right).join("+");
        if (ls !== rs) {
          push(
            "INCOMPATIBLE_INGREDIENTS",
            a,
            b,
            `ing=${ls}`,
            `ing=${rs}`,
            "dos composiciones completas y distintas asignadas al mismo Concepto Farmacéutico"
          );
        }
      }

      // --- CLASE 3: concentración incompatible -----------------------------
      if (compareConcentration(left.concentration, right.concentration) === "incompatible") {
        push(
          "INCOMPATIBLE_CONCENTRATION",
          a,
          b,
          JSON.stringify(left.concentration),
          JSON.stringify(right.concentration),
          "dos concentraciones declaradas y contradictorias en el mismo Concepto Farmacéutico"
        );
      }

      // --- CLASE 4: forma farmacéutica -------------------------------------
      if (
        left.canonicalDosageForm !== null &&
        right.canonicalDosageForm !== null &&
        left.canonicalDosageForm !== right.canonicalDosageForm
      ) {
        push(
          "INCOMPATIBLE_DOSAGE_FORM",
          a,
          b,
          `form=${left.canonicalDosageForm}`,
          `form=${right.canonicalDosageForm}`,
          "EDM-100 enumera la Forma Farmacéutica como dimensión del Concepto: dos formas declaradas y distintas no son el mismo concepto"
        );
      }

      // --- CLASE 5: vía de administración ----------------------------------
      if (left.route !== null && right.route !== null && left.route !== right.route) {
        push(
          "INCOMPATIBLE_ROUTE",
          a,
          b,
          `route=${left.route}`,
          `route=${right.route}`,
          "EDM-100 enumera la Vía de Administración como dimensión del Concepto: afirmar dos vías es una afirmación falsa sobre cómo se administra el medicamento"
        );
      }

      // --- CLASE 6: unidad farmacéutica ------------------------------------
      if (
        left.pharmaceuticalUnit !== null &&
        right.pharmaceuticalUnit !== null &&
        left.pharmaceuticalUnit !== right.pharmaceuticalUnit
      ) {
        push(
          "INCOMPATIBLE_PHARMACEUTICAL_UNIT",
          a,
          b,
          `unit=${left.pharmaceuticalUnit}`,
          `unit=${right.pharmaceuticalUnit}`,
          "EDM-100 enumera la Unidad Farmacéutica como dimensión del Concepto: un sobre y un comprimido no son la misma unidad"
        );
      }

      // --- CLASE 7: componente negado vs presente --------------------------
      // "Tapsin Puro SIN Cafeína" contra "Tapsin CON cafeína": nombrar una
      // molécula para decir que NO está es evidencia POSITIVA de ausencia.
      for (const [negatedSide, presentSide, negatedMember, presentMember] of [
        [left, right, a, b],
        [right, left, b, a],
      ] as const) {
        const present = new Set(presentSide.activeIngredients.map((i) => i.token));
        for (const token of negatedSide.negatedComponents) {
          if (!present.has(token)) continue;
          push(
            "NEGATED_COMPONENT_PRESENT",
            negatedMember,
            presentMember,
            `declara AUSENTE: ${token}`,
            `declara PRESENTE: ${token}`,
            `un nombre declara explícitamente que no contiene "${token}" y el otro lo afirma como principio activo: no pueden ser el mismo Concepto Farmacéutico`
          );
        }
      }

      // --- CLASE 8, nivel de PAR -------------------------------------------
      // Un discriminante no resuelto no es conocimiento farmacológico. Si una
      // observación lo trae y la otra afirma moléculas, el concepto está
      // presentando una cabecera textual desconocida como si fuera identidad
      // farmacológica demostrada.
      const leftDisc = left.unresolvedIdentityDiscriminator;
      const rightDisc = right.unresolvedIdentityDiscriminator;
      if (leftDisc !== rightDisc) {
        push(
          "UNRESOLVED_DISCRIMINATOR_AS_INGREDIENT",
          a,
          b,
          `disc=${leftDisc ?? "none"} ${describe(left)}`,
          `disc=${rightDisc ?? "none"} ${describe(right)}`,
          "dos discriminantes de identidad no resuelta distintos en el mismo concepto: una identidad textual sin resolver quedó tratada como si fuera identidad farmacológica"
        );
      }
    }
  }

  return collisions;
}

/** Resultado agregado del Gate D. */
export interface ConceptCollisionReport {
  conceptsAudited: number;
  pairsCompared: number;
  collisions: ConceptCollision[];
  byType: Record<string, number>;
  /** Colisiones / pares comparados. Umbral del gate: exactamente 0. */
  rate: number;
}

/** Audita TODOS los conceptos del registro. */
export function auditConceptCollisions(
  groups: Array<{ conceptId: string; signature: string; members: ConceptMember[] }>
): ConceptCollisionReport {
  const collisions: ConceptCollision[] = [];
  let pairs = 0;

  for (const group of groups) {
    const n = group.members.length;
    pairs += (n * (n - 1)) / 2;
    collisions.push(...detectConceptCollisions(group.conceptId, group.signature, group.members));
  }

  const byType: Record<string, number> = {};
  for (const collision of collisions) {
    byType[collision.collisionType] = (byType[collision.collisionType] ?? 0) + 1;
  }

  return {
    conceptsAudited: groups.length,
    pairsCompared: pairs,
    collisions,
    byType,
    rate: pairs === 0 ? 0 : collisions.length / pairs,
  };
}
