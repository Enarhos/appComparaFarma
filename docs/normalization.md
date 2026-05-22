# Normalización de Búsqueda y Deduplicación

Documentación de los algoritmos clave en `mobile/src/lib/normalization.ts`. Son críticos para que la búsqueda funcione bien y para que el mismo medicamento vendido bajo nombres distintos en cada farmacia aparezca agrupado correctamente.

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

### Comportamiento con tildes y mayúsculas
`cleanQuery` conserva el texto tal como entra, salvo limpieza de ruido, puntuación y palabras genéricas. No hace transliteración de tildes ni lowercasing global.

---

## 2. `matchKey(name: string): string`

**Propósito**: Generar una clave de deduplicación que agrupe medicamentos equivalentes aunque tengan nombres distintos entre farmacias.

### Algoritmo

1. Convertir a minúsculas
2. Extraer dosis en `ml`, `mg`, `mcg/ug/µg` y `g`
3. Si la dosis viene en gramos, convertirla a miligramos
4. Limpiar puntuación y split por espacios
5. Encontrar el primer token que NO sea stop-word y NO empiece con dígito → `first`
6. Detectar cantidad de unidades cuando aparezca como `x20`, `20 comprimidos`, `30 sobres`, etc.
7. Retornar `"${first}|${dose}|${qty}"`, omitiendo partes vacías

### Ejemplos

```
"Paracetamol 500 mg Comprimidos x20"      → "paracetamol|500mg|20"
"PARACETAMOL 500MG COMP"                  → "paracetamol|500mg"
"Paracetamol 500 mg cap"                  → "paracetamol|500mg"
"PARACETAMOL INF GOTAS 100mg/ml 15ml"     → "paracetamol|15ml"
"Ibuprofeno 400 mg"                       → "ibuprofeno|400mg"
"Ibuprofeno Forte 400mg Tabletas x10"     → "ibuprofeno|400mg|10"
"Metformina 850 mg comp recubierto"       → "metformina|850mg"
"Amoxicilina Potásica 0.5 g cápsulas"     → "amoxicilina|500mg"
```

### Caso especial: sin dosis

Si el nombre no contiene dosis reconocible, `matchKey` retorna solo el primer token no-stop-word:
```
"Betametasona crema"                      → "betametasona"
"Vitamina C"                              → "vitamina"   ← impreciso
```

Para vitaminas y suplementos sin dosis explícita, la deduplicación es menos precisa.

---

## 3. `mergeDuplicates(results: MedicationResult[]): MedicationResult[]`

**Propósito**: Agrupar resultados con el mismo `matchKey` (mismo principio activo y dosis encontrado en múltiples farmacias) en un solo `MedicationResult` con todos los precios.

### Algoritmo

1. Agrupar resultados por `matchKey`
2. Para cada grupo (si solo tiene un elemento, no hacer nada):
   - **Elegir nombre canónico**: preferir el que tiene `laboratory` no-null, luego el de nombre más corto
   - **Fusionar precios**: combinar los arrays `prices[]` de todos los miembros del grupo, manteniendo el más reciente por `pharmacySlug` (basado en `fetchedAt`)
3. Retornar un array de `MedicationResult` con precios fusionados

### Ejemplo visual

```
Cruz Verde devuelve:   { name: "Paracetamol 500 mg",      matchKey: "paracetamol|500mg", prices: [{ slug: "cruz-verde", store: 2990 }] }
Salcobrand devuelve:   { name: "PARACETAMOL 500MG COMP",  matchKey: "paracetamol|500mg", prices: [{ slug: "salcobrand", store: 3290, online: 2490, sbpay: 2290 }] }
Ahumada devuelve:      { name: "Paracetamol 500 mg Comp", matchKey: "paracetamol|500mg", prices: [{ slug: "ahumada", store: 3150, cmr: 2650 }] }
Dr. Simi devuelve:     { name: "Paracetamol 500 mg",      matchKey: "paracetamol|500mg", prices: [{ slug: "dr-simi", store: 2890, online: 2590 }] }

Resultado merged:
{
  matchKey: "paracetamol|500mg",
  canonicalName: "Paracetamol 500 mg",    ← más corto con lab/info
  prices: [
    { slug: "cruz-verde",  channels: { store: 2990, effective: 2990 } },
    { slug: "salcobrand",  channels: { store: 3290, online: 2490, sbpay: 2290, effective: 2290 } },
    { slug: "dr-simi",     channels: { store: 2890, online: 2590, effective: 2590 } },
    { slug: "ahumada",     channels: { store: 3150, cmr: 2650, effective: 2650 } },
  ]
  bestPrice: 2290,
  bestPharmacy: "salcobrand"
}
```

### Límites conocidos

- Si dos medicamentos distintos tienen el mismo `matchKey` (ej: "Paracetamol 500 mg comp" y "Paracetamol 500 mg efervescente"), se fusionarán incorrectamente. La forma farmacéutica se ignora por diseño para maximizar los matches entre farmacias.
- Medicamentos con nombres muy distintos para el mismo principio activo (nombre comercial vs genérico) no se deduplican: ej: "Tylenol 500 mg" y "Paracetamol 500 mg" generan matchKeys distintos.

---

## Stop Words para matchKey

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
]);
```

---

## Generic Words para cleanQuery

Ver la lista completa en `mobile/src/lib/normalization.ts`. Incluye:
- Formas farmacéuticas (comp, cap, tab, sol, jbe, amp, sus, crm, gts, iny, etc.)
- Vías de administración
- Unidades de medida (mg, ml, mcg, g, ui)
- Palabras conectoras (x, de, la, el, con, para)
- Descriptores de receta (cada, vía, dosis, día, horas)
