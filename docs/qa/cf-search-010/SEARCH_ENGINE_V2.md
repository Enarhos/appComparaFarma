# CF-SEARCH-010 — Search Engine v2

Propuesta de diseño. **No implementada. No hay código productivo en esta
branch.**

---

## 1. Principios de arquitectura

Los tres que el ticket exige, más tres que salen de la auditoría:

1. **La identidad no depende del ranking.**
2. **El ranking no altera la identidad.**
3. **La consulta no cambia la identidad del producto.**
4. **La identidad no depende de la persistencia del histórico.** Es la
   restricción que estranguló a v1: `matchKey` no se puede corregir porque está
   guardado en cuatro tablas. En v2 la identidad se persiste **por sí misma**, y
   el histórico se cuelga de ella — no al revés.
5. **La identidad no depende del ruteo.** El slug se deriva de la identidad;
   la identidad nunca se limita para no romper URLs.
6. **El texto libre propone; el registro dispone.** Las heurísticas asignan un
   candidato la primera vez. A partir de ahí se **recupera**, no se recalcula.

---

## 2. Las once etapas

```
                        ┌──────────────────────────────────────────┐
   rawQuery ───────────►│ 7. QUERY INTENT                          │
                        │    QueryIntentV2 (sin tocar identidad)   │
                        └───────────────┬──────────────────────────┘
                                        │ retrievalQuery
                                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ 1. RETRIEVAL          9 adaptadores → RawOffer[]                 │
└───────────────┬──────────────────────────────────────────────────┘
                ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. CANONICALIZATION   texto → atributos estructurados            │
│                       NO decide identidad, solo LEE              │
└───────────────┬──────────────────────────────────────────────────┘
                ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. CONCEPT RESOLUTION      → conceptId       (registro)          │
│ 4. PRESENTATION RESOLUTION → presentationId  (registro)          │
│ 5. COMMERCIAL RESOLUTION   → productId       (registro)          │
│ 6. OFFER MAPPING           → offerId         (determinista)      │
└───────────────┬──────────────────────────────────────────────────┘
                ▼
┌──────────────────────────────────────────────────────────────────┐
│ 8. RELEVANCE CLASSIFICATION  EXACT|COMPATIBLE|ALTERNATIVE|       │
│                              UNKNOWN|INCOMPATIBLE                │
│ 9. GROUPING                  ofertas → producto → presentación   │
│ 10. RANKING                  orden dentro de cada nivel          │
│ 11. ROUTING / SLUG           slug ↔ productId (persistido)       │
└──────────────────────────────────────────────────────────────────┘
```

---

### Etapa 1 — Retrieval

**Responsabilidad única:** traer candidatos de las 9 farmacias.

| | |
|---|---|
| Entrada | `retrievalQuery` (= `cleanQuery(raw)`, **sin cambios**) |
| Salida | `RawOffer[]` |
| Se conserva de v1 | Los 9 adaptadores, `Promise.all`, `sanitizePharmacyUrl`, la caché de retrieval |
| Cambia | Dos campos aditivos: `sourceProductId` (todas las fuentes lo tienen; ninguna se guarda) y `ispRegistration` (Dr. Simi y Farmex ya lo exponen — 14,1 % de las ofertas sin coste de red) |

**No sabe nada de identidad, de la intención ni del ranking.**

---

### Etapa 2 — Canonicalization

**Responsabilidad única:** convertir texto libre en atributos estructurados.
**No decide qué es igual a qué.**

| | |
|---|---|
| Entrada | `RawOffer` |
| Salida | `CanonicalAttributes` (ingredientes, concentración como `ConcentrationEvidence`, forma, cantidad, volumen, marca, fabricante, variante) |
| Se conserva de v1 | `normalizedWords`, `brandHeadTokens`, `parseMeasurements`, `liquidConcentration`, `dosageFormClass`, `unitCountKey`, `combinationKey`, `commercialVariantKey`, `resolveBrandIdentity` |
| Cambia | Salen como **atributos tipados**, no como segmentos de una cadena. `matchKey` deja de ser el vehículo de la identidad y pasa a ser **un artefacto de compatibilidad** que se sigue calculando igual |

