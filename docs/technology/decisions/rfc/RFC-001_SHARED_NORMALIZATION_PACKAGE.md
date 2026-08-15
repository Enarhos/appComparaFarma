# RFC-001 — Shared Domain Package

| Campo | Valor |
|---|---|
| **ID** | RFC-001 |
| **Título** | Shared Domain Package — eliminar duplicación de `normalization.ts` y `types.ts` |
| **Estado** | Aprobado |
| **Fecha** | 2026-06-29 |
| **Autor** | Claude Code (Principal SE) |
| **Revisores** | CTO, Tech Lead |
| **Issues relacionados** | CF-001, NORM-01 (ER-002), AUDIT-001 |
| **Prioridad** | Alta |

---

## 1. Resumen Ejecutivo

### El problema

El proyecto ComparaFarma mantiene **dos copias independientes** de `normalization.ts`:

```
api/src/lib/normalization.ts      ← versión A (backend)
mobile/src/lib/normalization.ts   ← versión B (mobile)
```

Estas copias ya **divergieron en producción**. La versión del backend incorporó dos mejoras a la función `matchKey` que la versión mobile no recibió:

1. **Normalización de guiones:** `"Trio-Val"` → `"trioval"` en backend, `"trio"` en mobile.
2. **Short-word merging:** `"Tri Fen"` → `"trifen"` en backend, `"tri"` en mobile.

La función `matchKey` es el corazón del sistema de deduplicación y también la clave de identidad que vincula alertas de precio y favoritos con los resultados del backend. La divergencia produce un fallo silencioso: las alertas de precio nunca se disparan para medicamentos cuyos nombres contienen guiones o están compuestos de dos palabras cortas.

### Por qué debe resolverse ahora

El bug ya existe en producción. Cada nueva mejora a `matchKey` en el backend tiene alta probabilidad de no llegar al mobile, perpetuando y agravando el problema. No hay mecanismo de enforcement que prevenga la próxima divergencia.

### Impacto en el negocio

| Feature afectada | Estado actual |
|---|---|
| Alertas de precio (ej: "Trio-Val") | Silenciosamente rotas — no se disparan |
| Favoritos con guiones en el nombre | No matchean en resultados frescos |
| Futuras mejoras a `matchKey` | Heredarán el bug automáticamente |
| Confianza del usuario en alertas | Erosionada sin que el usuario sepa por qué |

### Impacto técnico

- Deuda estructural de mantenimiento: cada cambio a `normalization.ts` debe aplicarse en dos lugares.
- Sin tests de contrato que verifiquen que ambas copias son idénticas.
- El bug es invisible en los tests actuales porque el test de `searchService` pasa un query ya limpio.

---

## 2. Estado Actual

### 2.1 Arquitectura actual

```
compara-farma/ (monorepo pnpm)
├── api/
│   └── src/lib/
│       ├── normalization.ts   ← copia A (FUENTE CANÓNICA, más actualizada)
│       └── types.ts           ← tipos del dominio, copia A
└── mobile/
    └── src/lib/
        ├── normalization.ts   ← copia B (DESACTUALIZADA)
        └── types.ts           ← tipos del dominio, copia B
```

### 2.2 Diagrama de dependencias actuales

```
┌─────────────────────────────────────────────┐
│  api/src/lib/normalization.ts (versión A)   │
│  ─ cleanQuery                               │
│  ─ matchKey  ← con guiones + short-word     │
│  ─ effectivePrice                           │
│  ─ mergeDuplicates                          │
└──────────┬──────────────────────────────────┘
           │ importado por
           ├─ api/src/services/searchService.ts
           ├─ api/src/routes/search.ts
           └─ api/src/__tests__/normalization.test.ts

┌─────────────────────────────────────────────┐
│  mobile/src/lib/normalization.ts (versión B)│
│  ─ cleanQuery                               │
│  ─ matchKey  ← SIN guiones NI short-word    │
│  ─ effectivePrice                           │
│  ─ mergeDuplicates                          │
└──────────┬──────────────────────────────────┘
           │ importado por
           ├─ mobile/src/hooks/useSearch.ts
           ├─ mobile/src/store/alertsStore.ts (via matchKey)
           └─ mobile/src/store/favoritesStore.ts (via matchKey)
```

### 2.3 Divergencia específica detectada

| Comportamiento | Backend (versión A) | Mobile (versión B) |
|---|---|---|
| `matchKey("Trio-Val 80mg x 30")` | `trioval\|80mg\|30` | `trio\|80mg\|30` |
| `matchKey("Co-Amoxiclav 500mg 21 Cáps")` | `coamoxiclav\|500mg\|21` | `co\|500mg\|21` |
| `matchKey("Tri Fen 10mg")` | `trifen\|10mg` | `tri\|10mg` |
| `matchKey("Paracetamol 500mg x 16")` | `paracetamol\|500mg\|16` | `paracetamol\|500mg\|16` ✅ |

La divergencia afecta nombres con guiones y nombres compuestos de dos palabras cortas (≤4 letras cada una). Para la mayoría de los medicamentos comunes (Paracetamol, Ibuprofeno, Amoxicilina) no hay diferencia.

### 2.4 Problemas estructurales

1. **Sin fuente única de verdad:** dos archivos que deben ser idénticos pero no tienen enforcement.
2. **Sin tests de contrato:** ningún test verifica que `matchKey("Trio-Val")` produce el mismo resultado en mobile y backend.
3. **Documentación desactualizada:** `CLAUDE.md` describe `matchKey` como si hubiera una sola implementación.
4. **Tipos también duplicados:** `api/src/lib/types.ts` y `mobile/src/lib/types.ts` son copias del mismo contrato de dominio.

---

## 3. Objetivos

### Qué resolverá este RFC

- ✅ Eliminar la duplicación de `normalization.ts` creando una única fuente de verdad.
- ✅ Eliminar la duplicación de `types.ts` (contrato de dominio compartido).
- ✅ Corregir la divergencia de `matchKey` (guiones + short-word merging) en mobile.
- ✅ Establecer un mecanismo estructural que prevenga divergencias futuras.
- ✅ Agregar tests de contrato que verifiquen la estabilidad de `matchKey`.

### Qué NO resolverá este RFC

