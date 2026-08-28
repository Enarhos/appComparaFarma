# Identidad de Producto y Deduplicación Segura (CF-SEARCH-001)

**Estado:** vigente · **Fecha:** 2026-08-27 · **Alcance:** `packages/domain`, `api`, `web`, `mobile`

Documento de diseño de la capa de identidad de producto: cómo se decide que dos ofertas de dos farmacias distintas son el MISMO artículo comercial, y qué garantías de integridad tiene una tarjeta fusionada.

> **Ubicación de este documento.** El ticket pedía `docs/engineering/CF-SEARCH-001-PRODUCT-IDENTITY.md`. Se publica en `docs/technology/domain/` porque ahí ya viven las dos fuentes canónicas del mismo tema — `NORMALIZATION_AND_DEDUPLICATION.md` (`cleanQuery`/`matchKey`/`mergeDuplicates`) y `COMMERCIAL_IDENTITY.md` (`resolveCommercialIdentity`/`presentationKey`) — y `docs/engineering/` no existe en el repositorio. Crear un árbol paralelo habría dejado el mismo dominio documentado en dos lugares, que es justamente lo que prohíbe `CLAUDE.md` §8.

---

## 1. Problema

Buscar "Tapsin" mostraba **una sola tarjeta** que agrupaba productos comerciales distintos y, por lo tanto, un "ahorro" que no existe. Verificado contra producción real (`GET https://comparafarma-api.vercel.app/api/search?q=tapsin`, read-only, 2026-08-27):

| `presentationKey` | Ofertas agrupadas | Precio |
|---|---|---|
| `tapsin\|n\|6\|bio:false\|brand:unknown` | EcoFarmacias "Tapsin X 6 comprimidos Noche (Maver)" | $460 |
| | Ahumada "Tapsin Instaflu Día Noche 6 Comprimidos" | $4.139 |
| `tapsin\|12\|bio:false\|brand:unknown` | EcoFarmacias "Tapsin X 12 comprimidos (Maver)" | $1.290 |
| | Ahumada "Tapsin Periodo x 12 Comprimidos" | $2.149 |
| | Cruz Verde "Tapsin Duo Paracetamol Ibuprofeno 12 Comprimidos" | $2.290 |
| `tapsin\|30\|bio:false\|brand:maver` | AraucoMed "Tapsin Forte x 30 comprimidos" | $2.990 |
| | Farmex "Tapsin Migraña x 30 comprimidos" | $4.990 |
| `tapsin\|1000mg\|20\|bio:false\|brand:maver` | Farmex "Tapsin 1000 SC 1 g x 20 **comprimidos**" | $4.895 |
| | AraucoMed "Tapsin Polvo efervescente limón 1g x20 **sobres**" | $5.990 |
| | Dr. Simi "Tapsin SC ... 20 **sobres** polvo para solución oral" | $7.880 |

Tapsin Rojo, Forte, Periodo, Duo, Migraña, M, Instaflu, Niños y Nocturno son **medicamentos distintos** con composiciones distintas. Mostrarlos como una sola tarjeta con "el más barato" es un riesgo clínico, no un problema estético.

El caso que dispara el ticket ("Tapsin x 6 Comprimidos" de EcoFarmacias vs "Tapsin Rojo Dolor de Cabeza tira x 6" de AraucoMed) es la misma clase de defecto.

---

## 2. Causa raíz

Son **dos defectos independientes**. Confundirlos fue lo que mantuvo el problema abierto.

### 2.1 Identidad — el modelo descarta el calificador comercial

`matchKey()` (`packages/domain/src/matching.ts`) conserva **un solo token de nombre**: el primer `brandWord`. Todo lo que viene después se descarta.

```
"Tapsin X 6 Comprimidos (Maver)"                   → tapsin|6
"Tapsin Rojo Dolor de Cabeza Tira x 6 comprimidos" → tapsin|6
```

`presentationKey = matchKey + bio + brand` agregaba dos ejes, pero **ninguno discrimina dentro de una familia de marca**:

- `bio:` — igual para todas las variantes de Tapsin (`false`).
- `brand:` — `resolveCommercialIdentity` resuelve el **laboratorio**, que es Maver para *todas* las variantes de Tapsin.