Aquí se corrigen dos defectos que hoy no se pueden corregir:

- **el volumen leído como cantidad** (141 ofertas): la lectura correcta ya
  existe en `unitCountKey`; en v2 es la única;
- **el principio activo leído como variante** (65 ofertas): `activeIngredients`
  se resuelve **antes** que la variante, así que un INN reconocido nunca puede
  ser `commercialVariant` — sin depender de que esté en una lista manual.

---

### Etapa 3 — Concept Resolution

| | |
|---|---|
| Entrada | `CanonicalAttributes` |
| Salida | `conceptId` |
| Persistencia | Tabla `concepts` + `concept_signature_aliases` |

```
firma = ingredientes[] + concentración(ratio) + forma + vía
  ├─ ¿la firma ya tiene conceptId?      → recuperar
  ├─ ¿alguna evidencia fuerte (E1) lo resuelve? → recuperar
  ├─ ¿hay un concepto compatible? (mass-only ⊂ ratio, §3.2 del modelo) → recuperar + registrar alias
  └─ si no                              → crear conceptId nuevo
```

Mismo mecanismo que `attachCanonicalIds` (RFC-002) ya usa para `matchKey →
cfm_id`, a la granularidad correcta y con caché en memoria de proceso.

**Nunca mira**: marca, laboratorio, farmacia, precio, stock, bioequivalencia ni
la consulta.

---

### Etapa 4 — Presentation Resolution

| | |
|---|---|
| Entrada | `conceptId` + cantidad + unidad + volumen + envase |
| Salida | `presentationId` |

**Nunca mira**: marca, laboratorio, farmacia ni precio.

Aquí `unitCountKey` **por fin gobierna la identidad**: hoy la lee bien y no
sirve de nada porque `matchKey` la contradice.

---

### Etapa 5 — Commercial Product Resolution

| | |
|---|---|
| Entrada | `presentationId` + marca + variante + fabricante + ISP/GTIN |
| Salida | `productId` |

Orden de evidencia: **E1** (ISP/GTIN iguales ⇒ mismo producto, sin heurística) →
**E3** (marca + variante + fabricante normalizados) → **E5** (heurística de
vocabulario).

**Cambio de política respecto de v1, y es el más importante para la
fragmentación:**

> En v1, `brand:unknown` **nunca** agrupa con una marca conocida, y esa regla
> —correcta cuando la marca *era* la única identidad— produce hoy 9 tarjetas
> para un solo losartán 50 mg x30.
>
> En v2, marca y fabricante ya **no son la identidad**: la identidad es
> `conceptId + presentationId`. La marca solo distingue **productos comerciales
> dentro** de esa presentación. Un `manufacturer: null` deja de ser un motivo
> para partir un concepto; se convierte en un producto comercial "no
> identificado" **dentro** de la misma presentación, comparable con los demás.

Es exactamente lo que hoy no se puede hacer, porque en v1 partir el `brand:`
significa partir la identidad entera.

---

### Etapa 6 — Offer Mapping

| | |
|---|---|
| Entrada | `RawOffer` + `productId` |
| Salida | `Offer` con `offerId` determinista |
| Se conserva de v1 | `toPharmacyPrice`, `effectivePrice`, la semántica de los 4 canales — **sin un solo cambio** |

---

### Etapa 7 — Query Intent

Ver `QUERY_INTENT_V2.md`. Corre **en paralelo** al retrieval, nunca lo
restringe.

---

### Etapa 8 — Relevance Classification

| | |
|---|---|
| Entrada | `QueryIntentV2` + productos resueltos |
| Salida | `EXACT \| COMPATIBLE \| ALTERNATIVE \| UNKNOWN \| INCOMPATIBLE` por producto |

Función **pura**. Sin estado. **No modifica ninguna identidad** — recibe
`conceptId` ya asignado y solo lo compara.

---

### Etapa 9 — Grouping

