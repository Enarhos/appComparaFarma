# CF-SEARCH-010 — Arqueología de la capa de identidad

Reconstrucción de cómo llegó el motor a su forma actual. **Ninguno de estos
cambios fue un error.** Cada uno resolvió un defecto real, verificado contra
producción, con evidencia medida y tests. El objetivo de esta sección es
explicar **cómo creció la complejidad**, no criticar las decisiones.

Fuentes: `git log` sobre `packages/domain/src/`, `docs/technology/domain/*.md`,
`docs/qa/{search-product-identity,cf-search-003,cf-web-002,cf-data-001}/`.

---

## 1. Línea de tiempo

| # | Cambio | Commit / PR | Fecha | Capa modificada |
|---|---|---|---|---|
| 0 | Motor original | `c9a76fc` | 2026-06-29 | `matchKey` + `mergeDuplicates` |
| 1 | FASE 1 — identidad comercial (`presentationKey`) | `e75ca5b` | 2026-08-18 | `commercialIdentity.ts` (nuevo) |
| 2 | FASE P1 — hardening de plausibilidad | `73a0240` | 2026-08-18 | `commercialIdentity.ts` |
| 3 | S-1 — combinaciones (`\|combo:`) | `6c43fb8`, `3c547e7` / PR #128 | 2026-08-27 | `matching.ts` (`combinationKey`) |
| 4 | **CF-SEARCH-001** — variante comercial + forma (`\|var:`, `\|form:`) | `e37d2ae` / PR #132 | 2026-08-27 | `productIdentity.ts` (nuevo), `deduplication.ts` |
| 5 | **CF-SEARCH-002** — Query Intent y relevancia | `61998b4`, `ab73f95` / PR #133 | 2026-08-28 | `queryIntent.ts`, `relevance.ts` (nuevos) |
| 6 | BIOEQUIVALENCE-DATA-QUALITY-01 pasos 1-2 | `db131e2`, `bcedf0a` / PR #141 | 2026-08-30 | 9 adaptadores + Gen 6-bio en Web |
| 7 | **Quantity mismatch** (`unitCountKey`) | `323f32c` / merge `48a7de5` | 2026-08-30 | `productIdentity.ts`, `deduplication.ts` |
| 8 | **CF-QA-001** — campaña de QA (10 hallazgos) | `e09f9e2` | 2026-08-31 | (ninguna — solo evidencia) |
| 9 | **CF-SEARCH-003** — concentración en líquidos | `52cede1` / PR #147 | 2026-08-31 | `concentration.ts` (nuevo), `productIdentity.ts` |
| 10 | **CF-WEB-002** — resolución de ficha | `dbf05d6` / PR #148 | 2026-08-31 | `web/src/lib/resolveMedication.ts` |
| 11 | **CF-DATA-001** — marca / fabricante / principio activo | `ea18ef0` / PR #149 | 2026-08-31 | `brandIdentity.ts` (nuevo), 9 adaptadores |

**Once cambios en catorce días, todos sobre la misma superficie.**

---

## 2. Tabla de arqueología

