# CF-SEARCH-010 — Arquitectura actual del motor de búsqueda (v1)

Reconstrucción del pipeline vigente en `origin/main@3a7b5a4`, etapa por etapa,
leída del código y no de la documentación.

---

## 1. Flujo completo

```
rawQuery (usuario)
  │
  ├─ api/src/routes/search.ts :: validateQuery()
  │     └─ parseQueryIntent(raw) ──► { rawQuery, retrievalQuery, terms,
  │                                    concentration, quantity, dosageForm }
  │        · retrievalQuery = cleanQuery(raw)   (normalization.ts)
  │
  ├─ CACHE nivel RESPUESTA   clave = queryIntentCacheKey(intent) [+ farmacias]
  ├─ CACHE nivel RETRIEVAL   clave = retrievalQuery              [+ farmacias]
  │
  ▼
api/src/services/searchService.ts :: searchMedicationsDetailed()
  │
  ├─ Promise.all sobre 9 clientes  ← recibe SOLO retrievalQuery
  │     api/src/clients/{cruzverde,salcobrand,ahumada,drsimi,araucomed,
  │                      ecofarmacias,farmex,sermecoop,easyfarma}.ts
  │     └─► ScrapedProduct[]  { name, price, onlinePrice, cmrPrice, sbpayPrice,
  │                             hasStock, hasOnlineDelivery, onlineUrl,
  │                             imageUrl, brand, manufacturer, isBioequivalent }
  │
  ├─ sanitizePharmacyUrl(slug, url)          api/src/lib/pharmacyDomains.ts
  │
  ├─ toMedicationResult(product, slug, name) packages/domain/src/pricing.ts
  │     ├─ matchKey(name)                    matching.ts
  │     ├─ combinationKey(name)              matching.ts
  │     ├─ commercialVariantKey(name)        productIdentity.ts
  │     ├─ dosageFormClass(name)             productIdentity.ts
  │     ├─ resolveCommercialIdentity(...)    commercialIdentity.ts
  │     ├─ resolveBrandIdentity(...)         brandIdentity.ts
  │     ├─ bioequivalenceKey(...)            commercialIdentity.ts
  │     ├─ presentationKey({...})            commercialIdentity.ts
  │     └─ toPharmacyPrice(...)              pricing.ts   (effective = min(canales))
  │
  ├─ mergeDuplicates(all)                    deduplication.ts
  │     1. agrupa por presentationKey
  │     2. una oferta por farmacia (la más barata)
  │     3. pickCanonicalSlot()  → tarjeta canónica
  │     4. canMergeOffers() contra TODAS las aceptadas
  │          · recomputa matchKey / combination / variant / form /
  │            unitCount / concentration desde productName
  │     5. las rechazadas salen como tarjeta propia
  │
  ├─ .sort(bestPrice ASC)
  ├─ attachCanonicalIds()                    api/src/lib/medicationRegistry.ts (CFM-ID por matchKey)
  ├─ recordPriceHistory()                    api/src/lib/priceHistoryDb.ts     (persiste match_key)
  └─ rankByRelevance(intent, results)        relevance.ts
        · evaluateResultRelevance() por tarjeta → lexicalMatch, concentrationMatch,
          quantityMatch, dosageFormMatch
        · sortKey = [mismatch, cohorteConcentración, cantidad, forma, bestPrice]

  ▼
withTrackedUrls(results, origin)             api/src/lib/clickTracking.ts
  ▼
MedicationResult[]  (array desnudo — contrato público)
  │
  ├─ WEB   groupMedicationResultsByMatchKey()   web/src/lib/groupMedicationResults.ts
  │        splitGroupsByConcentration()
  │        buildMedicationSlug() = slugify(canonicalName) + shortHash(presentationKey)
  │        resolveMedicationBySlug()            web/src/lib/resolveMedication.ts
  │           escalera de recuperación → guardia de identidad → Gen 5/6-bio/4/3/2/1
  │
  └─ MOBILE resolveMedicationCard(results, { presentationKey, matchKey })
           favoritos / carrito / alertas / historial → indexados por matchKey
```

---

## 2. Tabla por etapa