| Nivel de agrupación | Clave | Qué muestra |
|---|---|---|
| Tarjeta | `productId` | Un producto comercial y todas sus ofertas |
| Grupo | `presentationId` | Todos los productos comerciales de la misma presentación — **acá aparece la comparación que hoy se pierde** |
| Sección | `conceptId` | Presentaciones alternativas del mismo concepto |

Web ya tiene la estructura de dos niveles
(`groupMedicationResultsByMatchKey` + `MedicationGroup.products`): lo que cambia
es **por qué clave agrupa**. Hoy agrupa por `matchKey`, que para un jarabe es el
volumen del frasco — y por eso mete 15 mg/5 mL y 30 mg/5 mL en el mismo grupo
visual mientras separa el mismo producto en 9 tarjetas.

---

### Etapa 10 — Ranking

| | |
|---|---|
| Entrada | grupos + clasificación de relevancia |
| Salida | orden |

**El ranking no puede escribir en ninguna entidad de identidad.** Contrato
verificable con un test: `rank(results)` no altera `conceptId`,
`presentationId`, `productId` ni `offerId` de ninguna entrada.

Se conserva de v1: el precio efectivo como criterio dentro del nivel, y el
límite duro de cohorte que el precio no cruza.

---

### Etapa 11 — Routing / Slug Resolution

| | |
|---|---|
| Entrada | `productId` |
| Salida | slug canónico |

```
/medicamento/{slug-legible}-{productId corto}
```

**El cambio estructural:** el sufijo del slug pasa a ser el **identificador
persistido**, no el hash de una cadena derivada de texto libre.

Consecuencias directas sobre defectos medidos:

| Defecto v1 | Estado en v2 |
|---|---|
| 6 generaciones de fallback | **Congeladas**: siguen resolviendo lo ya emitido, no crece ninguna nueva |
| 4 pares de productos con hash de slug compartido | **Imposibles por construcción** (el ID es único) |
| Resolver vuelve a golpear a las 9 farmacias | Innecesario: `productId` → registro |
| `isConsistentWithSlug` (identidad reimplementada en Web) | Deja de ser necesaria; se conserva mientras haya slugs viejos |
| Título del slug depende de qué farmacia respondió | Desaparece: `canonicalName` es construido |

Es la solución de fondo que CF-WEB-002 ya identificó y dejó como `FOLLOW_UP`:
*"la resolución sigue sin persistencia (…) es la solución de fondo, y es una
decisión de arquitectura"*.

---

## 3. Matriz de responsabilidades — v1 vs v2

| Responsabilidad | v1 | v2 |
|---|---|---|
| Identidad | `matchKey` + `presentationKey` | Etapas 3-6 (registro persistido) |
| Similarity | `matchKey` | Etapa 3 |
| Persistence | `matchKey` (**bloquea la identidad**) | Registro propio; `matchKey` se conserva como alias |
| Grouping | `presentationKey` + `matchKey` (Web) | Etapa 9 |
| Routing | `shortHash(presentationKey)` | Etapa 11 (`productId`) |
| Relevance | `relevance.ts` | Etapa 8 |
| Ranking | `rankByRelevance` | Etapa 10 |
| UX display | `canonicalName` (nombre de una farmacia) + `brandIdentity` | `canonicalName` construido + `brandIdentity` |

**En v1, cuatro columnas apuntan a la misma cadena. En v2, cada una tiene su
dueño.**

---

## 4. Alcance de la implementación (si se aprueba)

**Lo que NO cambia:** los 9 adaptadores (salvo 2 campos aditivos), el contrato
público `MedicationResult[]`, los 4 canales de precio, el pipeline de deploy
(PM-001), `mobile/` en producción.

**Lo que se agrega:** 4 tablas nuevas en Supabase, 4 resolutores, un módulo de
clasificación de relevancia, y el comparador de shadow mode.

**Lo que se congela:** la construcción de `matchKey` y `presentationKey` — se
siguen calculando **exactamente igual** y viajando en la respuesta.