- ❌ No migrará automáticamente alertas y favoritos existentes con `matchKey` antiguo (se acepta que queden huérfanos — ver sección 8).
- ❌ No resuelve el rate limiting inefectivo en Vercel (RL-01 de ER-002 — es un RFC separado).
- ❌ No agrega tests de la UI mobile (es un objetivo de largo plazo).
- ❌ No cambia la lógica de ninguna de las funciones de normalización — solo las mueve.

---

## 4. Opciones Evaluadas

### Opción A — Sincronización manual (status quo mejorado)

Establecer un proceso de revisión que exija actualizar ambas copias de forma sincrónica en cada PR.

| | |
|---|---|
| **Ventajas** | Cero cambios en la arquitectura del proyecto |
| **Desventajas** | Ya falló una vez. Sin enforcement, fallará de nuevo. Depende de disciplina humana. |
| **Complejidad** | Baja (solo proceso) |
| **Riesgo** | Alto — la próxima divergencia es cuestión de tiempo |
| **Recomendación** | ❌ Descartada. No resuelve el problema raíz. |

### Opción B — Script de build que copia automáticamente

Un script en CI copia `api/src/lib/normalization.ts` a `mobile/src/lib/normalization.ts` en cada push a `main`.

| | |
|---|---|
| **Ventajas** | Automatiza la sincronización sin cambiar la estructura del proyecto |
| **Desventajas** | Los dos entornos tienen requisitos de módulo distintos (NodeNext con `.js` explícito vs. Babel sin extensión). El script debería transformar los imports. Frágil. Si el script falla silenciosamente, la divergencia reaparece. |
| **Complejidad** | Media (script + CI) |
| **Riesgo** | Medio — la solución es más frágil de lo que parece |
| **Recomendación** | ❌ Descartada. Resuelve el síntoma, no el problema. |

### Opción C — Paquete compartido en el monorepo (RECOMENDADA)

Crear un tercer workspace `packages/domain` que exporte los tipos y funciones compartidos, organizados en submódulos por responsabilidad. Tanto `api/` como `mobile/` importan desde `@comparafarma/domain`.

| | |
|---|---|
| **Ventajas** | Una sola fuente de verdad. Cualquier cambio es automáticamente reflejado en ambos consumidores. Permite tests propios por submódulo. Compatible con la estructura de monorepo pnpm existente. La separación en submódulos hace evidente dónde vive cada responsabilidad. |
| **Desventajas** | Requiere configurar Metro para resolver el nuevo workspace. Hay riesgo técnico en la compatibilidad de resolución de módulos. |
| **Complejidad** | Media (nueva estructura + configuración Metro + migración de imports) |
| **Riesgo** | Bajo-medio (los riesgos son técnicos y predecibles) |
| **Recomendación** | ✅ Adoptada |

### Opción D — Servicio de normalización via HTTP

Mover `matchKey` y `cleanQuery` a un endpoint del backend (`/api/normalize`) y que mobile los consuma via HTTP en lugar de ejecutarlos localmente.

| | |
|---|---|
| **Ventajas** | Garantiza que mobile y backend usan exactamente el mismo código |
| **Desventajas** | Introduce latencia de red para operaciones que son baratas localmente. Las alertas y favoritos necesitan `matchKey` offline (sin red). Agrega un endpoint innecesario. |
| **Complejidad** | Alta |
| **Riesgo** | Alto (dependencia de red para operaciones locales) |
| **Recomendación** | ❌ Descartada. Sobrediseño con trade-offs negativos. |

---

## 5. Arquitectura Propuesta

### 5.1 Estructura de carpetas

```
compara-farma/ (monorepo pnpm)
├── pnpm-workspace.yaml              ← agrega "packages/*"
│
├── packages/                        ← NUEVO directorio
│   └── domain/                      ← NUEVO workspace (@comparafarma/domain)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts             ← re-exporta todos los submódulos
│           ├── types.ts             ← contrato de dominio compartido
│           ├── matching.ts          ← matchKey()
│           ├── normalization.ts     ← cleanQuery()
│           ├── pricing.ts           ← effectivePrice(), toPharmacyPrice(), toMedicationResult()
│           ├── deduplication.ts     ← mergeDuplicates()
│           └── __tests__/
│               ├── matching.test.ts
│               ├── normalization.test.ts
│               ├── pricing.test.ts
│               ├── deduplication.test.ts
│               └── contract.test.ts ← snapshot tests de contrato
│
├── api/
│   ├── package.json                 ← agrega @comparafarma/domain: workspace:*
│   └── src/
│       ├── lib/
│       │   ├── normalization.ts     ← ELIMINADO
│       │   └── types.ts             ← ELIMINADO
│       └── ...
│
└── mobile/
    ├── package.json                 ← agrega @comparafarma/domain: workspace:*
    ├── metro.config.js              ← agrega packages/domain a watchFolders
    └── src/
        ├── lib/
        │   ├── normalization.ts     ← ELIMINADO
        │   └── types.ts             ← ELIMINADO
        └── ...
```

### 5.2 Descripción de cada submódulo

**`packages/domain/src/types.ts`**
Contrato de dominio compartido. Define todos los tipos que cruzan la frontera backend/mobile: `PharmacySlug`, `PriceChannels`, `PharmacyPrice`, `ScrapedProduct`, `MedicationResult`, `PharmacySearchDiagnostic`, `SearchExecution`. Sin lógica — solo definiciones de tipos.

**`packages/domain/src/matching.ts`**
Contiene `matchKey()`. Es el submódulo más crítico: genera la clave canónica de identidad usada en deduplicación, favoritos y alertas de precio. Aquí reside la corrección de la divergencia (normalización de guiones y short-word merging). Sin dependencias externas — TypeScript puro que opera sobre strings.

**`packages/domain/src/normalization.ts`**
Contiene `cleanQuery()`. Limpia la query del usuario (posología, stop words, paréntesis, duplicados) antes de enviarla a las APIs de farmacia. Sin dependencias externas.

**`packages/domain/src/pricing.ts`**
Contiene `effectivePrice()`, `toPharmacyPrice()` y `toMedicationResult()`. Transforma datos crudos de scrapers (`ScrapedProduct`) en el modelo de dominio tipado (`PharmacyPrice`, `MedicationResult`). Importa desde `./types.js` y `./matching.js`.

