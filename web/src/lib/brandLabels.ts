/**
 * CF-DATA-001 — etiquetas de identidad comercial para Web.
 *
 * Regla de producto, no de presentación: **la UI nunca llama "Marca" a un
 * fabricante ni "Laboratorio" a un principio activo.** Antes de este ticket,
 * los tres conceptos viajaban en un solo campo (`MedicationResult.laboratory`)
 * cuya semántica dependía de la farmacia, y la UI los rotulaba a todos igual —
 * "EUROLAB" (fabricante de Muxol) aparecía como "Marca".
 *
 * Este módulo existe para que esa decisión viva en UN lugar: tres componentes
 * distintos (`MedicationCard`, `CommercialProductRow`, la ficha de producto)
 * mostraban la misma línea con tres textos de respaldo distintos.
 *
 * NO reimplementa ninguna regla de negocio: lee los campos ya resueltos por
 * `@comparafarma/domain` (`brandIdentity.ts`). El campo `laboratory` sigue
 * existiendo en el contrato pero es un alias ambiguo y NO se usa acá.
 */
import type { MedicationResult } from "@comparafarma/domain";

type CommercialIdentityFields = Pick<MedicationResult, "brand" | "manufacturer">;

/** Copy aprobado para una oferta sin marca identificable. */
export const UNKNOWN_BRAND_LABEL = "Marca no identificada";

/** Copy aprobado para una oferta sin laboratorio informado por la farmacia. */
export const UNKNOWN_MANUFACTURER_LABEL = "Laboratorio no especificado";

/** `true` si no hay marca comercial identificada para esta oferta. */
export function isUnknownBrand(medication: CommercialIdentityFields): boolean {
  return !medication.brand?.trim();
}

/** Texto de MARCA, con su respaldo explícito. Nunca devuelve un fabricante. */
export function brandLabel(medication: CommercialIdentityFields): string {
  const brand = medication.brand?.trim();
  return brand ? brand : UNKNOWN_BRAND_LABEL;
}

/**
 * Línea de identidad de la tarjeta y de la ficha: laboratorio si la farmacia lo
 * informa; si no, la marca; y solo si no hay ninguno de los dos, el respaldo.
 *
 * El orden no es arbitrario. Esta línea reemplaza a la que mostraba
 * `laboratory` a secas, y `laboratory` valía `manufacturer ?? brand`: anteponer
 * el laboratorio conserva exactamente lo que ya se mostraba donde había dato, y
 * solo agrega información donde antes decía "Laboratorio no especificado".
 *
 * El respaldo dice "Laboratorio no especificado" —y no "Marca no
 * identificada"— porque describe lo que falta: que la farmacia no informó
 * quién lo fabrica. Que un producto no tenga marca es normal (es un genérico) y
 * no es una carencia que valga la pena anunciar en esta línea.
 */
export function identityLine(medication: CommercialIdentityFields): string {
  const manufacturer = medication.manufacturer?.trim();
  if (manufacturer) return manufacturer;
  const brand = medication.brand?.trim();
  if (brand) return brand;
  return UNKNOWN_MANUFACTURER_LABEL;
}
