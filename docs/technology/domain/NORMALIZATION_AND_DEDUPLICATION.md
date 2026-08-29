# Normalización de Búsqueda y Deduplicación

Documentación de los algoritmos clave, que viven en el paquete compartido `packages/domain/src/` (`@comparafarma/domain`): `normalization.ts` (`cleanQuery`), `matching.ts` (`matchKey`), `pricing.ts` (`effectivePrice`/`toPharmacyPrice`), `deduplication.ts` (`mergeDuplicates`), `queryIntent.ts` (`parseQueryIntent`) y `relevance.ts` (`evaluateResultRelevance`/`rankByRelevance`). Son críticos para que la búsqueda funcione bien y para que el mismo medicamento vendido bajo nombres distintos en cada farmacia aparezca agrupado correctamente.

> **Antes** esta lógica vivía duplicada en `api/src/lib/normalization.ts` y `mobile/src/lib/normalization.ts` — la migración a `packages/domain` (ver `ADR-0001_SHARED_DOMAIN_PACKAGE.md`) eliminó ese riesgo de divergencia: hoy `api/` y `mobile/` importan la misma implementación, no hay dos copias que sincronizar.

---

## 1. `cleanQuery(raw: string): string`

**Propósito**: Transformar el texto crudo de búsqueda (que puede venir de una receta médica o de copia-pega) en una query limpia y corta que los scrapers puedan procesar.

### Qué elimina

| Tipo | Ejemplos |
|---|---|
| Formas farmacéuticas | "comprimido", "comp", "cápsula", "cap", "tab", "jarabe", "crema" |
| Rutas de administración | "oral", "tópico", "nasal", "oftálmico", "rectal" |
| Unidades de dosis | "mg", "ml", "mcg", "g", "UI" |
| Dosificaciones | "500 mg", "2.5 ml", "800UI" |
| Instrucciones de receta | TODO lo que viene después de "tomar", "dosis", "cada", "vía", "indicación" |
| Texto entre paréntesis | "(B)", "(R)", "(Bioequivalente)" |
| Texto entre corchetes | "[LABORATORIO]" |
| Puntuación | ".", ",", ":", "/" |

### Ejemplos

```
"PARACETAMOL 500 MG COMPRIMIDO"           → "PARACETAMOL"
"Ibuprofeno 400 mg tab - tomar 1 cada 8h" → "Ibuprofeno"
"Amoxicilina 500 mg cápsulas [Betapharma]"→ "Amoxicilina"
"Metformina 850 mg comp. Recubierto"       → "Metformina"
"FRENALER-D (R) Comp."                    → "FRENALER-D"
```

> **Actualización 2026-08-28 (CF-SEARCH-002 — Query Intent & Relevance):** `cleanQuery` NO cambió y sigue siendo la función de RECUPERACIÓN: es el texto que se manda a los 9 buscadores de farmacia, y restringirlo devuelve menos resultados. Lo que se agregó es una capa paralela (`parseQueryIntent`, §1-bis) que lee del texto crudo los atributos que `cleanQuery` descarta y los usa DESPUÉS del retrieval, para evaluar y ordenar. Los dos conceptos no deben volver a mezclarse.

---

## 1-bis. `parseQueryIntent(rawQuery: string): QueryIntent` y la capa de relevancia

**Contexto (CF-SEARCH-002, 2026-08-28).** Hasta este ticket el pipeline nunca comparaba un resultado contra la consulta que lo trajo: `searchService` hacía `mergeDuplicates(...)` y ordenaba solo por precio. De ahí los dos defectos de QA que este cambio cierra, ambos medidos en producción:

- **QA-02** — `q=omeprazol` devolvía 36 tarjetas, 11 de ellas **esomeprazol** (otro principio activo). Los buscadores de cada farmacia hacen ese match porque `"esomeprazol"` contiene `"omeprazol"` como substring.
- **QA-05** — `q=ibuprofeno 200 mg`, `400 mg` y `600 mg` devolvían las **mismas 110 tarjetas**, y la 2ª y 3ª respondían `x-search-cache: hit` sobre la entrada de la 1ª: la clave de caché era `cleanQuery(raw)`, que descarta la concentración.