| Cambio | Síntoma que resolvía | Capa modificada | Regla nueva introducida | Qué solucionó | Riesgo que dejó abierto | Interacción con reglas posteriores |
|---|---|---|---|---|---|---|
| **1. FASE 1 — `presentationKey`** | Omeprazol 20mg x30 de Ascend / OPKO / CuraeSpring se fusionaban en una tarjeta con "ahorro" falso | `commercialIdentity.ts` | `presentationKey = matchKey\|bio:\|brand:`; **`unknown` nunca agrupa con marca conocida** | Separó laboratorios distintos bajo el mismo `matchKey` | La política conservadora fragmenta el catálogo: 5 de 9 farmacias nunca entregan marca ⇒ quedan aisladas. `bio:` entra a la identidad sin ser identidad | Es la raíz de la fragmentación que CF-QA-001 mide (90,5 % de tarjetas con una farmacia) y que el paso 7 de BIOEQ-01 quiere revertir |
| **2. FASE P1 — plausibilidad** | Ruido de URL y campos estructurados sucios convertidos en "marca": `detalleproducto`, `chile`, `100ml`, `recubiertos`, el propio principio activo | `commercialIdentity.ts` | `isPlausibleCommercialIdentity()` con 6 categorías de rechazo + `KNOWN_ACTIVE_INGREDIENTS` + whitelist de hosts | Eliminó ~34 % de identidades comerciales inválidas | Las listas son manuales y evidenciadas caso a caso: crecen con cada auditoría | `KNOWN_ACTIVE_INGREDIENTS` se convierte en dependencia de `productIdentity.ts` (cambio 4), que necesita un **superset** propio |
| **3. S-1 — `\|combo:`** | "Losartán 50mg" y "Losartán + HCTZ 50/12,5mg" compartían `matchKey` y se fusionaban — riesgo clínico | `matching.ts` | `combinationKey()`: ingrediente adyacente a `+`/`/`, o 2º token del encabezado si hay razón masa/masa | Separó monofármaco de combinación | Solo captura el **segundo** ingrediente; sinónimos del mismo ingrediente derivan tokens distintos | Obligó a `PRESENTATION_FORM_WORDS` (lista paralela a `STOP_WORDS`, que no se puede tocar). `commercialVariantKey` tuvo que **desactivarse por completo** cuando `combinationKey != null` |
| **4. CF-SEARCH-001 — `\|var:` + `\|form:`** | Tapsin Rojo/Forte/Periodo/Duo/Migraña/Instaflu, todos de Maver, en una tarjeta | `productIdentity.ts`, `deduplication.ts` | `commercialVariantKey()` (UN token tras la cabecera), `dosageFormClass()` (8 clases gruesas), `canMergeOffers()`, integridad canónica | Eliminó los falsos merges de variante; garantizó que el título salga de una oferta mostrada | `var:` derivado de texto libre; **`null` no es comodín** ⇒ falsos splits aceptados. `\|form:` presente en la mayoría del catálogo ⇒ **rota el slug de casi todas las fichas** | Forzó **Gen 5** en Web. Su `COMPOSITION_TOKENS` es un superset manual de `KNOWN_ACTIVE_INGREDIENTS` (cambio 2) que hoy **no incluye `ambroxol`** — ver §3.1 |
| **5. CF-SEARCH-002 — Query Intent** | `q=omeprazol` devolvía esomeprazol; `ibuprofeno 200/400/600 mg` devolvían la misma respuesta cacheada | `queryIntent.ts`, `relevance.ts` | `Concentration` estructurada; `lexicalMatch`; cohorte `concentrationMatch`; caché de 2 niveles | Separó por primera vez retrieval de relevancia | La cohorte de concentración es un **límite duro** que el precio no cruza. Si la concentración de la consulta se lee mal, hunde los resultados correctos | Reutiliza `dosageFormClass` de la capa de **identidad** para clasificar la **consulta** ⇒ acopla query intent con `presentationKey` |
| **6. BIOEQ-01 pasos 1-2** | 9 adaptadores afirmaban `false` donde la farmacia no informaba; Salcobrand marcaba bioequivalentes a los referentes | 9 adaptadores + Web | `isBioequivalent: boolean \| null` real por fuente | Eliminó una afirmación falsa sobre 4 de cada 5 tarjetas | El valor de `\|bio:` cambió en el **81,7 %** de las tarjetas ⇒ rotación masiva de slugs | Forzó **Gen 6-bio**, que es *permisiva por diseño* (acepta otro valor de `\|bio:`) — CF-WEB-002 la registra como riesgo latente |
| **7. Quantity mismatch — `unitCountKey`** | `matchKey` normaliza `qty=1` a vacío y no reconoce `supositorios`/`tabs`/`caps` | `productIdentity.ts` | `unitCountKey()` con 3 estados (`1`/`N`/`null`); `isCompatibleUnitCount` asimétrico | Red de seguridad contra "1 sobre vs caja de 6" | **Delta 0 sobre datos reales**: red de seguridad para un fallo que hoy no ocurre. Introdujo QA-SEARCH-008 (cantidades falsas en 3 patrones) | Se dejó **fuera de `presentationKey`** para no rotar slugs ⇒ nace la clase de defecto "dos tarjetas con la misma clave" |
| **9. CF-SEARCH-003 — concentración** | 5 (luego 7) tarjetas mezclaban 15 mg/5 mL con 30 mg/5 mL | `concentration.ts`, `productIdentity.ts` | `liquidConcentration()` en 2 niveles de evidencia; `isCompatibleConcentration`; validación contra **todas** las ofertas aceptadas | Eliminó los 7 falsos merges, 0 falsos splits | **Explícitamente NO se agregó a `presentationKey`** (§8: rotaría 23,4 % de las URLs). Consecuencia declarada: dos tarjetas con la misma clave y el mismo slug | Es la causa directa de la colisión de slug que CF-WEB-002 tuvo que resolver 24 horas después |
| **10. CF-WEB-002 — ficha** | 14,6 % de enlaces no resolvían; 3 resolvían a **otro producto** en silencio | `web/src/lib/resolveMedication.ts` | Escalera de recuperación; guardia de identidad reutilizando `isCompatible*`; desempate por parte legible | 80,5 % → 99,2 % de resolución; wrong-product 0 | La resolución **sigue sin persistencia**: cada ficha vuelve a golpear a las 9 farmacias. Soft-404 sin resolver | Tuvo que reimplementar en Web la compatibilidad de identidad del dominio, porque el hash ya no identifica |
| **11. CF-DATA-001 — marca** | Salcobrand publicaba marca como laboratorio (83,5 %); Cruz Verde tenía un mapeo muerto; 5 farmacias siempre `null` | `brandIdentity.ts`, 9 adaptadores | `brand`/`manufacturer`/`activeIngredient`/`brandSource`; vocabulario de composición derivado algorítmicamente | +130 tarjetas identificadas, 0 cambios de agrupación | Deja **dos taxonomías de marca** conviviendo: `legacyLaboratoryValue()` alimenta la identidad con el valor viejo y su defecto | La identidad se congeló a propósito. La calidad mejora en la UI pero **no** en `brand:`, que sigue fragmentando |

