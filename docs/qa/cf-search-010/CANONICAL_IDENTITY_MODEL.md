# CF-SEARCH-010 — Modelo de identidad canónica (propuesta)

Propuesta de diseño. **No implementada.** Los nombres son una representación del
Enterprise Data Model, no un contrato cerrado.

Regla que gobierna todo este documento: **no se inventa un modelo alternativo.**
La jerarquía, los nombres conceptuales y la semántica salen de
`docs/enterprise/ENTERPRISE_DATA_MODEL.md` y
`docs/enterprise/strategy/MASTER_DATA_STRATEGY.md`. Lo que se propone acá es su
proyección técnica.

---

## 1. Las cuatro entidades

```ts
/** EDM-100 · CFM-CONCEPT-ID — identidad científica permanente. */
interface CanonicalMedicationConcept {
  conceptId: string;                     // "CFM-C-000123", asignado una vez, inmutable
  canonicalName: string;                 // CONSTRUIDO desde los atributos, no copiado de una farmacia
  activeIngredients: ActiveIngredient[]; // ordenado y normalizado; 1 = monofármaco, N = asociación
  concentration: Concentration | null;   // razón estructurada — ver §3
  dosageForm: DosageForm;                // clase gruesa vigente + subforma opcional
  route: AdministrationRoute | null;     // derivada de dosageForm por tabla explícita
  pharmaceuticalUnit: PharmaceuticalUnit | null; // comprimido | frasco | sobre | ampolla | ...
  atcCode: string | null;                // futuro, no bloqueante
  status: "active" | "merged" | "deprecated";
  mergedIntoConceptId: string | null;
  source: "auto" | "curated";
  firstSeenAt: string;
  lastSeenAt: string;
}

/** EDM-100 · CFM-PRESENTATION-ID — manifestación física del concepto. */
interface CanonicalPresentation {
  presentationId: string;                // "CFM-P-000123"
  conceptId: string;
  quantity: number | null;               // unidades por envase (NUNCA un volumen)
  unit: PharmaceuticalUnit | null;
  totalVolume: Measurement | null;       // 100 mL — el frasco, NUNCA la concentración
  packageType: string | null;            // caja | frasco | tira | blister
}

/** EDM-100 · CFM-PRODUCT-ID — producto comercial de un laboratorio. */
interface CommercialMedicinalProduct {
  productId: string;                     // "CFM-M-000123"
  conceptId: string;
  presentationId: string;
  brand: string | null;                  // "Muxol". null es legítimo (genérico sin marca)
  commercialVariant: string | null;      // "Forte", "Rojo", "Instaflu"
  manufacturer: string | null;           // "Eurolab"
  ispRegistration: string | null;        // "F-12345/16" — identificador FUERTE
  gtin: string | null;                   // EAN-13 — identificador FUERTE
  bioequivalence: BioequivalenceStatus;  // entidad aparte, NO parte de la identidad
  status: "active" | "discontinued";
}

/** EDM-200 · CFM-OFFER-ID — manifestación temporal de mercado. */
interface Offer {
  offerId: string;                       // determinista: productId + pharmacyId + channel
  productId: string;
  pharmacyId: PharmacySlug;
  sourceProductId: string;               // ID nativo de la farmacia — hoy se descarta
  sourceProductName: string;             // texto crudo, conservado para linaje (EDM-500)
  price: PriceChannels;                  // se conserva TAL CUAL del motor v1
  stock: boolean | null;                 // tri-estado — hoy es boolean con 2 fuentes hardcodeadas
  url: string | null;
  imageUrl: string | null;
  capturedAt: string;
}
```

### Invariantes

1. `conceptId` **nunca** depende de la marca, el laboratorio, la farmacia, el
   precio ni la consulta. *"El conocimiento antecede al mercado"* (EDM-100).
2. `presentationId` **nunca** depende de la marca ni del laboratorio.
3. `productId` es lo único que puede depender de la marca y del fabricante.
4. `offerId` es lo único que puede depender de la farmacia, el canal y el
   instante.
5. **Ninguno de los cuatro depende de la consulta del usuario.**
6. **Ninguno de los cuatro depende del ranking.**
7. La bioequivalencia es una **relación regulatoria**, no un eje de identidad.
   Esto ya fue decidido en BIOEQUIVALENCE-DATA-QUALITY-01 (Option D, paso 7) y
   nunca se implementó; el modelo v2 lo asume.

---

## 2. Cómo se resuelve la identidad (orden de evidencia)

De más fuerte a más débil. **Una regla débil nunca contradice a una fuerte.**