**`packages/domain/src/deduplication.ts`**
Contiene `mergeDuplicates()`. Agrupa y fusiona `MedicationResult[]` por `matchKey`, eligiendo nombre canónico, imagen y mejor precio por farmacia. Importa desde `./types.js` y `./pricing.js`.

**`packages/domain/src/index.ts`**
Punto de entrada público. Re-exporta todo de los cinco submódulos. Es la única interfaz que `api/` y `mobile/` necesitan conocer — pueden importar desde `@comparafarma/domain` directamente.

### 5.3 Diagrama de dependencias propuesto

```
┌────────────────────────────────────────────────────────────────┐
│  @comparafarma/domain  (packages/domain/src/)                   │
│                                                                  │
│  types.ts          matching.ts       normalization.ts            │
│  ─ PharmacySlug    ─ matchKey()      ─ cleanQuery()              │
│  ─ PriceChannels                                                 │
│  ─ PharmacyPrice   pricing.ts        deduplication.ts            │
│  ─ ScrapedProduct  ─ effectivePrice  ─ mergeDuplicates()         │
│  ─ MedicationResult─ toPharmacyPrice                             │
│  ─ ...             ─ toMedicResult                               │
│                                                                  │
│  ↑ types.ts ← todo lo demás                                      │
│  ↑ matching.ts ← pricing.ts, deduplication.ts                    │
│  ↑ pricing.ts ← deduplication.ts                                 │
└──────────────────────────────┬─────────────────────────────────┘
                               │ importado como @comparafarma/domain
                      ┌────────┴────────┐
                      │                 │
            ┌─────────▼──────┐  ┌──────▼────────────┐
            │  api/           │  │  mobile/            │
            │  searchService  │  │  useSearch.ts       │
            │  routes/search  │  │  alertsStore.ts     │
            │  *.test.ts      │  │  favoritesStore.ts  │
            │                 │  │  ...                │
            └─────────────────┘  └────────────────────┘
```

**Regla de dependencias internas del paquete:**
- `types.ts` — sin imports internos
- `matching.ts` — importa solo desde `./types.js`
- `normalization.ts` — sin imports internos
- `pricing.ts` — importa desde `./types.js` y `./matching.js`
- `deduplication.ts` — importa desde `./types.js` y `./pricing.js`
- `index.ts` — re-exporta todos los submódulos

No hay dependencias circulares. `api/` y `mobile/` no son dependencias del paquete.

---

## 6. API Pública del Paquete

Todas las funciones y tipos a continuación son exportados desde `@comparafarma/domain`. La implementación proviene de la versión canónica en `api/src/lib/normalization.ts`, distribuida por responsabilidad en los submódulos descritos en la sección 5.

---

### Submódulo `matching`

#### `matchKey(name: string): string`

Genera una clave canónica a partir del nombre de un producto farmacéutico. Es el núcleo del sistema de deduplicación y la clave de identidad para favoritos y alertas.

**Formato del resultado:** `{marca}|{dosis}|{turno}|{cantidad}` (campos opcionales se omiten)

**Reglas de transformación:**
1. Normaliza acentos (NFD unicode decomposition).
2. Convierte a minúsculas.
3. Normaliza guiones entre palabras: `"Trio-Val"` → `"trioval"`.
4. Extrae la primera palabra de marca (alfabética, no stop word, no empieza con dígito).
5. Short-word merging: si la primera palabra tiene ≤4 letras y la siguiente también ≤4, las une.
6. Extrae dosis en mg, ml, mcg o g (g se convierte a mg).
7. Extrae cantidad de unidades (`x 30`, `16 comprimidos`, etc.).
8. Normaliza qty=1 a vacío (unidad singular no es discriminatoria).
9. Detecta indicador día/noche para antigripales (`d` o `n`).

**Ejemplos:**
```
"Paracetamol 500 mg x 16 Comprimidos"  →  "paracetamol|500mg|16"
"Trio-Val 80mg x 30 Comprimidos"       →  "trioval|80mg|30"
"Co-Amoxiclav 500mg 21 Cápsulas"       →  "coamoxiclav|500mg|21"
"Tapsin Plus Día 16 Comprimidos"        →  "tapsin|d|16"
"Tapsin Plus Noche 16 Comprimidos"      →  "tapsin|n|16"
"Amoxicilina 0.5g Cápsulas"            →  "amoxicilina|500mg"
```

**Contrato:** retorna siempre un `string` no vacío. Nunca lanza excepciones.

---

### Submódulo `normalization`

#### `cleanQuery(raw: string): string`

Limpia una query de búsqueda removiendo información farmacológica y posológica que confundiría a las APIs de farmacia.

**Comportamiento:**
- Corta el texto en la primera palabra de posología (`dosis`, `cada`, `vía`, `tomar`, etc.).
- Elimina contenido entre corchetes `[]` y paréntesis `()`.
- Filtra stop words farmacéuticas (formas farmacéuticas, unidades de medida).
- Deduplica palabras con `Set`.

**Ejemplos:**
```
"Paracetamol 500mg tomar cada 8 horas"  →  "Paracetamol"
"Ibuprofeno 400 mg comprimidos"         →  "Ibuprofeno"
"500 mg comprimidos"                    →  ""  (vacío — sin nombre significativo)
```

**Contrato:** retorna `string`. Puede retornar `""` si el input no contiene palabras significativas.

---

### Submódulo `pricing`

#### `effectivePrice(channels: { store: number; online: number | null; cmr: number | null; sbpay: number | null }): number`

Calcula el precio efectivo (el menor disponible) a partir de los canales de precio disponibles.

**Comportamiento:**
- Retorna `min(store, online ?? store, cmr ?? store, sbpay ?? store)`.
- Un canal `null` no introduce precios fantasma de 0 — se usa `store` como fallback.

**Ejemplos:**
```
{store:3290, online:2490, cmr:null, sbpay:2290}  →  2290
{store:1500, online:null, cmr:null, sbpay:null}   →  1500
{store:1000, online:null, cmr:750, sbpay:null}    →  750
```

---

#### `toPharmacyPrice(product: ScrapedProduct, pharmacySlug: PharmacySlug, pharmacyName: string): PharmacyPrice`

Convierte un `ScrapedProduct` crudo (salida de un cliente de farmacia) en un `PharmacyPrice` normalizado, calculando el `effective` price y agregando metadatos de farmacia.