---

## 3. El patrón: seis ejes que no pueden vivir donde deben

Todos los cambios 3-11 comparten la misma forma:

1. Se encuentra un defecto de identidad.
2. **La corrección natural sería arreglar `matchKey`.**
3. `matchKey` está persistido en cuatro tablas ⇒ prohibido.
4. Se agrega un eje **paralelo**.
5. El eje se pone **dentro** de `presentationKey` (y rota slugs) o **fuera**
   (y crea tarjetas con clave duplicada).
6. Web acumula una generación de fallback más, o una guardia más.

Resultado hoy:

| Eje | ¿Dentro de `presentationKey`? | Consecuencia |
|---|---|---|
| `matchKey` | sí (es la base) | congelado por persistencia |
| `bio:` | sí | rotó 81,7 % de slugs (Gen 6-bio) |
| `brand:` | sí | fragmenta: 72,5 % de ofertas sin dato estructurado |
| `combo:` | sí | rotó solo combinaciones (Gen 3) |
| `var:` | sí | rotó casi todo (Gen 4→5) |
| `form:` | sí | rotó casi todo (Gen 4→5) |
| `unitCount` | **no** | tarjetas distintas con la misma clave |
| `concentration` | **no** | tarjetas distintas con la misma clave **y el mismo slug** |

