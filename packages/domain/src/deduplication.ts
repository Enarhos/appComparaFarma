import type { MedicationResult, PharmacyPrice, PharmacySlug } from "./types.js";
import { combinationKey, matchKey } from "./matching.js";
import {
  commercialVariantKey,
  dosageFormClass,
  isCompatibleConcentration,
  isCompatibleUnitCount,
  liquidConcentration,
  unitCountKey,
} from "./productIdentity.js";
import type { Concentration } from "./concentration.js";

/**
 * Agrupa ofertas SAME_PRODUCT. Desde FASE 1 — Product Identity (2026-08-19),
 * la clave de agrupación es `presentationKey` (matchKey + bioequivalencia +
 * identidad comercial — ver commercialIdentity.ts), no `matchKey` a secas.
 * `matchKey` sigue siendo la identidad farmacológica amplia que usan
 * historial/alertas/favoritos/tracking/CFM-ID, sin cambios.
 *
 * Como `presentationKey` ya incorpora la bioequivalencia
 * (`|bio:true|false|unknown`), agrupar por ella preserva automáticamente la
 * separación bio=true / bio=false / bio=unknown que ya exigía el fix previo
 * — nunca se fusionan entre sí. CF-SEARCH-001 (2026-08-27) agrega a la misma
 * clave los ejes `|var:` (variante comercial) y `|form:` (forma farmacéutica).
 *
 * Política conservadora explícita: una oferta con identidad comercial
 * conocida (`brand:ascend`, `brand:curaespring`, ...) NUNCA comparte
 * `presentationKey` con una de identidad `brand:unknown` — cada valor
 * distinto de `commercialIdentity` (incluido `"unknown"`) produce su propio
 * grupo. Dos ofertas `brand:unknown` sí caen en el mismo grupo entre sí
 * (limitación conocida y aceptada, no un bug — ver commercialIdentity.ts).
 */

/**
 * Una oferta concreta dentro de un grupo: su `PharmacyPrice` y el
 * `MedicationResult` del que salió.
 *
 * CF-SEARCH-001 — el par se mantiene UNIDO durante todo el merge. Antes,
 * `mergeDuplicates` elegía el `canonical` (nombre, laboratorio,
 * bioequivalencia, imagen de la tarjeta) recorriendo TODO el grupo, pero
 * construía `prices` quedándose solo con la oferta más barata de cada
 * farmacia. Las dos selecciones eran independientes, así que la oferta que
 * daba el nombre podía no estar entre los precios mostrados: la tarjeta
 * quedaba titulada con un producto y enlazaba a otro.
 *
 * Observado en producción (`/api/search?q=tapsin`, 2026-08-27):
 *   presentationKey tapsin|12|bio:false|brand:maver
 *     canonicalName mostrado: "Tapsin Duo x 12 comprimidos"
 *     precios mostrados:      araucomed "Tapsin Periodo x 12 comprimidos." $1.490
 *                             farmex    "Tapsin Periodo x 12 comprimidos"  $1.890
 *   presentationKey tapsin|5000mg|n|bio:false|brand:maver
 *     canonicalName mostrado: "Tapsin InstaFLU noche 1 sobre polvo ... 5 g"
 *     precios mostrados:      farmex  "Tapsin Caliente Noche - Sabor Limón..."
 *                             dr-simi "Tapsin caliente compuesto noche..."
 * En ambos casos el título viene de una oferta que NO está en la lista de
 * precios de la tarjeta.
 */
interface OfferSlot {
  price: PharmacyPrice;
  owner: MedicationResult;
}

/**
 * Ejes de identidad recomputables a partir del NOMBRE de una oferta concreta
 * (`PharmacyPrice.productName`), sin depender de `presentationKey`.
 *
 * Se recomputan a propósito en vez de leerse de la clave: es la validación
 * independiente que exige el ticket antes de fusionar (candidate similarity →
 * identity compatibility → merge allowed). Si en el futuro dos ofertas
 * genuinamente distintas llegaran a compartir `presentationKey` —por un
 * cambio en la construcción de la clave, o por un `MedicationResult` ya
 * fusionado que se vuelve a pasar por acá— esta capa lo detecta igual y NO las
 * mezcla en la misma tarjeta.
 */
interface OfferNameIdentity {
  pharmacological: string;
  combination: string | null;
  variant: string | null;
  form: string | null;
  unitCount: number | null;
  concentration: Concentration | null;
}