| # | Etapa | Archivo / función | Entrada | Salida | Responsabilidad declarada |
|---|---|---|---|---|---|
| 1 | Limpieza de consulta | `normalization.ts::cleanQuery` | texto crudo | término amplio | Retrieval |
| 2 | Intención | `queryIntent.ts::parseQueryIntent` | texto crudo | `QueryIntent` | Query Intent |
| 3 | Clave de caché | `queryIntent.ts::queryIntentCacheKey` | `QueryIntent` | string | Persistence (caché) |
| 4 | Recuperación | `api/src/clients/*.ts` (9) | `retrievalQuery` | `ScrapedProduct[]` | Retrieval |
| 5 | Saneo de URL | `pharmacyDomains.ts::sanitizePharmacyUrl` | slug + url | url o `null` | Seguridad |
| 6 | Precio efectivo | `pricing.ts::toPharmacyPrice` | `ScrapedProduct` | `PharmacyPrice` | Canonicalization (precio) |
| 7 | Identidad farmacológica | `matching.ts::matchKey` | nombre | `marca\|dosis\|turno\|cantidad` | **Identidad + Similarity + Persistence + Grouping** |
| 8 | Combinación | `matching.ts::combinationKey` | nombre | 2º principio activo o `null` | Identidad |
| 9 | Variante comercial | `productIdentity.ts::commercialVariantKey` | nombre | token o `null` | Identidad |
| 10 | Forma farmacéutica | `productIdentity.ts::dosageFormClass` | nombre | clase gruesa o `null` | Identidad + Query Intent |
| 11 | Cantidad por envase | `productIdentity.ts::unitCountKey` | nombre | `N` o `null` | Identidad (fuera de la clave) |
| 12 | Concentración líquida | `productIdentity.ts::liquidConcentration` | nombre | `Concentration` o `null` | Identidad (fuera de la clave) |
| 13 | Marca/laboratorio (identidad) | `commercialIdentity.ts::resolveCommercialIdentity` | campos + url + matchKey | token o `unknown` | Identidad |
| 14 | Marca/laboratorio (display) | `brandIdentity.ts::resolveBrandIdentity` | nombre + campos | `brand`/`manufacturer`/`activeIngredient` | UX display |
| 15 | Clave de presentación | `commercialIdentity.ts::presentationKey` | los ejes anteriores | string concatenado | **Identidad + Grouping + Routing** |
| 16 | Deduplicación | `deduplication.ts::mergeDuplicates` | `MedicationResult[]` | `MedicationResult[]` | Grouping + Identidad |
| 17 | Registro canónico | `medicationRegistry.ts::attachCanonicalIds` | resultados | `cfmId` | Persistence |
| 18 | Histórico | `priceHistoryDb.ts::recordPriceHistory` | resultados | escritura Supabase | Persistence |
| 19 | Relevancia y orden | `relevance.ts::rankByRelevance` | intent + resultados | resultados anotados y ordenados | Relevance + Ranking |
| 20 | Agrupación Web | `groupMedicationResults.ts` | resultados | `MedicationGroup[]` | Grouping (UI) |
| 21 | Slug | `medicationSlug.ts::buildMedicationSlug` | tarjeta | `nombre-hash` | Routing |
| 22 | Resolución de ficha | `resolveMedication.ts::resolveMedicationBySlug` | slug | tarjeta o 404 | Routing + Retrieval + Identidad |

---

## 3. Dónde se mezclan responsabilidades

Esta es la observación central de la auditoría. El motor v1 **no tiene once
capas: tiene cuatro funciones que hacen once cosas.**

### 3.1 `matchKey()` — cuatro responsabilidades en una cadena

| Responsabilidad | Cómo la ejerce | Consecuencia |
|---|---|---|
| **Identidad** | Es el primer segmento de `presentationKey` | Un error acá se propaga a la identidad completa |
| **Similarity** | Es la clave de agrupación visual de Web (`groupMedicationResultsByMatchKey`) | Dos concentraciones distintas quedan en el mismo grupo visual |
| **Persistence** | Es la PK lógica de `price_history`, `pharmacy_clicks`, `email_alerts`, `medication_match_key_aliases` | **No se puede cambiar**, y por eso todos los fixes posteriores tuvieron que ir por fuera |
| **Grouping** | Vía `presentationKey`, decide qué ofertas comparten tarjeta | — |

La consecuencia es estructural, no estética: **`matchKey` está congelado por su
rol de persistencia, y a la vez es la base de la identidad.** Los seis fixes
recientes existen todos por esta razón. Ninguno pudo corregir el error donde
estaba; todos tuvieron que agregar un eje paralelo.