| Nivel | Evidencia | Aplica a | Cobertura medida hoy |
|---|---|---|---|
| **E1** | `gtin` / `ispRegistration` iguales | `productId` | 0 % (no se captura; **14,1 % disponible sin coste de red**) |
| **E2** | `sourceProductId` igual dentro de la misma farmacia | `offerId` | 100 % disponible, 0 % usado |
| **E3** | Atributos estructurados que la farmacia declara (`brand`, `manufacturer`) | `productId` | 27,5 % |
| **E4** | Atributos parseados del nombre (concentración, forma, cantidad, volumen) | `conceptId`, `presentationId` | 26,6 %–90,8 % según el eje |
| **E5** | Heurística de vocabulario (variante comercial, alias de marca) | `productId` | — |

**Cambio de fondo respecto de v1:** hoy **todo** vive en E4/E5 y se concatena en
una cadena. En v2, E4/E5 solo **proponen** un candidato; la asignación de
`conceptId` se **persiste**, y la próxima vez que llegue el mismo nombre se
**recupera** en vez de recalcularse. La heurística deja de ser la identidad y
pasa a ser el mecanismo de **entrada** a la identidad.

Es exactamente lo que RFC-002 ya diseñó para `matchKey → cfm_id`, aplicado a la
granularidad correcta. `COMMERCIAL_IDENTITY.md` §6 ya lo anticipa como
evolución natural.

### Resolución de conflictos

`MASTER_DATA_STRATEGY.md` §11 lo exige: *"Cuando dos fuentes entreguen
información distinta, el sistema deberá aplicar reglas de resolución. Nunca
deberá sobrescribirse información sin trazabilidad."*

Regla propuesta: **prioridad de fuente (E1 > E2 > E3 > E4 > E5), y ante empate
en el mismo nivel, no se sobrescribe — se marca el registro como
`needsReview`** y se conserva la asignación existente. Se reutiliza el campo
`source: 'auto' | 'curated'` que la tabla `medications` de RFC-002 ya tiene.

---

## 3. Concentración — la sección que el ticket exige explícitamente

### 3.1 Los tres conceptos que hoy se confunden

| Concepto | Significado | Ejemplo | Dónde vive en v2 |
|---|---|---|---|
| **Concentración** | Principio activo por unidad de forma o de volumen | `30 mg/5 mL`, `500 mg` | `Concept.concentration` |
| **Volumen de envase** | Cuánto líquido trae el frasco | `100 mL` | `Presentation.totalVolume` |
| **Contenido total** | Masa total de principio activo en el envase | `600 mg en 100 mL` | derivado, no almacenado |

En v1 los tres compiten por **el mismo segmento de `matchKey`**, y gana el
volumen (`matching.ts:108`, `mlHits` antes que `mgHits`, con `Math.max`).

### 3.2 Reglas

**R1 — Equivalencia matemática permitida, dentro de la misma dimensión.**

```
600 mg / 100 mL  ≡  30 mg / 5 mL  ≡  6 mg / mL     ✅  (razón 6 mg/mL)
0,5 g / 5 mL     ≡  500 mg / 5 mL                   ✅
```

`isSameConcentration()` (`concentration.ts:224`) **ya implementa esto
correctamente**. Se conserva sin cambios.

**R2 — Potencias distintas NUNCA son equivalentes.**

```
30 mg / 5 mL  ✗  15 mg / 5 mL     (factor 2 — el falso merge de CF-SEARCH-003)
30 mg / 5 mL  ✗  7,5 mg / mL      (factor 0,8)
```

**R3 — Concentración y volumen de envase nunca se confunden.**

```
"Ambroxol 30 mg/5 mL Jarabe 100 mL"
  concentration = 30 mg/5 mL
  totalVolume   = 100 mL
```

Dos frascos de 60 mL y 100 mL de la misma concentración son el **mismo
Concepto** y **distinta Presentación**. Hoy son el mismo `matchKey` solo si
coincide el volumen, y distinto si no — es decir, lo contrario.

**R4 — Nunca se infiere una razón por yuxtaposición.**

```
"Ambroxol 30 mg 100 ml"  →  concentración = 30 mg (masa absoluta), volumen = 100 mL
                         →  NUNCA 30 mg/100 mL
```

`liquidConcentration()` **ya respeta esta regla** y está bien documentada.

**R5 — Nueva: la masa absoluta declarada junto a un volumen es una
concentración *incompleta*, no una concentración distinta.**

Es la corrección de fondo al caso `ambroxol 30mg`. Se propone un tipo explícito:

```ts
type ConcentrationEvidence =
  | { kind: "ratio";      value: Concentration }   // 30 mg/5 mL  — evidencia fuerte
  | { kind: "mass-only";  value: Measurement }     // 30 mg junto a 100 mL — incompleta
  | { kind: "absent" };
```

Regla de comparación:

| A | B | Resultado |
|---|---|---|
| `ratio` vs `ratio` | misma razón | **igual** |
| `ratio` vs `ratio` | razón distinta | **incompatible** |
| `mass-only` vs `mass-only` | misma masa | igual |
| `mass-only` vs `mass-only` | masa distinta | incompatible |
| **`ratio` vs `mass-only`** | **mismo numerador** | **COMPATIBLE** (no igual, no incompatible) |
| `ratio` vs `mass-only` | numerador distinto | incompatible |
| cualquiera vs `absent` | — | compatible |

La fila en negrita es la que hoy falta. `isCompatibleConcentration` ya devuelve
`true` para razón-vs-masa (`productIdentity.ts:794`), lo cual es correcto para
**fusionar**; lo que no existe es la misma noción del lado de la **consulta**:
`isSameConcentration` devuelve `false` y la cohorte manda el producto correcto a
`other`. **32 tarjetas medidas.**

**R6 — La resolución de la ambigüedad se persiste, no se recalcula.**

Cuando un `conceptId` ya tiene `concentration = 30 mg/5 mL` y llega una oferta
con `mass-only 30 mg` cuyo resto de atributos coincide, se asigna al mismo
concepto **y queda registrado**. La próxima captura no vuelve a decidir. Es la
diferencia entre un motor que adivina cada vez y uno que aprende una vez.

### 3.3 Casos de aceptación

| Entrada A | Entrada B | Veredicto |
|---|---|---|
| `600mg/100ml` | `30mg/5ml` | mismo concepto |
| `30mg/5ml` | `15mg/5ml` | conceptos distintos |
| `30mg/5ml` frasco 100 mL | `30mg/5ml` frasco 60 mL | mismo concepto, presentaciones distintas |
| `Ambroxol 30mg 100ml` (EcoFarmacias) | `Ambroxol 30mg/5ml Jarabe 100ml` (Sermecoop) | mismo concepto |
| `500 mg` comprimido | `500 mg/5 mL` jarabe | conceptos distintos (dosis absoluta ≠ razón, y además otra forma) |
| `100 ml` sin masa | `30mg/5ml 100 ml` | compatible (ausencia no bloquea) |
| `7,5 mg/ml` gotas | `15 mg/5 ml` jarabe | **razón distinta** (7,5 vs 3 mg/mL) ⇒ conceptos distintos |

La última fila es real y hoy funciona: Broncot gotas y Broncot jarabe están
correctamente separados.

---

## 4. Nombre canónico construido

En v1, `canonicalName` es el nombre crudo de la farmacia que gane
`pickCanonicalSlot` (con laboratorio → nombre más corto → precio → slug). De ahí
salen el título de la tarjeta y la parte legible del slug.

En v2 se construye desde los atributos:

```
{marca | principio activo} {variante} {concentración} {forma} {cantidad} {volumen}
→ "Muxol Adulto Ambroxol 30 mg/5 mL Jarabe 100 mL"
```

Beneficios directos y medibles: el título deja de depender de qué farmacia
respondió; el slug deja de derivar del texto de un tercero; y desaparece la
causa raíz del redirect loop que `resolveMedication.ts` documenta.

El nombre crudo de cada fuente se conserva en `Offer.sourceProductName`
(trazabilidad EDM-500) y se sigue mostrando por oferta.

---

## 5. Qué se conserva literalmente de v1

Esto no es un rediseño desde cero. Lo siguiente **se mueve, no se reescribe**:

| Componente | Estado en v2 |
|---|---|
| `PriceChannels` y `effectivePrice` | **Sin cambios.** Es la parte mejor modelada del sistema |
| `concentration.ts` completo | **Sin cambios.** El modelo de razón estructurada ya es el correcto |
| `isSameConcentration`, `isSameMeasurement` | Sin cambios |
| `liquidConcentration` | Se conserva como **lector** (E4), deja de ser identidad |
| `dosageFormClass` | Se conserva; pasa a ser atributo del concepto |
| `unitCountKey` + `MEASURE_UNITS` | Se conserva; pasa a ser `Presentation.quantity` (y por fin gobierna) |
| `combinationKey` | Se conserva como lector; alimenta `activeIngredients[]` |
| `commercialVariantKey` | Se conserva; pasa a `Product.commercialVariant` |
| `resolveBrandIdentity` (CF-DATA-001) | Se conserva y **pasa a ser la única verdad de marca** |
| `isPlausibleCommercialIdentity` | Se conserva como validación de `manufacturer` |
| Los 9 adaptadores | Sin cambios, salvo dos campos aditivos (`sourceProductId`, `ispRegistration`) |
| `sanitizePharmacyUrl`, `pharmacyDomains` | Sin cambios |
| `rankByRelevance` | Se conserva la mecánica; cambia lo que consume (ver `QUERY_INTENT_V2.md`) |

**Lo que se elimina como *identidad*** (no como código): la concatenación de
texto. `matchKey` y `presentationKey` **siguen existiendo y siguen calculándose
igual** — ver `MIGRATION_STRATEGY.md`.