### Tres conceptos separados

| Concepto | Qué es | Dónde se usa |
|---|---|---|
| `rawQuery` | lo que escribió el usuario | entrada de `parseQueryIntent` |
| `retrievalQuery` | `cleanQuery(rawQuery)` | lo que reciben las 9 farmacias, y la clave de caché de **retrieval** |
| `queryIntent` | intención estructurada (`concentration`, `quantity`, `dosageForm`, `terms`) | evaluación y orden **después** del retrieval, y la clave de caché de **respuesta** |

La intención **nunca** filtra lo que se le pide a las farmacias.

### `Concentration` — razón estructurada, no cadena

```ts
type Measurement   = { value: number; unit: string };
type Concentration = { numerator: Measurement; denominator: Measurement | null };
```

- `600 mg` → `{numerator:{600,"mg"}, denominator:null}` (dosis absoluta).
- `250 mg / 5 ml` → `{numerator:{250,"mg"}, denominator:{5,"ml"}}` — **nunca** se colapsa a una unidad compuesta `"mg/5ml"`, que sería incomparable con `50 mg/ml`.
- `20 mg/ml` → denominador implícito normalizado a `{1,"ml"}` (decisión documentada).
- La comparación es por **razón** (`250 mg/5 ml` === `50 mg/ml`) y convierte dentro de una familia de unidades (`0,5 g` === `500 mg`). Una dosis absoluta nunca es igual a una razón.
- Una razón **masa/masa** (`50 mg / 12,5 mg`) se lee como firma de COMBINACIÓN, no de concentración — misma regla que `combinationKey` (S-1). El tipo admite `mg/g`, `%`, `UI/ml` o dosis por inhalación sin cambios; lo acotado es la tabla de conversión.

### `evaluateResultRelevance(intent, result)` — QA-02

Compara por **token completo** (`normalizedWords`, la misma tokenización de `matchKey`), nunca por `includes()` sobre el nombre:

| `lexicalMatch` | Criterio | Ejemplo real |
|---|---|---|
| `exact` | todos los términos aparecen como token completo | `omeprazol` → "Omeprazol 20 mg x 30..." |
| `compatible` | sin evidencia en contra (típicamente una marca) | `omeprazol` → "Lomex 20 Mg X 28 Caps" |
| `mismatch` | el término solo aparece como substring de otro nombre farmacológico, y en ningún lado completo | `omeprazol` → "Esomeprazol 40 mg x 30" |

Dos guardas evitan falsos positivos: el token debe tener ≥5 caracteres, y la diferencia de longitud entre ambos debe ser ≥2 (un carácter es plural o corrupción de datos — caso real: "Tapsí­n" con soft hyphen tokeniza `tapsi` y degradaba dos Tapsin reales).

Un `mismatch` **no se elimina**: queda al final del orden y etiquetado. Política conservadora de siempre.

### Cohorte de concentración y orden — QA-05

`rankByRelevance(intent, results)` anota cada `MedicationResult` con `lexicalMatch` y `concentrationMatch` (`exact` | `unknown` | `other`) y ordena por, en este orden de prioridad:

1. `mismatch` al final (única degradación léxica; `exact` y `compatible` comparten tier — PreciosFarma es primariamente un comparador de precios).
2. **Cohorte de concentración: EXACT → UNKNOWN → OTHER.** Límite duro: **el precio no lo cruza nunca**. Un Ibuprofeno 400 mg a \$642 no puede aparecer antes que un Ibuprofeno 600 mg a \$9.553 si se buscó 600 mg.
3. Cantidad y forma farmacéutica, como señales suaves (`exact > unknown > different`), que desempatan dentro de la cohorte y nunca la cruzan.
4. `bestPrice`, el criterio histórico.

Si la consulta **no** trae concentración, `concentrationMatch` queda **ausente** en todos los resultados y el criterio 2 no altera nada: "ibuprofeno" a secas se comporta exactamente como antes. `unknown` (nombre truncado por la farmacia) va entre medio: no se puede afirmar que sea la dosis pedida ni que no lo sea, y descartarlo destruiría recall real.

### Contrato y caché