Resultado: en cuanto dos farmacias coinciden en dosis y cantidad, cualquier par de variantes comerciales del mismo fabricante colapsa. La separación que se observaba a veces era **accidental**: dependía de que una farmacia entregara `laboratory` y la otra no (`brand:maver` vs `brand:unknown`).

Ese accidente quedó congelado en un test existente que pasaba por la razón equivocada — ver §9.

### 2.2 Navegación — `matchKey` dejó de ser único y Mobile seguía navegando por él

Desde FASE 1 (2026-08-19) `mergeDuplicates` agrupa por `presentationKey`, así que **varias tarjetas de una misma búsqueda pueden compartir `matchKey`**. Mobile no se actualizó:

```ts
// mobile/src/components/MedicationListItem.tsx (antes)
router.push({ pathname: "/medication", params: { matchKey } });
// mobile/src/app/medication.tsx (antes)
const medication = results.find((r) => r.matchKey === key);
```

`find` devuelve la **primera** coincidencia y la lista viene ordenada por precio ascendente ⇒ tocar cualquier tarjeta abría siempre **la más barata** con ese `matchKey`.

Reproducción exacta del síntoma reportado ("AraucoMed navega a EcoFarmacias"):

```
ecofarmacias "Tapsin X 6 Comprimidos (Maver)"                $460  matchKey tapsin|6
araucomed    "Tapsin Rojo Dolor de Cabeza Tira x 6 comprim." $500  matchKey tapsin|6
```

Tocar la tarjeta de AraucoMed abría la ficha de EcoFarmacias, y el CTA llevaba a `ecofarmacias.cl`.

**No hay contaminación de URLs entre farmacias.** Se verificó cada `onlineUrl` de la respuesta de producción: los 9 hosts corresponden siempre a su propia farmacia (§7). AraucoMed y EcoFarmacias tampoco comparten plataforma de ecommerce (PrestaShop vs WordPress/WooCommerce) ni hay redirect HTTP entre ambas.

### 2.3 Integridad de oferta — el nombre de la tarjeta podía venir de una oferta descartada

Defecto adicional, encontrado al reproducir lo anterior. `mergeDuplicates` hacía **dos selecciones independientes**:

1. `canonical` (nombre, laboratorio, bioequivalencia, imagen) recorriendo **todo el grupo**.
2. `prices` quedándose con la oferta **más barata de cada farmacia**.

La oferta que aportaba el nombre podía no estar entre los precios mostrados. En producción:

```
presentationKey tapsin|12|bio:false|brand:maver
  título mostrado : "Tapsin Duo x 12 comprimidos"
  precios mostrados: araucomed "Tapsin Periodo x 12 comprimidos." $1.490
                     farmex    "Tapsin Periodo x 12 comprimidos"  $1.890

presentationKey tapsin|5000mg|n|bio:false|brand:maver
  título mostrado : "Tapsin InstaFLU noche 1 sobre polvo ... 5 g"
  precios mostrados: farmex  "Tapsin Caliente Noche - Sabor Limón..."
                     dr-simi "Tapsin caliente compuesto noche..."
```

Esto también explica la deriva de `canonicalName` entre búsquedas que ya estaba documentada como causa del redirect loop de `web/src/lib/resolveMedication.ts`.

---

## 3. Algoritmo anterior

```
ScrapedProduct
  └─ matchKey(name)              → primer brandWord | dosis | turno | cantidad
  └─ resolveCommercialIdentity() → marca/laboratorio normalizado, o "unknown"
  └─ combinationKey(name)        → segundo principio activo (S-1), o null
        ↓
presentationKey = matchKey|bio:<x>|brand:<y>[|combo:<z>]
        ↓
mergeDuplicates: agrupa por presentationKey
                 → canonical  = mejor del GRUPO   (heurística nombre/laboratorio)
                 → prices     = más barata por FARMACIA
                 → imageUrl   = primera no-null del GRUPO
```

---

## 4. Algoritmo nuevo

Cinco capas explícitamente separadas (`packages/domain`):