**Contrato:** dado un `ScrapedProduct` válido, retorna siempre un `PharmacyPrice` completo.

---

#### `toMedicationResult(product: ScrapedProduct, pharmacySlug: PharmacySlug, pharmacyName: string): MedicationResult`

Convierte un `ScrapedProduct` crudo en un `MedicationResult` completo. Calcula el `matchKey` del nombre del producto y construye el array `prices` con un único `PharmacyPrice`.

**Contrato:** dado un `ScrapedProduct` válido, retorna siempre un `MedicationResult` completo.

---

### Submódulo `deduplication`

#### `mergeDuplicates(results: MedicationResult[]): MedicationResult[]`

Agrupa una lista de `MedicationResult` por `matchKey`, fusionando en un único resultado todos los que representan el mismo medicamento de distintas farmacias.

**Comportamiento:**
- Agrupa por `matchKey`.
- Para el nombre canónico, elige: (1) el que tiene laboratorio; (2) si ambos tienen, el de nombre más corto.
- Para precios, mantiene el mejor precio efectivo por farmacia.
- Para imagen, usa el primer `imageUrl` no-null del grupo.
- Retorna el array con `bestPrice` y `bestPharmacy` actualizados.

**Contrato:** dado un array de `MedicationResult[]`, retorna un array sin duplicates de `matchKey`. El orden no está garantizado — el ordenamiento por precio es responsabilidad del llamador.

---

### Submódulo `types` — Tipos exportados

```typescript
type PharmacySlug =
  | "cruz-verde" | "salcobrand" | "ahumada" | "dr-simi"
  | "araucomed" | "ecofarmacias" | "farmex" | "sermecoop" | "easyfarma";

interface PriceChannels {
  store: number;
  online: number | null;
  cmr: number | null;
  sbpay: number | null;
  effective: number;
}

interface PharmacyPrice {
  pharmacySlug: PharmacySlug;
  pharmacyName: string;
  productName: string;
  channels: PriceChannels;
  hasStock: boolean;
  hasOnlineDelivery: boolean;
  onlineUrl: string | null;
  imageUrl: string | null;
  fetchedAt: string;    // ISO timestamp
}

interface ScrapedProduct {
  name: string;
  price: number;
  onlinePrice: number | null;
  cmrPrice: number | null;
  sbpayPrice: number | null;
  hasStock: boolean;
  hasOnlineDelivery: boolean;
  onlineUrl: string | null;
  imageUrl: string | null;
  laboratory: string | null;
  isBioequivalent: boolean;
}

interface MedicationResult {
  matchKey: string;
  canonicalName: string;
  laboratory: string | null;
  isBioequivalent: boolean;
  prices: PharmacyPrice[];
  bestPrice: number;
  bestPharmacy: PharmacySlug;
  imageUrl: string | null;
}

interface PharmacySearchDiagnostic {
  pharmacySlug: PharmacySlug;
  pharmacyName: string;
  status: "fulfilled" | "rejected";
  resultCount: number;
  durationMs: number;
  errorMessage: string | null;
}

interface SearchExecution {
  results: MedicationResult[];
  diagnostics: {
    query: string;
    totalResults: number;
    mergedResults: number;
    durationMs: number;
    pharmacies: PharmacySearchDiagnostic[];
  };
}
```

---

## 7. Plan de Migración

La migración se hace en **6 fases incrementales**. Cada fase es verificable de forma independiente. Los pasos 1–5 son totalmente reversibles.

### Fase 0 — Baseline (30 min)

Documentar el estado actual antes de cualquier cambio.

**Acciones:**
- Ejecutar `pnpm --filter api test` y guardar la salida como baseline.
- Ejecutar `pnpm typecheck` y confirmar que pasa con 0 errores.
- Anotar el valor actual de `CACHE_PREFIX` en `mobile/src/lib/cache.ts` (`"search_cache_v9_"`).

**Criterio:** los tests y el typecheck pasan antes de empezar.

---

### Fase 1 — Crear el paquete vacío (1 hora)

**Acciones:**
1. Crear el directorio `packages/domain/`.
2. Crear `packages/domain/package.json` con `name: "@comparafarma/domain"`, `version: "1.0.0"`, `private: true`.
3. Crear `packages/domain/tsconfig.json`.
4. Crear `packages/domain/src/index.ts` vacío.
5. Actualizar `pnpm-workspace.yaml` para incluir `"packages/*"`.
6. Ejecutar `pnpm install` en la raíz.

**Verificación:**
- `ls node_modules/@comparafarma/domain` muestra el symlink de pnpm.
- `pnpm typecheck` sigue pasando.

**Rollback:** eliminar `packages/`, revertir `pnpm-workspace.yaml`, ejecutar `pnpm install`.

---

### Fase 2 — Mover tipos (1 hora)

**Acciones:**
1. Crear `packages/domain/src/types.ts` con el contenido de `api/src/lib/types.ts` (la versión más completa y actualizada).
2. Reconciliar si existen diferencias menores entre `api/src/lib/types.ts` y `mobile/src/lib/types.ts`.
3. Agregar re-exports a `packages/domain/src/index.ts`.
4. Convertir `api/src/lib/types.ts` en re-export temporal: `export type * from "@comparafarma/domain";`
5. Convertir `mobile/src/lib/types.ts` en re-export temporal: `export type * from "@comparafarma/domain";`

**Verificación:** `pnpm typecheck` pasa con 0 errores.

**Rollback:** revertir `api/src/lib/types.ts` y `mobile/src/lib/types.ts` a su contenido original.

---

### Fase 3 — Mover funciones por submódulo (2.5 horas)

**Acciones:**
1. Crear `packages/domain/src/matching.ts` con la función `matchKey()` de `api/src/lib/normalization.ts`. Ajustar imports internos a `./types.js`.
2. Crear `packages/domain/src/normalization.ts` con la función `cleanQuery()`. Sin imports internos.
3. Crear `packages/domain/src/pricing.ts` con `effectivePrice()`, `toPharmacyPrice()` y `toMedicationResult()`. Imports desde `./types.js` y `./matching.js`.
4. Crear `packages/domain/src/deduplication.ts` con `mergeDuplicates()`. Imports desde `./types.js` y `./pricing.js`.
5. Actualizar `packages/domain/src/index.ts` para re-exportar todos los submódulos.
6. Agregar `vitest` como `devDependency` del paquete.
7. Crear los tests por submódulo en `packages/domain/src/__tests__/` (ver sección 10).
8. Convertir `api/src/lib/normalization.ts` en re-export temporal.