function offerNameIdentity(price: PharmacyPrice): OfferNameIdentity {
  return {
    pharmacological: matchKey(price.productName),
    combination: combinationKey(price.productName),
    variant: commercialVariantKey(price.productName),
    form: dosageFormClass(price.productName),
    unitCount: unitCountKey(price.productName),
    concentration: liquidConcentration(price.productName),
  };
}

/**
 * `true` si dos ofertas del mismo grupo pueden mostrarse como el mismo
 * producto. Contradicción fuerte en principio activo/dosis/cantidad
 * (`matchKey`), en el segundo principio activo de una combinación, o en la
 * variante comercial ⇒ no se fusionan.
 *
 * La forma farmacéutica se compara con tolerancia a `null`: una farmacia que
 * simplemente no la escribe no está afirmando que su producto sea distinto
 * (ver `dosageFormClass` en productIdentity.ts).
 *
 * La CANTIDAD por envase se valida como eje propio (`unitCountKey`) y no a
 * través de `matchKey`. Es obligatorio hacerlo por separado: el segmento de
 * cantidad de `matchKey` normaliza "1 unidad" a cantidad vacía y no reconoce
 * varios sustantivos reales (`supositorios`, `tabs`, `caps`), así que dos
 * presentaciones de tamaño distinto podían llegar acá con el MISMO
 * `pharmacological` y fusionarse en una tarjeta cuya comparación de precio era
 * engañosa — 1 sobre contra una caja de 6. Dos cantidades explícitas distintas
 * ⇒ no se fusionan; la ausencia de cantidad no bloquea (justificación completa
 * en `isCompatibleUnitCount`, productIdentity.ts).
 *
 * La CONCENTRACIÓN farmacológica se valida acá por el mismo motivo y con la
 * misma mecánica (CF-SEARCH-003): el segmento de dosis de `matchKey` prioriza
 * el mililitro sobre el miligramo, así que en un líquido conserva el VOLUMEN
 * DEL ENVASE y descarta la concentración — "Ambroxol 30 mg/5 mL Jarabe 100 mL"
 * y "Ambroxol 15 mg/5 mL Jarabe 100 mL" comparten `ambroxol|100ml` y llegaban
 * acá como la misma tarjeta, con el doble de potencia a mitad de precio
 * presentado como ahorro. Dos concentraciones explícitas distintas ⇒ no se
 * fusionan; la ausencia no bloquea (justificación medida en
 * `isCompatibleConcentration`, productIdentity.ts).
 */
function canMergeOffers(a: OfferNameIdentity, b: OfferNameIdentity): boolean {
  if (a.pharmacological !== b.pharmacological) return false;
  if (a.combination !== b.combination) return false;
  if (a.variant !== b.variant) return false;
  if (a.form !== null && b.form !== null && a.form !== b.form) return false;
  if (!isCompatibleUnitCount(a.unitCount, b.unitCount)) return false;
  if (!isCompatibleConcentration(a.concentration, b.concentration)) return false;
  return true;
}

/**
 * Oferta que representa a la tarjeta (nombre, laboratorio, bioequivalencia,
 * imagen). Mismo criterio de preferencia que antes de CF-SEARCH-001 —primero
 * la que trae laboratorio, luego el nombre más corto— pero: (a) se elige SOLO
 * entre las ofertas que sobreviven al merge, y (b) los desempates son
 * completos y deterministas.
 *
 * El determinismo importa más allá de la prolijidad: `web` deriva el slug de
 * la ficha del `canonicalName`, y una elección que dependiera del orden de
 * llegada de las farmacias hacía derivar el slug entre una búsqueda y la
 * siguiente — la causa del redirect loop documentado en
 * `web/src/lib/resolveMedication.ts`.
 */
function pickCanonicalSlot(slots: OfferSlot[]): OfferSlot {
  return slots.reduce((best, cur) => (isBetterCanonical(cur, best) ? cur : best));
}

function isBetterCanonical(cur: OfferSlot, best: OfferSlot): boolean {
  const curHasLab = cur.owner.laboratory != null && cur.owner.laboratory !== "";
  const bestHasLab = best.owner.laboratory != null && best.owner.laboratory !== "";
  if (curHasLab !== bestHasLab) return curHasLab;

  if (cur.owner.canonicalName.length !== best.owner.canonicalName.length) {
    return cur.owner.canonicalName.length < best.owner.canonicalName.length;
  }
  if (cur.price.channels.effective !== best.price.channels.effective) {
    return cur.price.channels.effective < best.price.channels.effective;
  }
  return cur.price.pharmacySlug < best.price.pharmacySlug;
}