- `MedicationResult` gana dos campos **opcionales y aditivos**: `lexicalMatch` y `concentrationMatch`. Se eligió metadata por resultado en vez de envolver la respuesta en dos arrays porque `/api/search` devuelve hoy un `MedicationResult[]` desnudo y los binarios de Mobile ya publicados lo leen así — envolverlo los rompería.
- La caché de `/api/search` pasó a **dos niveles**: `cfsearch:r:` (retrieval, clave = `retrievalQuery`, compartida entre intenciones para no triplicar el scraping) y `cfsearch:v2:` (respuesta, clave = `queryIntentCacheKey(intent)`, ej. `ibuprofeno|dose:600mg|qty:20`). Un hit de retrieval se **re-rankea** con la intención real antes de responder.
- Web y Mobile **consumen** la clasificación; no la recalculan ni vuelven a parsear nombres.

---

## 2. `matchKey(name: string): string`

**Propósito**: Generar una clave de deduplicación que agrupe medicamentos equivalentes aunque tengan nombres distintos entre farmacias.

### Algoritmo

1. **Normalizar acentos** (NFD): "Día" → "dia", "Ácido" → "acido"
2. Convertir a minúsculas
3. Extraer dosis en `ml`, `mg`, `mcg/ug/µg` y `g`; si viene en gramos, convertir a mg
4. Reemplazar guiones entre letras por concatenación: "Co-Amoxiclav" → "Coamoxiclav"
5. Limpiar puntuación y split por espacios
6. Encontrar la primera palabra brand (no stop-word, no empieza con dígito, solo [a-z]) → `first`
   - Si `first` tiene ≤4 letras y la siguiente también, unirlas: "Trio Val" → "trioval"
7. Detectar **indicador de turno** día/noche: `\bdia\b` → `"d"`, `\bnoche\b` → `"n"`, ausente → `""`
8. Detectar cantidad de unidades: `x20`, `20 comprimidos`, `6 sobres`, etc.
9. Normalizar qty=1 a vacío (1 unidad es la presentación singular implícita)
10. Retornar `"${first}|${dose}|${turn}|${qty}"`, omitiendo partes vacías

### Ejemplos completos

```
"Paracetamol 500 mg Comprimidos x20"              → "paracetamol|500mg|20"
"PARACETAMOL 500MG COMP"                          → "paracetamol|500mg"
"Paracetamol 500 mg cap"                          → "paracetamol|500mg"
"PARACETAMOL INF GOTAS 100mg/ml 15ml"             → "paracetamol|15ml"
"Ibuprofeno 400 mg"                               → "ibuprofeno|400mg"
"Amoxicilina 0.5 g cápsulas"                      → "amoxicilina|500mg"

"Tapsin Plus Día Paracetamol 650 mg 1 Sobre"      → "tapsin|650mg|d"
"Tapsin Plus Noche Paracetamol 650 mg 1 Sobre"    → "tapsin|650mg|n"
"Tapsin Limonada (B) Paracetamol Día 5g"          → "tapsin|5000mg|d"
"Tapsín Limonada Noche (B) Paracetamol 5g"        → "tapsin|5000mg|n"
"Tapsin Instaflu (B) Paracetamol Polvo Día 1 Sob" → "tapsin|d"
"Tapsin Insta Flu Polvo Día"                       → "tapsin|d"   ← mismo key → fusión ✅
```

### Por qué qty=1 se normaliza a vacío

Cruz Verde suele omitir "1 Sobre" del nombre del producto; Salcobrand lo escribe explícitamente. Sin esta normalización, productos idénticos generaban claves distintas:

```
Cruz Verde:   "Tapsin Insta Flu Polvo Día"            → "tapsin"   ❌
Salcobrand:   "Tapsin Instaflu Polvo Día 1 Sobre"     → "tapsin|1" ❌
            (no fusionaban → "1 farmacia" en ambos)

Con qty=1→"":
Cruz Verde:   → "tapsin|d" ✅
Salcobrand:   → "tapsin|d" ✅  (fusionan → "2 farmacias")
```

### Por qué día/noche son un campo separado (no stop-word simple)