| Capa | Dónde vive | Qué hace |
|---|---|---|
| 1. Normalización textual | `matching.ts::normalizedWords()` | sin acentos, minúsculas, guiones intra-palabra colapsados |
| 2. Extracción de atributos | `matching.ts` (dosis/cantidad/turno/combinación), `productIdentity.ts` (variante/forma), `commercialIdentity.ts` (marca) | atributos independientes y testeables por separado |
| 3. Identidad | `commercialIdentity.ts::presentationKey()` + `productIdentity.ts::ProductIdentity` | clave determinista de SAME_PRODUCT |
| 4. Similaridad | `matching.ts::matchKey()` — **sin cambios** | candidatos "farmacológicamente parecidos"; agrupación de Web |
| 5. Deduplicación | `deduplication.ts::mergeDuplicates()` | agrupa por identidad **y valida compatibilidad antes de fusionar** |

Clave resultante (segmentos opcionales, siempre en este orden):

```
matchKey|bio:<x>|brand:<y>[|combo:<z>][|var:<v>][|form:<f>]

tapsin|6|bio:false|brand:maver|form:solid-oral                → Tapsin x 6 (EcoFarmacias)
tapsin|6|bio:false|brand:maver|var:rojo|form:solid-oral       → Tapsin Rojo x 6 (AraucoMed)
```

`matchKey` **no cambió**: su valor está persistido en `price_history`, `medication_match_key_aliases`, `pharmacy_clicks` y `email_alerts`, y cambiarlo invalidaría los históricos. Se repite el patrón aditivo que ya usó S-1 con `|combo:`.

### 4.1 `commercialVariantKey(name)` — variante comercial

Devuelve **un** token: el primer calificador significativo después de la cabecera de marca que ya consume `matchKey`. `null` si el nombre no declara ninguno.

- La cabecera se obtiene de `brandHeadTokens()`, **la misma función que usa `matchKey`**. Deducirla por separado rompía "Trio Val" vs "Trio-Val" (el guión colapsa a un token y el espacio no).
- Se **corta** en el primer atributo numérico (dosis o cantidad). Sin ese corte, el laboratorio del final del título se convertía en variante: `"Salbutamol 100 mcg/Dosis x 200 Dosis Aerosol ... FAES FARMA CHILE"` → `var:faes`.
- Un número **suelto** no corta: `"Tapsin 1000 SC 1 g x 20 comprimidos"` → `var:sc`.
- Se descartan: paréntesis y corchetes (laboratorio: `(Maver)`, `(Ascend)`, `(B)`), formas farmacéuticas y sus abreviaturas, sales/ésteres, unidades escritas en palabras, estado del envase (`DESCUENTO`, `caja arrugada`), y **principios activos** (`"Glucophage Metformina 500 mg"` → `null`, no `var:metformina`).
- Se **re-habilitan** palabras que `STOP_WORDS` descarta pero que sí son calificadores: `forte`, `plus`, `infantil`, `pediatrico`, `nino`. (`STOP_WORDS` no se puede tocar: alimenta a `matchKey`.)
- Alias explícitos de sinónimos observados: `ninos`/`nino`/`pediatrico`/`inf` → `infantil`.
- Devuelve `null` para **combinaciones**: lo que sigue a la marca son los otros principios activos, no una variante; `|combo:` ya las separa.

**Por qué un solo token y no el conjunto de palabras.** Cada farmacia escribe una cola distinta para el mismo producto ("Tapsin Caliente Noche - Sabor Limón - Sobre de 5 g" en Farmex vs "Tapsin caliente compuesto noche polvo para solución oral 5 g" en Dr. Simi). Exigir el conjunto completo partía productos idénticos; el primer calificador (`caliente`) es el que ambas comparten. Y un token alcanza para separar todos los falsos merges observados: `rojo`, `instaflu`, `periodo`, `duo`, `forte`, `migrana`, `m`.

**Por qué la ausencia no es comodín.** `null` no agrupa con un calificador conocido. Es la misma política conservadora que `brand:unknown` en `COMMERCIAL_IDENTITY.md`, y es exactamente lo que separa "Tapsin X 6 Comprimidos" de "Tapsin Rojo Dolor de Cabeza Tira x 6".

### 4.2 `dosageFormClass(name)` — forma farmacéutica

Clases **gruesas**: `solid-oral`, `fluid-oral`, `topical`, `injectable`, `inhaled`, `ophthalmic`, `suppository`, `patch`. `null` si el nombre no la declara.