**Verificación:**
- `pnpm --filter @comparafarma/domain test` pasa.
- `pnpm --filter api test` pasa.
- `pnpm typecheck` pasa.

**Rollback:** revertir `api/src/lib/normalization.ts` a su contenido original.

---

### Fase 4 — Migrar mobile (2 horas)

**Acciones:**
1. Agregar `@comparafarma/domain: "workspace:*"` a `mobile/package.json`.
2. Ejecutar `pnpm install`.
3. Agregar `packages/domain` a `watchFolders` en `metro.config.js`.
4. Agregar `@comparafarma/domain` a las rutas de resolución en `mobile/tsconfig.json` (opcional pero recomendado para el TypeScript language server).
5. Convertir `mobile/src/lib/normalization.ts` en re-export temporal.
6. Convertir `mobile/src/lib/types.ts` en re-export temporal.

**Verificación:**
- `pnpm typecheck` pasa.
- La app compila con `expo start` sin errores.
- Búsqueda de "paracetamol" retorna resultados correctos.
- `matchKey("Trio-Val 80mg")` produce `"trioval|80mg"` (verificar via `console.log` temporal o `?debug=1`).

**Rollback:** revertir `metro.config.js`, `mobile/package.json`, y los re-exports de `normalization.ts` y `types.ts`.

---

### Fase 5 — Invalidar caché mobile (15 min)

Dado que `matchKey` ahora produce resultados distintos para nombres con guiones y short-word merging, el caché de mobile y los datos de alertas/favoritos tienen inconsistencias.

**Acciones:**
1. Incrementar `CACHE_PREFIX` en `mobile/src/lib/cache.ts`: `"search_cache_v9_"` → `"search_cache_v10_"`.

**Nota sobre alertas y favoritos:** Los `matchKey` guardados en `alertsStore` y `favoritesStore` con el valor antiguo quedarán huérfanos pero no causarán errores de runtime — simplemente no encontrarán su `MedicationResult` en los resultados. Es el mismo comportamiento que tenían con el bug. Los nuevos favoritos y alertas creados post-migración funcionarán correctamente.

**Verificación:** al abrir la app, el caché de búsquedas está limpio (usuarios ven un loader en la primera búsqueda).

---

### Fase 6 — Limpieza final (1 hora)

**Acciones:**
1. Eliminar `api/src/lib/normalization.ts` (el re-export temporal).
2. Eliminar `api/src/lib/types.ts` (el re-export temporal).
3. Eliminar `mobile/src/lib/normalization.ts` (el re-export temporal).
4. Eliminar `mobile/src/lib/types.ts` (el re-export temporal).
5. Actualizar todos los imports directos en `api/` y `mobile/` para apuntar a `@comparafarma/domain`.
6. Actualizar `.github/workflows/ci.yml` para incluir el job de tests del nuevo paquete.

**Archivos con imports a actualizar:**

_api/:_
- `api/src/services/searchService.ts`
- `api/src/routes/search.ts`
- `api/src/__tests__/normalization.test.ts`
- `api/src/__tests__/searchService.test.ts`
- `api/src/__tests__/ahumada.test.ts`
- `api/src/__tests__/cruzverde.test.ts`
- `api/src/__tests__/salcobrand.test.ts`
- `api/src/__tests__/drsimi.test.ts`

_mobile/:_
- `mobile/src/hooks/useSearch.ts`
- `mobile/src/lib/search.ts`
- `mobile/src/lib/cache.ts`
- `mobile/src/lib/priceHistory.ts`
- `mobile/src/store/alertsStore.ts`
- `mobile/src/store/favoritesStore.ts`
- `mobile/src/store/searchStore.ts`
- `mobile/src/store/cartStore.ts`
- Cualquier componente que importe `MedicationResult` directamente

**Verificación:**
```bash
# Debe retornar sin resultados (no hay referencias a los archivos eliminados)
grep -r "from.*lib/normalization" api/src mobile/src
grep -r "from.*lib/types" api/src mobile/src

pnpm typecheck                           # 0 errores
pnpm --filter api test                   # verde
pnpm --filter @comparafarma/domain test  # verde
```

**Rollback:** este paso elimina archivos. Una vez completado y con el PR mergeado, el rollback requeriría revertir el commit completo. Por eso es importante verificar exhaustivamente en la fase 4 antes de llegar aquí.

---

### Resumen del plan

| Fase | Descripción | Duración | Reversible |
|---|---|---|---|
| 0 | Baseline | 30 min | — |
| 1 | Crear paquete vacío | 1 hora | ✅ Sí |
| 2 | Mover tipos | 1 hora | ✅ Sí |
| 3 | Mover funciones por submódulo + tests | 2.5 horas | ✅ Sí |
| 4 | Migrar mobile | 2 horas | ✅ Sí |
| 5 | Invalidar caché | 15 min | ✅ Sí |
| 6 | Limpieza final | 1 hora | ⚠️ Con revert de commit |
| **Total** | | **~8 horas** | |

---

## 8. Compatibilidad

### Mobile

| Feature | Estado post-migración |
|---|---|
| Búsqueda de medicamentos | ✅ Sin cambio |
| `cleanQuery` en `useSearch` | ✅ Misma función, ahora desde submódulo `normalization` |
| Cache mobile (AsyncStorage) | ✅ Invalidado limpiamente via `CACHE_PREFIX v10_` |
| Favoritos existentes | ⚠️ Con `matchKey` antiguo quedan huérfanos para nombres con guiones. Nuevos favoritos funcionan correctamente. |
| Alertas de precio existentes | ⚠️ Ídem favoritos. Bug era previo, no es regresión. Nuevas alertas funcionan correctamente. |
| Filtro por bioequivalente | ✅ Sin cambio |
| Historial de búsquedas | ✅ Sin cambio |

### Backend

| Feature | Estado post-migración |
|---|---|
| `searchMedications` / `searchMedicationsDetailed` | ✅ Sin cambio funcional |
| `mergeDuplicates` | ✅ Misma función, ahora desde submódulo `deduplication` |
| Cache Redis | ✅ Sin cambio (clave de cache basada en query, no en `matchKey`) |
| Diagnósticos / debug mode | ✅ Sin cambio |