Los multicomponentes antigripales Día/Noche son **productos distintos** (el Noche lleva antihistamínico, el Día no). Tratarlos como stop-words los fusionaba incorrectamente:

```
Sin indicador de turno:
  "Tapsin Plus Día 650mg"   → "tapsin|650mg"  ← misma clave ❌
  "Tapsin Plus Noche 650mg" → "tapsin|650mg"  ← fusión incorrecta

Con indicador de turno:
  "Tapsin Plus Día 650mg"   → "tapsin|650mg|d" ✅
  "Tapsin Plus Noche 650mg" → "tapsin|650mg|n" ✅ (separados)
```

`dia`/`noche` siguen en STOP_WORDS para que no contaminen `first`, pero se capturan por separado vía regex `\bdia\b` / `\bnoche\b` sobre el nombre ya normalizado sin acentos.

---

## 3. `mergeDuplicates(results: MedicationResult[]): MedicationResult[]`

**Propósito**: Agrupar resultados **SAME_PRODUCT** en un solo `MedicationResult` con todos los precios.

> **Actualización 2026-08-19 (FASE 1 — Product Identity):** la clave de agrupación dejó de ser `matchKey` a secas — ahora es `presentationKey` (`matchKey` + bioequivalencia + identidad comercial/marca). `matchKey` sigue siendo el algoritmo descrito abajo, sin cambios; lo que cambió es que ya no alcanza por sí solo para decidir si dos ofertas son el mismo producto comercial (ver auditoría P0 Omeprazol 20mg — Ascend/OPKO/CuraeSpring compartían `matchKey` y se fusionaban incorrectamente). Detalle completo, política de fusión y normalización de marca: `docs/technology/domain/COMMERCIAL_IDENTITY.md`. El resto de esta sección (elección de nombre canónico, fusión de precios) sigue aplicando igual, solo que ahora opera dentro de cada grupo de `presentationKey`.

> **Actualización 2026-08-27 (CF-SEARCH-001 — Product Identity & False Merge):** `presentationKey` incorpora dos ejes más, `|var:` (variante comercial dentro de la familia de marca) y `|form:` (clase gruesa de forma farmacéutica), y `mergeDuplicates` valida explícitamente la compatibilidad de identidad antes de fusionar. `matchKey` sigue sin cambios. Motivo: `brand:` no discrimina dentro de un mismo laboratorio, así que Tapsin Rojo, Forte, Periodo, Duo, Migraña e Instaflu —todos de Maver— colapsaban en una sola tarjeta con un "ahorro" inexistente. Diseño completo, evidencia de producción, impacto medido y falsos splits aceptados: `docs/technology/domain/PRODUCT_IDENTITY.md`.

### Algoritmo

1. Agrupar resultados por `presentationKey` (antes: `matchKey`; ver actualizaciones arriba)
2. Para cada grupo con más de un elemento:
   - **Quedarse con una oferta por farmacia**: la de menor `channels.effective`, conservando el `MedicationResult` de origen junto al precio
   - **Elegir nombre canónico entre las ofertas que sobrevivieron**: preferir la que tiene `laboratory` no-null, luego la de nombre más corto, con desempates deterministas (precio, luego slug de farmacia). Desde CF-SEARCH-001 la elección se restringe a las ofertas presentes en `prices[]` — antes podía titular la tarjeta con una oferta descartada del grupo
   - **Validar compatibilidad de identidad** antes de fusionar: una oferta cuyo nombre contradice a la canónica (principio activo/dosis/cantidad, combinación, variante comercial o forma farmacéutica) no se mezcla; sale como tarjeta propia
   - **Ordenar precios** por `channels.effective` ASC
   - **Imagen**: de la oferta canónica; si no tiene, de la más barata que sí tenga — nunca de una oferta descartada
3. Retornar un array de `MedicationResult` con precios fusionados

### Ejemplo visual