Dos decisiones que salieron de medir contra datos reales, no de la teoría:

1. **El envase manda sobre su contenido.** `solid-oral` se evalúa antes que `fluid-oral`: "Omeprazol 20 mg x 30 **cápsulas** con **gránulos** con recubrimiento entérico" es una cápsula. Con el orden inverso dejaba de agrupar con "Omeprazol 20 mg x 30 cápsulas" de AraucoMed.
2. **Polvos y líquidos orales comparten clase.** Un "polvo para suspensión oral" y una "suspensión" son el mismo artículo descrito desde distinto ángulo (Dr. Simi vs Salcobrand, amoxicilina 250mg/5ml 60 mL). Separarlos era un falso split; separar sólidos de no-sólidos (comprimidos vs sobres de Tapsin 1 g) es el split correcto que este eje aporta.

**No** distingue submodificadores dentro de una clase (`recubierto`, `masticable`, `dispersable`, `efervescente`): cada farmacia los escribe o los omite a discreción — es la regresión que S-1 ya documentó con "Hyzaar ... Comprimidos Recubiertos".

---

## 5. Reglas de identidad

Dos ofertas son el mismo producto solo si coinciden en **todos** estos ejes:

| Eje | Fuente | Regla |
|---|---|---|
| Principio activo / marca / dosis / cantidad / turno | `matchKey` | igualdad estricta |
| Bioequivalencia | `isBioequivalent` | igualdad estricta (`true`/`false`/`unknown` nunca se mezclan) |
| Marca / laboratorio | `resolveCommercialIdentity` | igualdad estricta; `unknown` nunca agrupa con conocida |
| Segundo principio activo (combinación) | `combinationKey` | igualdad estricta |
| **Variante comercial** | `commercialVariantKey` | igualdad estricta, incluida la ausencia |
| **Forma farmacéutica** | `dosageFormClass` | `null` compatible con cualquiera; dos clases conocidas y distintas, incompatibles |

El laboratorio **no** se usa como señal adicional de exclusión: ya está en `brand:`, y la auditoría Losartán/Laboratorio Chile mostró que las fuentes reportan laboratorios inconsistentes para el mismo artículo (genéricos y bioequivalentes). Tratarlo como evidencia fuerte de "producto distinto" generaría falsos splits.

---

## 6. Reglas de deduplicación e integridad de ofertas

`mergeDuplicates` ahora hace, en este orden:

1. **Una oferta por farmacia** (la más barata), conservando el `MedicationResult` de origen junto al precio — el par nunca se separa.
2. **La tarjeta canónica se elige solo entre las ofertas que sobreviven.** Mismo criterio de preferencia de antes (primero la que trae laboratorio, luego el nombre más corto), con desempates completos y deterministas (precio, luego slug de farmacia). El determinismo importa: Web deriva el slug de la ficha de `canonicalName`, y una elección dependiente del orden de llegada de las farmacias fue la causa del redirect loop documentado en `resolveMedication.ts`.
3. **Validación de compatibilidad antes de fusionar** (`canMergeOffers`): los ejes derivables del nombre (`matchKey`, combinación, variante, forma) se **recomputan** desde `PharmacyPrice.productName` de cada oferta y se comparan contra la canónica. Una oferta incompatible **no se mezcla**: sale como tarjeta propia.
4. **La imagen sale de la oferta canónica**; si no tiene, de la más barata que sí tenga — siempre una oferta presente en `prices`, nunca una descartada.

En operación normal el paso 3 no rechaza nada (todas las ofertas del grupo comparten `presentationKey`, que ya incorpora esos ejes). Es defensa en profundidad: si un cambio futuro afloja la construcción de la clave, o si se vuelve a pasar por `mergeDuplicates` un resultado ya fusionado, la tarjeta sigue sin poder mezclar dos productos.

**Invariante garantizado:** en cualquier tarjeta de la respuesta, `pharmacySlug`, `productName`, `channels` y `onlineUrl` de cada `PharmacyPrice` provienen de la MISMA oferta de la MISMA fuente, y el `canonicalName`/`laboratory`/`imageUrl` de la tarjeta provienen de una oferta que aparece en `prices`.

---

## 7. Validación de URLs