### Tests

| Suite | Estado post-migración |
|---|---|
| `api/src/__tests__/normalization.test.ts` | Migrar al paquete (distribuidos por submódulo). |
| `api/src/__tests__/searchService.test.ts` | Actualizar imports únicamente. |
| `api/src/__tests__/*.test.ts` (clientes) | Actualizar imports únicamente. |
| `packages/domain/src/__tests__/` | NUEVO — suites por submódulo. |

### Cache

- **Mobile (AsyncStorage):** invalidar via `CACHE_PREFIX` `v9_` → `v10_`. Coste: los usuarios hacen un fetch en la primera búsqueda post-actualización. Impacto mínimo.
- **Backend (Upstash Redis):** no requiere invalidación. La clave de caché es el query string limpio, no el `matchKey`. Los resultados almacenados incluyen `matchKey` pre-calculado — estos tendrán el `matchKey` correcto (el del backend) desde antes de la migración.

### Alertas y favoritos

Los datos en AsyncStorage tienen la forma:
```json
{ "matchKey": "trio|80mg|30", "canonicalName": "Trio-Val 80mg", ... }
```

Post-migración, el backend retornará `matchKey: "trioval|80mg|30"` para ese medicamento. La comparación `alert.matchKey === result.matchKey` fallará para alertas creadas antes de la migración con nombres que tenían guiones.

**Decisión:** no se migran los datos existentes. El impacto es bajo (el bug ya existía), y la migración de datos de AsyncStorage agrega complejidad innecesaria. Los usuarios afectados solo necesitan recrear su alerta una vez.

### Analytics (PostHog)

Sin impacto. `captureSearch` reporta `results_count`, `best_price` y `pharmacies_with_results` — ninguno depende de `matchKey`.

---

## 9. Riesgos

### R-01 — Metro Bundler no transforma TypeScript desde `node_modules`

| | |
|---|---|
| **Probabilidad** | Media |
| **Impacto** | Alto — la app mobile no compila |
| **Descripción** | Metro excluye por defecto la transformación Babel de `node_modules`. Si el paquete exporta TypeScript fuente, Metro puede rechazarlo. |
| **Señal de detección** | Error en `expo start`: `"Cannot use import statement"` o `"SyntaxError: Unexpected token"` al cargar `@comparafarma/domain`. |
| **Mitigación primaria** | Agregar la ruta del paquete a `metro.config.js` `watchFolders` permite que Metro lo transforme como código del workspace, no como librería externa. |
| **Mitigación alternativa** | Si lo anterior falla: compilar el paquete con `tsc --outDir dist` y apuntar `exports` a `./dist/index.js`. Esto elimina la dependencia en Babel para el paquete. |

### R-02 — NodeNext requiere extensión `.js` en imports internos del paquete

| | |
|---|---|
| **Probabilidad** | Alta — el `api/` tsconfig usa `"moduleResolution": "NodeNext"` |
| **Impacto** | Bajo — error de compilación detectado en `pnpm typecheck`, no en runtime |
| **Descripción** | `import type { X } from "./types"` falla en NodeNext; debe ser `"./types.js"`. Aplica a todos los imports entre submódulos: `matching.js`, `pricing.js`, etc. |
| **Mitigación** | Usar siempre extensión `.js` en los imports internos del paquete. Verificar con `pnpm typecheck` en la Fase 3. |

### R-03 — Favoritos y alertas con `matchKey` antiguo quedan huérfanos

| | |
|---|---|
| **Probabilidad** | Alta (cualquier usuario con alertas sobre medicamentos con guiones) |
| **Impacto** | Bajo — mismo comportamiento que el bug actual, no es una regresión |
| **Descripción** | Alertas creadas antes de la migración con `matchKey` viejo (`trio|80mg`) no encontrarán el resultado con `matchKey` nuevo (`trioval|80mg`). |
| **Mitigación** | Documentar en release notes. No requiere código. |
| **Mitigación futura** | Agregar `matchKeyVersion` a `PriceAlert` para detectar entradas antiguas y guiar al usuario a recrearlas. |

### R-04 — Symlink de pnpm no detectado por Metro en Windows

| | |
|---|---|
| **Probabilidad** | Baja (la config de Metro actual ya resuelve symlinks de pnpm correctamente) |
| **Impacto** | Alto — Metro no puede resolver el módulo |
| **Descripción** | Aunque Metro ya resuelve paquetes del workspace root, los symlinks a `packages/domain` podrían no ser seguidos. |
| **Mitigación** | Agregar `packages/domain` explícitamente a `config.watchFolders` en `metro.config.js`. Si persiste, usar path alias en `tsconfig.json` del mobile: `"@comparafarma/domain": ["../packages/domain/src/index.ts"]`. |

### R-05 — CI no ejecuta tests del nuevo paquete

| | |
|---|---|
| **Probabilidad** | Media — el workflow actual no conoce el nuevo workspace |
| **Impacto** | Medio — divergencias futuras no serán detectadas automáticamente |
| **Descripción** | El job `api-tests` en `ci.yml` usa `pnpm --filter api test`. El nuevo paquete no está cubierto. |
| **Mitigación** | Agregar en Fase 6: `pnpm --filter @comparafarma/domain test` al CI. |

### R-06 — Conflicto de versión de TypeScript entre workspaces

| | |
|---|---|
| **Probabilidad** | Baja — todos los workspaces usan `typescript: ^5.x` |
| **Impacto** | Bajo — warnings, no errores críticos |
| **Mitigación** | Usar la misma `devDependency` de TypeScript en el nuevo paquete que en `api/` y `mobile/`. |

### R-07 — Performance de resolución de módulos en Metro (iOS/Android)

| | |
|---|---|
| **Probabilidad** | Baja |
| **Impacto** | Bajo — podría añadir milisegundos al startup de Metro |
| **Descripción** | Agregar un nuevo `watchFolder` aumenta el grafo de archivos que Metro vigila. Con 5 submódulos el impacto sigue siendo negligible (~300 líneas de TypeScript en total). |
| **Mitigación** | No requiere acción. Si se convierte en problema, aplicar `blockList` en Metro para excluir archivos de test del paquete. |

---

## 10. Testing Strategy

### 10.1 Tests del paquete compartido (automatizados, obligatorios)