function buildResult(canonical: OfferSlot, slots: OfferSlot[]): MedicationResult {
  const prices = slots
    .map((slot) => slot.price)
    .sort((a, b) => a.channels.effective - b.channels.effective);
  const best = prices[0];

  // La imagen de la tarjeta sale de la oferta canónica (la misma que aporta el
  // nombre); si esa oferta no trae imagen, de la más barata que sí tenga —
  // siempre una oferta presente en `prices`, nunca una descartada.
  const imageUrl =
    canonical.price.imageUrl ??
    canonical.owner.imageUrl ??
    prices.map((price) => price.imageUrl).find((url) => url != null) ??
    null;

  return {
    ...canonical.owner,
    prices,
    bestPrice: best?.channels.effective ?? canonical.owner.bestPrice,
    bestPharmacy: best?.pharmacySlug ?? canonical.owner.bestPharmacy,
    imageUrl,
  };
}

export function mergeDuplicates(results: MedicationResult[]): MedicationResult[] {
  const groups = new Map<string, MedicationResult[]>();
  for (const result of results) {
    const key = result.presentationKey;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(result);
  }

  const merged: MedicationResult[] = [];

  for (const group of groups.values()) {
    if (group.length === 1) {
      merged.push(group[0]);
      continue;
    }

    // 1. Una sola oferta por farmacia: la más barata. Se conserva el
    //    `MedicationResult` de origen junto al precio para no perder la
    //    asociación nombre/laboratorio/imagen ↔ farmacia/precio/URL.
    const byPharmacy = new Map<PharmacySlug, OfferSlot>();
    for (const med of group) {
      for (const price of med.prices) {
        const existing = byPharmacy.get(price.pharmacySlug);
        if (!existing || price.channels.effective < existing.price.channels.effective) {
          byPharmacy.set(price.pharmacySlug, { price, owner: med });
        }
      }
    }

    const survivors = [...byPharmacy.values()];
    if (survivors.length === 0) continue;

    // 2. La tarjeta se representa con una oferta que efectivamente aparece en
    //    ella.
    const canonical = pickCanonicalSlot(survivors);
    const canonicalIdentity = offerNameIdentity(canonical.price);

    // 3. Validación de compatibilidad antes de fusionar. Los ejes
    //    `pharmacological`/`combination`/`variant`/`form` ya están en
    //    `presentationKey`, así que rara vez rechazan algo: para ellos esto es
    //    una red de seguridad. `unitCount` y `concentration` NO están en la
    //    clave —agregarlos rotaría el `presentationKey` (y el slug de ficha en
    //    Web) de casi todo el catálogo— así que es acá donde efectivamente
    //    separan una oferta de 1 unidad de una caja de N, y un jarabe de
    //    30 mg/5 mL de uno de 15 mg/5 mL.
    //
    //    La compatibilidad se exige contra TODAS las ofertas ya aceptadas, no
    //    solo contra la canónica (CF-SEARCH-003). Los dos ejes que no viven en
    //    la clave admiten la ausencia como compatible con cualquier valor, y
    //    esa relación NO es transitiva: si la oferta canónica fuera la que
    //    calla, dos ofertas mutuamente contradictorias entrarían las dos a la
    //    misma tarjeta por ser cada una compatible con ella. Es exactamente la
    //    situación del falso merge de Ambroxol, donde 2 de las 4 ofertas no
    //    declaran la razón mg/mL ("Ambroxol 30mg./5ml. Jarabe Fco. 100ml",
    //    Ahumada) y podrían haber quedado como canónicas: comparar solo contra
    //    la canónica dejaría el defecto sin corregir según qué farmacia
    //    responda primero. Con esta regla la tarjeta resultante es siempre
    //    internamente consistente, independientemente del orden de llegada.
    //
    //    El recorrido conserva el orden original de `survivors` —la canónica se
    //    da por aceptada de entrada, sin adelantarla en la lista— para no
    //    alterar el desempate estable de `buildResult()` entre dos ofertas con
    //    el mismo precio efectivo.
    const accepted: OfferNameIdentity[] = [canonicalIdentity];
    const compatible: OfferSlot[] = [];
    const rejected: OfferSlot[] = [];
    for (const slot of survivors) {
      if (slot === canonical) {
        compatible.push(slot);
        continue;
      }
      const identity = offerNameIdentity(slot.price);
      if (accepted.every((other) => canMergeOffers(other, identity))) {
        compatible.push(slot);
        accepted.push(identity);
      } else {
        rejected.push(slot);
      }
    }

    merged.push(buildResult(canonical, compatible));
    for (const slot of rejected) {
      merged.push(buildResult(slot, [slot]));
    }
  }

  return merged;
}
