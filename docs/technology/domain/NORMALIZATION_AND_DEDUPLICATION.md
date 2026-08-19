# Normalización de Búsqueda y Deduplicación

Documentación de los algoritmos clave, que viven en el paquete compartido `packages/domain/src/` (`@comparafarma/domain`): `normalization.ts` (`cleanQuery`), `matching.ts` (`matchKey`), `pricing.ts` (`effectivePrice`/`toPharmacyPrice`), `deduplication.ts` (`mergeDuplicates`). Son críticos para que la búsqueda funcione bien y para que el mismo medicamento vendido bajo nombres distintos en cada farmacia aparezca agrupado correctamente.

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

### Algoritmo

1. Agrupar resultados por `presentationKey` (antes: `matchKey`; ver actualización arriba)
2. Para cada grupo con más de un elemento:
   - **Elegir nombre canónico**: preferir el que tiene `laboratory` no-null, luego el de nombre más corto
   - **Fusionar precios**: combinar `prices[]` de todos los miembros, manteniendo el más reciente por farmacia (`fetchedAt`)
   - **Ordenar precios** por `channels.effective` ASC
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

Prefijo actual: `search_cache_v11_` (`mobile/src/lib/cache.ts`)

---

## Límites conocidos

- Medicamentos con **forma farmacéutica distinta** para la misma dosis ("comp" vs "efervescente") pueden fusionarse incorrectamente. La forma farmacéutica se ignora por diseño para maximizar matches entre farmacias.
- Nombres **comercial vs genérico** no se fusionan: "Tylenol 500 mg" y "Paracetamol 500 mg" generan matchKeys distintos.
- Productos **sin dosis explícita en el nombre** (suplementos, vitaminas): la deduplicación es menos precisa, depende solo del nombre de marca.
- **Sin dosis y sin turno**: si two farmacias tienen el mismo producto (ej: "Tapsin" sin dose ni turno) pero con distinta cantidad implícita, pueden fusionarse. En la práctica raro.