Cada submódulo tiene su propio archivo de tests en `packages/domain/src/__tests__/`. Esta separación hace evidente qué submódulo falla cuando un test rompe.

---

**`matching.test.ts` — mínimo 15 casos, con los 3 casos de regresión obligatorios:**
- Caso básico: `"Paracetamol 500 mg x 16 Comprimidos"` → `"paracetamol|500mg|16"`
- 🔴 Regresión guión: `"Trio-Val 80mg x 30"` → `"trioval|80mg|30"`
- 🔴 Regresión guión: `"Co-Amoxiclav 500mg 21 Cápsulas"` → `"coamoxiclav|500mg|21"`
- 🔴 Regresión short-word: `"Tri Fen 10mg"` → `"trifen|10mg"`
- Día/noche diferentes: `"Tapsin Plus Día 16"` ≠ `"Tapsin Plus Noche 16"`
- Conversión gramos a mg: `"Amoxicilina 0.5g"` → `"amoxicilina|500mg"`
- Qty 1 normalizado a vacío: `"Tapsin 1 Sobre"` → `"tapsin"` (sin `|1`)
- Sin dosis ni qty: `"Paracetamol"` → `"paracetamol"`
- Acentos normalizados: `"Ibuprofeno Día"` → `"ibuprofeno|d"`
- Nombre con ml: `"Salbutamol 100mcg/dosis Inhalador"` → manejo correcto
- Nombre empieza con número: no lanza excepción
- Nombre muy corto: no lanza excepción
- Múltiples unidades en el nombre: toma el valor correcto

**`normalization.test.ts` — mínimo 8 casos:**
- Query con posología cortada correctamente
- Solo stop words → retorna `""`
- Con paréntesis y corchetes → limpiado
- Con palabras duplicadas → deduplicado
- Input vacío → `""`
- Input solo numérico → `""`
- Query multilínea pegado de prospecto → cortado en primera palabra de posología
- Query con caracteres especiales → limpiado

**`pricing.test.ts` — mínimo 8 casos:**
- `effectivePrice`: solo store / online más barato / CMR más barato / SBPay más barato / todos iguales / precio 0
- `toPharmacyPrice`: ScrapedProduct completo → PharmacyPrice con effective calculado
- `toMedicationResult`: ScrapedProduct → MedicationResult con matchKey correcto

**`deduplication.test.ts` — mínimo 5 casos:**
- Fusión básica de 2 farmacias distintas
- 3 farmacias — orden por precio efectivo correcto
- Selección de nombre con laboratorio preferido
- Selección de imagen del grupo
- Misma farmacia dos veces — queda con el precio efectivo más bajo

**`contract.test.ts` — snapshot tests:**
```
para cada fixture JSON de los clientes (cruzverde, salcobrand, drsimi):
  matchKey(product.name) debe coincidir con el snapshot guardado
```
Los snapshots se actualizan explícitamente con `vitest --update-snapshots`. Cualquier cambio accidental a `matchKey` rompe el snapshot y exige revisión.

---

### 10.2 Tests de integración en CI (automatizados, obligatorios)

Agregar al `ci.yml`:
```yaml
- name: Test domain package
  run: pnpm --filter @comparafarma/domain test
```

Este job debe ejecutarse en paralelo con `api-tests`, no como dependencia de él.

### 10.3 Tests de regresión pre-merge (manuales, obligatorios)

Antes de hacer merge del PR de limpieza final (Fase 6):
1. `pnpm typecheck` — 0 errores.
2. `pnpm --filter api test` — verde.
3. `pnpm --filter @comparafarma/domain test` — verde.
4. Ejecutar `expo start` en el emulador Android sin errores de Metro.
5. Búsqueda de "paracetamol" → resultados de al menos 2 farmacias.
6. Verificar `matchKey("Trio-Val 80mg")` == `"trioval|80mg"` en mobile (via log o test unitario en la app).

### 10.4 Tests de humo post-deploy (manuales)

24 horas después del deploy:
1. Revisar Sentry — sin nuevos errores relacionados con normalización.
2. Revisar logs de Vercel — sin errores en `/api/search`.
3. Crear una nueva alerta de precio para un medicamento cualquiera y verificar que se dispara en la siguiente búsqueda donde el precio está por debajo del objetivo.

---

## 11. Rollback Plan

### Rollback durante Fases 1–5 (antes de la Fase 6)

Las fases 1–5 usan re-exports temporales, no eliminan archivos. El rollback es simple:

1. Revertir los archivos `api/src/lib/normalization.ts` y `api/src/lib/types.ts` a su contenido original (eliminar el re-export, restaurar la implementación).
2. Revertir los archivos `mobile/src/lib/normalization.ts` y `mobile/src/lib/types.ts` ídem.
3. Revertir `mobile/metro.config.js`, `mobile/package.json`, `api/package.json`.
4. Revertir `mobile/src/lib/cache.ts` al `CACHE_PREFIX` anterior (`v9_`).
5. Revertir `pnpm-workspace.yaml`.
6. Ejecutar `pnpm install`.
7. Eliminar `packages/domain/`.

**Tiempo estimado de rollback:** 30 minutos.

### Rollback después de la Fase 6 (archivos originales eliminados)

Si se detecta un problema crítico después de hacer merge del PR de la Fase 6:

**Opción A — Revert del commit:**
```bash
git revert <sha-del-commit-de-fase-6>
```
Restaura todos los archivos eliminados y revierte los cambios de imports.

**Opción B — Hotfix:**
Si el problema es puntual (ej: un import que quedó mal), aplicar un hotfix directamente sin revertir toda la migración.

**Criterio para elegir A vs B:** si el error afecta a más del 20% de los archivos modificados o bloquea el build, usar A. Si es un archivo aislado, usar B.

### Rollback de los datos de caché mobile

El incremento de `CACHE_PREFIX` es en sí el mecanismo de rollback para el caché: si se revierte el código a la versión anterior, basta con revertir también el `CACHE_PREFIX` a `v9_`. Los datos bajo `v10_` serán ignorados (tendrán TTL y expirarán naturalmente).

---

## 12. Definition of Done

El RFC se considera completamente implementado cuando **todos** los siguientes criterios están verificados y marcados:

### Código