Relevamiento de los 9 clientes y de los hosts reales devueltos por producción (2026-08-27):

| Slug | Host real | Origen de `onlineUrl` |
|---|---|---|
| `cruz-verde` | `www.cruzverde.cl` | construida por el cliente (`BASE` + id) |
| `salcobrand` | `salcobrand.cl` | construida por el cliente (`BASE` + slug + sku) |
| `ahumada` | `www.farmaciasahumada.cl` | `href` del HTML (relativo o absoluto) |
| `dr-simi` | `www.drsimi.cl` | campo `link` de la API VTEX |
| `araucomed` | `farmacia.araucomed.com` | campo `url` del JSON de PrestaShop |
| `ecofarmacias` | `www.ecofarmacias.cl` | `permalink` de la API WordPress |
| `farmex` | `farmex.cl` | construida por el cliente (`BASE` + url) |
| `sermecoop` | `www.farmaciasermecoop.cl` | `BASE` + `href` del HTML |
| `easyfarma` | `nuevo.easyfarma.cl` | `href` del HTML scrapeado |

Diseño: **registro único por fuente**, `api/src/lib/pharmacyDomains.ts`, con el dominio **raíz** de cada farmacia; se acepta cualquier subdominio suyo. Los hosts reales ya usan tres prefijos distintos (`www.`, `farmacia.`, `nuevo.`) y las farmacias migran de subdominio sin avisar — EasyFarma migró a `nuevo.` durante la vida del proyecto. Una política de host exacto habría roto la integración en cada migración. Se exige `https`.

Dos puntos de aplicación:

1. **Ingesta** (`searchService.ts`) — `sanitizePharmacyUrl(slug, url)` anula toda URL que no pertenezca a la farmacia que la entregó, **antes** de entrar al pipeline. La oferta se conserva (el precio es válido); lo que se pierde es el enlace. Es la barrera que importa para los tres clientes que toman la URL completa de una fuente externa (AraucoMed, EcoFarmacias, EasyFarma).
2. **Redirect** (`routes/go.ts`) — `isAllowedRedirectUrl` sigue siendo la última barrera contra open redirect. Su contrato no cambió; solo dejó de tener su propia copia de la lista.

Explícitamente **no** se valida el dominio de `imageUrl`: varias farmacias sirven imágenes desde CDN de terceros y una política restrictiva ahí rompería la UI sin resolver ningún riesgo de navegación.

---

## 8. Impacto medido sobre datos reales

Simulación del algoritmo nuevo sobre la respuesta de producción de 9 búsquedas (`tapsin`, `paracetamol`, `ibuprofeno`, `omeprazol`, `losartan`, `amoxicilina`, `metformina`, `aspirina`, `kitadol`, 2026-08-27):

| Métrica | Valor |
|---|---|
| Tarjetas antes | 752 |
| Tarjetas después | 790 (**+5,1 %**) |
| Tarjetas con más de una farmacia | 127 |
| De esas, se parten | 33 (26 %) |

De los 33 splits, ~20 son **correcciones reales** (Tapsin Rojo/Forte/Periodo/Duo/Migraña/Instaflu, Actron RA vs Actron, Glafornil XR vs Glafornil, Ipson Forte 200 mg/5 mL vs Ipson 100 mg/5 mL, Ibuprofeno Forte 200 mg/5 mL vs 100 mg/5 mL, Tapsin comprimidos vs sobres) y ~13 son falsos splits conservadores documentados en §10.

---

## 9. Tests agregados

| Paquete | Antes | Después | Estado |
|---|---|---|---|
| `@comparafarma/domain` | 173 | 213 | 213 ✅ |
| `api` | 325 | 334 | 334 ✅ |
| `web` | 247 | 255 | 255 ✅ |
| `mobile` | 16 | 21 | 21 ✅ |

Nuevos archivos: `packages/domain/src/__tests__/productIdentity.test.ts`, `api/src/__tests__/pharmacyDomains.test.ts`, `mobile/src/__tests__/resolveMedicationCard.test.ts`.