Y el error está ahí. `matchKey("Ambroxol 30 mg/5 mL Jarabe 100 mL")` devuelve
`ambroxol|100ml`: **prioriza el mililitro sobre el miligramo y toma el mayor
(`Math.max`), así que conserva el volumen del frasco y descarta la
concentración** (`matching.ts:108-117`). La "identidad farmacológica" de todo
jarabe es hoy el tamaño de su envase.

### 3.2 `presentationKey()` — identidad y ruteo en la misma cadena

```ts
matchKey|bio:<x>|brand:<y>[|combo:<z>][|var:<v>][|form:<f>]
```

Es simultáneamente:

- la clave de agrupación de `mergeDuplicates`;
- el input de `shortHash()` que genera el sufijo del slug de ficha en Web.

Por eso **cada mejora de identidad rompe URLs indexadas**, y por eso
`web/src/lib/resolveMedication.ts` acumula hoy **seis generaciones de fallback**
(Gen 1, Gen 2, Gen 3, Gen 4, Gen 5, Gen 6-bio). El acoplamiento identidad↔ruteo
convirtió cada corrección en una migración de SEO.

Y la clave **no identifica un producto**: por diseño, `mergeDuplicates` puede
emitir dos tarjetas con la misma `presentationKey` cuando difieren en cantidad o
concentración, porque esos dos ejes se dejaron fuera de la clave para no rotar
slugs (CF-SEARCH-001 §10.4, CF-SEARCH-003 §8). Medido hoy: **4 pares de
productos distintos comparten hash de slug**, en 12 ocurrencias sobre las 16
consultas (ver `CURRENT_METRICS.md` §5).

### 3.3 `dosageFormClass()` — identidad y query intent

La misma función clasifica la forma del **nombre del producto** (eje `|form:` de
la identidad) y la del **texto de la consulta** (`queryIntent.ts:135`). Es
reutilización correcta de una regla, pero significa que un cambio pensado para
mejorar el parsing de consultas rota `presentationKey` y, con él, los slugs.

### 3.4 `resolveMedicationBySlug()` — ruteo que vuelve a hacer retrieval

Para resolver una ficha, Web **vuelve a golpear a las 9 farmacias** con una
consulta reconstruida del slug, y aplica seis generaciones de hash más una
guardia de compatibilidad. No hay ninguna tabla que traduzca URL → producto. El
propio CF-WEB-002 lo deja como `FOLLOW_UP`: *"la resolución sigue sin
persistencia (…) es la solución de fondo, y es una decisión de arquitectura"*.

### 3.5 Dos taxonomías de marca conviviendo

CF-DATA-001 introdujo `resolveBrandIdentity` (marca/fabricante/principio activo,
**para mostrar**) y conservó `resolveCommercialIdentity` (**para identificar**),
alimentado por `legacyLaboratoryValue()` = `manufacturer ?? brand`. La
separación fue deliberada y correcta —congelar la identidad mientras mejora la
presentación— pero deja el sistema con **dos verdades sobre la marca**: la que
se muestra y la que agrupa. Hoy `brand:` sigue alimentándose del valor viejo,
con su defecto incluido.

---

## 4. Qué NO existe en v1

| Concepto del EDM | Estado en v1 |
|---|---|
| Concepto Farmacéutico (CFM-CONCEPT-ID) | No existe. Lo más cercano es `matchKey`, que mezcla concepto, presentación y volumen |
| Presentación Farmacéutica (CFM-PRESENTATION-ID) | No existe. `unitCount` y el volumen se leen pero no forman identidad |
| Producto Medicinal Comercial (CFM-PRODUCT-ID) | No existe. `presentationKey` se le aproxima, pero es una cadena derivada de texto libre, no una entidad |
| Oferta (CFM-OFFER-ID) | No existe como entidad identificada. `PharmacyPrice` es su proyección, sin identidad propia ni `capturedAt` estable |
| Concentración estructurada | **Existe** (`Concentration`, `concentration.ts`) pero **no participa de ninguna clave de identidad** |
| Vía de administración | No existe |
| Unidad farmacéutica | No existe como campo; está implícita en `dosageFormClass` |
| Registro ISP | No se captura en ningún adaptador |
| Código ATC | No existe |
| Volumen de envase | Se lee (`parseMeasurements`) pero solo para desambiguar concentración |

El `Nombre Canónico` del EDM tampoco existe: `canonicalName` es el nombre crudo
de una de las farmacias, elegido por heurística de longitud.