- [ ] `packages/domain/` existe con `package.json`, `tsconfig.json`, y `src/`
- [ ] `pnpm-workspace.yaml` incluye `"packages/*"`
- [ ] `packages/domain/src/types.ts` contiene el contrato de dominio completo
- [ ] `packages/domain/src/matching.ts` contiene `matchKey()` (versión canónica con guiones + short-word)
- [ ] `packages/domain/src/normalization.ts` contiene `cleanQuery()`
- [ ] `packages/domain/src/pricing.ts` contiene `effectivePrice()`, `toPharmacyPrice()`, `toMedicationResult()`
- [ ] `packages/domain/src/deduplication.ts` contiene `mergeDuplicates()`
- [ ] `packages/domain/src/index.ts` re-exporta todos los submódulos
- [ ] `api/src/lib/normalization.ts` — eliminado
- [ ] `api/src/lib/types.ts` — eliminado
- [ ] `mobile/src/lib/normalization.ts` — eliminado
- [ ] `mobile/src/lib/types.ts` — eliminado
- [ ] Todos los imports en `api/` apuntan a `@comparafarma/domain`
- [ ] Todos los imports en `mobile/` apuntan a `@comparafarma/domain`
- [ ] `mobile/src/lib/cache.ts` usa `CACHE_PREFIX = "search_cache_v10_"`
- [ ] `mobile/metro.config.js` incluye `packages/domain` en `watchFolders`
- [ ] `api/package.json` tiene `@comparafarma/domain: "workspace:*"`
- [ ] `mobile/package.json` tiene `@comparafarma/domain: "workspace:*"`
- [ ] `.github/workflows/ci.yml` ejecuta `pnpm --filter @comparafarma/domain test`

**Verificación de limpieza (estos comandos deben retornar sin resultados):**
```bash
grep -r "from.*lib/normalization" api/src mobile/src
grep -r "from.*lib/types" api/src mobile/src
```

### Tests

- [ ] `pnpm --filter @comparafarma/domain test` — pasa (verde)
- [ ] `pnpm --filter api test` — pasa (verde)
- [ ] `pnpm typecheck` — 0 errores
- [ ] `matching.test.ts` tiene ≥ 15 casos, incluyendo los 3 casos de regresión obligatorios
- [ ] `contract.test.ts` tiene snapshots para al menos 4 nombres de medicamentos reales (fixtures del backend)
- [ ] Existen archivos de test para los 4 submódulos con lógica: `matching`, `normalization`, `pricing`, `deduplication`

### Runtime

- [ ] La app mobile compila sin errores (`expo start` en emulador Android)
- [ ] Búsqueda de "paracetamol" retorna resultados de al menos 2 farmacias
- [ ] `matchKey("Trio-Val 80mg")` produce `"trioval|80mg"` en mobile (mismo que backend)
- [ ] Crear una nueva alerta de precio y verificar que se dispara correctamente en la siguiente búsqueda coincidente

### Proceso

- [ ] PR aprobado por al menos 1 revisor técnico
- [ ] CHANGELOG actualizado: entrada de breaking change indicando que `matchKey` cambió para nombres con guiones y short-word pairs
- [ ] `docs/audits/AUDIT_SEARCH_NORMALIZATION.md` — CF-001 marcado como resuelto
- [ ] `docs/engineering/reviews/ER-002_SEARCH_ENGINE_FULL_REVIEW.md` — NORM-01 marcado como resuelto

---

## 13. Estimación

### Desglose por fase

| Fase | Tarea | Horas |
|---|---|---|
| 0 | Baseline y verificación | 0.5h |
| 1 | Crear paquete vacío + workspace config | 1h |
| 2 | Mover tipos + re-exports temporales | 1h |
| 3 | Crear 4 submódulos + tests por submódulo | 2.5h |
| 4 | Migrar mobile (metro + tsconfig + re-exports) | 2h |
| 5 | Invalidar caché | 0.25h |
| 6 | Limpieza final (eliminar archivos + actualizar imports) | 1.5h |
| — | Buffer para problemas de resolución de módulos | 1h |
| — | Code review + ajustes | 1h |
| **Total** | | **~11 horas** |

### Complejidad

**Complejidad técnica:** Media. La lógica de las funciones no cambia. El riesgo real está en la configuración del toolchain (Metro, NodeNext, pnpm symlinks).

**Complejidad de coordinación:** Baja. Un solo ingeniero puede ejecutar toda la migración. No requiere coordinación con otros equipos.

### Dependencias

- Ninguna dependencia externa. Todo el trabajo está en el repositorio.
- La Fase 4 (mobile) requiere un entorno con Android Studio / emulador configurado para verificar el runtime.
- Si existe un proceso de code freeze, la Fase 6 (limpieza) es la única que requiere window de deploy. Las fases 1–5 son seguras en cualquier momento.

---

## 14. Recomendación Final

**¿Se recomienda implementar este RFC?** ✅ **Sí. Aprobado. Con alta prioridad.**

### Por qué

**El problema ya está activo en producción.** La divergencia de `matchKey` no es un riesgo futuro — es un bug presente que hace que las alertas de precio fallen silenciosamente para un subconjunto de medicamentos (aquellos con guiones en el nombre o nombres compuestos de dos palabras cortas).

**La arquitectura de submódulos es la correcta para este dominio.** Separar `matching`, `normalization`, `pricing` y `deduplication` en módulos independientes refleja las responsabilidades reales del código: cada submódulo tiene una razón de cambio distinta, puede testearse de forma aislada, y es fácil de ubicar para cualquier ingeniero nuevo en el proyecto.

**La solución es permanente.** A diferencia de las alternativas A y B (sincronización manual o script de build), el paquete compartido hace que la divergencia sea estructuralmente imposible. No requiere disciplina de proceso ni scripts adicionales — cualquier cambio a `matchKey` es automáticamente visible en ambos consumidores.

**El costo de no hacerlo aumenta con el tiempo.** Cada nueva regla de normalización que se agregue al backend sin llegar al mobile amplía el daño. Cada usuario que crea una alerta de precio y nunca la ve dispararse erosiona la confianza en la feature.

### Condición previa al inicio

Antes de iniciar la implementación, verificar que el entorno de desarrollo tiene acceso a un emulador Android (o dispositivo físico) para poder ejecutar las verificaciones de runtime de la Fase 4. Sin eso, la migración de mobile no puede considerarse completa.