```
Cruz Verde:  { name: "Paracetamol 500 mg",     matchKey: "paracetamol|500mg", prices: [{ slug: "cruz-verde",  store: 2990 }] }
Salcobrand:  { name: "PARACETAMOL 500MG COMP", matchKey: "paracetamol|500mg", prices: [{ slug: "salcobrand", store: 3290, sbpay: 2290 }] }
Dr. Simi:    { name: "Paracetamol 500 mg",     matchKey: "paracetamol|500mg", prices: [{ slug: "dr-simi",    store: 2890 }] }

Resultado merged:
{
  matchKey:      "paracetamol|500mg",
  canonicalName: "Paracetamol 500 mg",
  prices: [
    { slug: "salcobrand", channels: { store: 3290, sbpay: 2290, effective: 2290 } },
    { slug: "dr-simi",    channels: { store: 2890,              effective: 2890 } },
    { slug: "cruz-verde", channels: { store: 2990,              effective: 2990 } },
  ],
  bestPrice:    2290,
  bestPharmacy: "salcobrand"
}
```

---

## 4. Stop Words para `matchKey`

```typescript
const STOP_WORDS = new Set([
  "x", "de", "la", "el", "los", "las", "con", "para", "sin", "por",
  "comp", "comprimido", "comprimidos", "capsula", "capsulas", "tab",
  "tableta", "tabletas", "sol", "solucion", "jarabe", "suspension",
  "crema", "gel", "gotas", "ampolla", "inyectable", "recubierto",
  "liberacion", "prolongada", "inhalador", "aerosol", "polvo",
  "parche", "supositorio", "colirio", "nasal", "ocular", "rectal",
  "mg", "ml", "mcg", "g", "ui", "iu", "infantil", "adulto", "forte",
  "plus", "pediatrico", "nino",
  "dia", "noche", "dn", "yn",  // turno — se capturan como campo separado, no como brand word
]);
```

---

## 5. Versioning del caché

El prefijo de caché AsyncStorage en `mobile/src/lib/cache.ts` debe **incrementarse cada vez que cambie la estructura de `MedicationResult`, `PharmacyPrice` o el algoritmo `matchKey`**. Si no se incrementa, la app puede mostrar datos con claves obsoletas.

| Versión | Motivo del cambio |
|---------|------------------|
| `v1` | Inicial |
| `v2` | Agregado `imageUrl` |
| `v3` | Agregado `isBioequivalent` |
| `v4` | Agregado Dr. Simi |
| `v5` | qty=1 normalizado en matchKey; count scrapers 10→24 |
| `v6` | Indicador turno día/noche en matchKey |
| `v7`–`v9` | No documentados en este archivo — revisar historial de `mobile/src/lib/cache.ts` si hace falta el detalle |
| `v10` | `matchKey` migrado a `@comparafarma/domain` (fusión de guiones y palabras cortas) |
| `v11` | `MedicationResult` gana `presentationKey` (FASE 1 — Product Identity, 2026-08-19); una misma búsqueda puede devolver más resultados que antes al separar marcas distintas bajo el mismo `matchKey` — ver `docs/technology/domain/COMMERCIAL_IDENTITY.md` |
| `v12` | `presentationKey` incorpora `\|var:` y `\|form:` (CF-SEARCH-001, 2026-08-27): cambia su VALOR para la mayoría del catálogo y la ficha de Mobile pasó a resolverse por esa clave — un resultado cacheado con la clave vieja ya no corresponde al mismo agrupamiento ni resuelve la ficha. Ver `docs/technology/domain/PRODUCT_IDENTITY.md` |

Prefijo actual: `search_cache_v12_` (`mobile/src/lib/cache.ts`)

---

## Límites conocidos

- Medicamentos con **forma farmacéutica distinta** para la misma dosis ("comp" vs "efervescente") pueden fusionarse incorrectamente. La forma farmacéutica se ignora por diseño para maximizar matches entre farmacias.
- Nombres **comercial vs genérico** no se fusionan: "Tylenol 500 mg" y "Paracetamol 500 mg" generan matchKeys distintos.
- Productos **sin dosis explícita en el nombre** (suplementos, vitaminas): la deduplicación es menos precisa, depende solo del nombre de marca.
- **Sin dosis y sin turno**: si two farmacias tienen el mismo producto (ej: "Tapsin" sin dose ni turno) pero con distinta cantidad implícita, pueden fusionarse. En la práctica raro.