**Ninguna elección fue mala. La estructura obliga a elegir entre dos daños.**

### 3.1 Ejemplo concreto de interacción entre reglas

`COMPOSITION_TOKENS` (`productIdentity.ts:132`) existe para que un principio
activo escrito **después** de la marca no se lea como variante comercial
("Glucophage **Metformina** 500 mg" → `null`, no `var:metformina`). Es un
superset manual de `KNOWN_ACTIVE_INGREDIENTS` (introducida en el cambio 2) más
19 tokens observados en las 9 búsquedas del 2026-08-27.

**`ambroxol` no está en esa lista** — no aparecía en aquel corpus. Efecto medido
hoy sobre el corpus de esta auditoría: **65 ofertas (23 nombres distintos)
derivan `var:ambroxol`** y quedan separadas de la misma presentación listada por
una farmacia que no repite el principio activo:

```
farmex     "Muxol Jarabe adulto Ambroxol 30 mg / 5 mL x 100 mL"  → var:ambroxol
araucomed  "Muxol Adulto 30mg/5ml jarabe 100ml"                  → var:null
```

Mismo producto, dos tarjetas, sin comparación de precio. No es un bug de
CF-SEARCH-001: es el comportamiento correcto de una regla cuyo vocabulario se
alimenta por observación, aplicada a una molécula que nadie había observado. **Y
volverá a pasar con la siguiente molécula.**

### 3.2 Un defecto de `matchKey` que ningún fix pudo tocar

`QUANTITY_PATTERN` (`matching.ts:84`) lee `x <n>` sin exigir que el sustantivo
siguiente sea una unidad contable. En un jarabe, `"x 100 ml"` se lee como
**100 unidades**:

```
"Ambroxol 30mg/5ml Jarabe Adulto x 100 ml. (Hospifarma)"  → ambroxol|100ml|100
"Ambroxol 30mg/5ml Jarabe Adulto 100 ml. (Mintlab)"       → ambroxol|100ml
```

Medido: **141 ofertas (78 nombres distintos)** del corpus tienen su volumen de
envase leído como cantidad de unidades por `matchKey`.

`unitCountKey()` (cambio 7) corrigió exactamente esto —tiene `MEASURE_UNITS` y
devuelve `null` en los 141 casos— pero **no puede corregir `matchKey`**, que es
quien alimenta la identidad y la agrupación visual de Web. El fix existe, es
correcto, y no sirve para este caso porque está en la capa equivocada.

---

## 4. Coste acumulado, en números del propio repositorio

| Indicador | Valor |
|---|---|
| Módulos nuevos en `packages/domain` en 14 días | 5 (`commercialIdentity`, `productIdentity`, `queryIntent`, `relevance`, `concentration`, `brandIdentity`) |
| Ejes de identidad derivados de texto libre | 8 |
| Listas de vocabulario manual coexistiendo | 9 (`STOP_WORDS`, `PRESENTATION_FORM_WORDS`, `SALT_QUALIFIER_WORDS`, `VARIANT_QUALIFIER_WORDS`, `COMPOSITION_TOKENS`, `EXTRA_VARIANT_NOISE`, `UNIT_COUNT_NOUNS`, `MEASURE_UNITS`, `NOISE_PHRASES`) |
| Generaciones de slug en Web | 6 |
| Tests en `@comparafarma/domain` | 379 (16 archivos) — **todos verdes** |
| Tarjetas con dos concentraciones fusionadas | 0 |
| Tarjetas que comparan una sola farmacia | **89,6 %** |

La última fila es la que importa: **el motor dejó de cometer falsos merges y
pasó a cometer falsos splits**. Es el trade-off elegido explícitamente y por
buenas razones ("un duplicado visual es menos grave que mezclar precios de dos
medicamentos distintos"), pero el resultado es que **9 de cada 10 tarjetas no
comparan nada**, en un producto cuya promesa central es comparar precios.