**Test existente que pasaba por la razón equivocada** (`searchQualityQA.characterization.test.ts`, QA-01D): afirmaba que el Tapsin de EcoFarmacias y el de AraucoMed no se fusionan, pero solo pasaba porque el fixture daba `laboratory` a una y no a la otra (`brand:maver` vs `brand:unknown`). En producción AraucoMed **sí** entrega `manufacturer_name: "Maver"`, de modo que el par real caía en el mismo `presentationKey`. El test se conservó y se le agregó la versión con laboratorio en ambas ofertas, que es la que ejercita la corrección de verdad.

Tres tests más solo afirmaban el literal de `presentationKey`; se actualizaron al formato nuevo sin cambiar lo que verifican.

---

## 10. Riesgos y deuda residual

**Falsos splits conocidos y aceptados** (política: un duplicado visual es menos grave que mezclar precios de dos medicamentos distintos):

1. **Nombres truncados por la farmacia.** EasyFarma corta títulos ("Omeprazol 20 mg x 60...", "Losartan 100 mg. 30 comp....") — sin forma declarada quedan en tarjeta propia. Es el defecto de datos ya caracterizado como QA-03; no se resuelve desde nuestro lado.
2. **Una farmacia omite el calificador y otra no.** "Tapsin Niños Paracetamol 160 mg 16 Comprimidos" (Cruz Verde) vs "Tapsin 160 mg x 16 Comprimidos Masticables" (Ahumada).
3. **Sinónimos de calificador no aliados.** "Tapsin SC puro" (AraucoMed) vs "Tapsin Puro Paracetamol" (Farmex) → `var:sc` vs `var:puro`.
4. **`|form:` en la clave y no solo en la validación.** `dosageFormClass` es null-tolerante para `isSameProduct`, pero la clave incluye `|form:` solo cuando es conocida, así que una oferta sin forma declarada no agrupa con una que sí la declara. La alternativa —agrupar por clave sin forma y partir después— produce dos tarjetas con la MISMA `presentationKey`, que en Web resuelve a slug ambiguo. Se eligió el falso split sobre la ambigüedad de slug.

**Falsos merges que siguen siendo posibles:**

1. Dos variantes cuyo primer calificador coincide pero difieren más adelante (una combinación triple con los dos primeros principios activos iguales; dos presentaciones "Caliente" distintas).
2. Dos ofertas ambas con `brand:unknown` y sin calificador — limitación heredada y ya documentada en `COMMERCIAL_IDENTITY.md`.
3. Productos que solo se distinguen por un submodificador dentro de la misma clase de forma (recubierto vs masticable).

**Deuda no abordada en este ticket:** favoritos, carrito, alertas e historial de Mobile siguen indexados por `matchKey`, que ya no es único por tarjeta. Marcar como favorito una variante puede mostrar otra al restaurarla desde el home. Requiere decisión de producto sobre migración de claves persistidas.

---

## 11. Mejoras futuras

- **Identificador de producto real (EAN/GTIN).** Es la única evidencia que resuelve a la vez los falsos splits y los falsos merges. Ya hay evidencia de que sirve: EcoFarmacias y Farmex publican el mismo EAN-13 `7800007679895` para el Losartán de Laboratorio Chile que hoy queda en dos tarjetas (QA-01C). Depende de que cada cliente exponga el campo.
- Diccionario de sinónimos de calificador comercial alimentado por observación, con el mismo criterio de evidencia real que `KNOWN_BRAND_ALIASES`.
- Sacar `bio:` de `presentationKey` (decisión ya tomada en BIOEQUIVALENCE-DATA-QUALITY-01, Option D, no implementada).
- Filtro de relevancia consulta→resultado (QA-02/QA-05), hoy inexistente en el dominio.

---

## Referencias

- `packages/domain/src/productIdentity.ts`, `matching.ts`, `commercialIdentity.ts`, `deduplication.ts`
- `api/src/lib/pharmacyDomains.ts`, `api/src/services/searchService.ts`
- `web/src/lib/medicationSlug.ts`, `web/src/lib/resolveMedication.ts`
- `mobile/src/lib/resolveMedicationCard.ts`, `mobile/src/lib/cache.ts`
- `docs/technology/domain/COMMERCIAL_IDENTITY.md` — resolución de marca/laboratorio y política conservadora
- `docs/technology/domain/NORMALIZATION_AND_DEDUPLICATION.md` — `cleanQuery`, `matchKey`, `mergeDuplicates`
