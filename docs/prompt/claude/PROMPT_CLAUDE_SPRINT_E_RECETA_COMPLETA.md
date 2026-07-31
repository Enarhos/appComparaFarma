# Prompt para Claude Code — Sprint E: Comparación de receta completa

## Rol

Actuás como software factory senior sobre el monorepo de ComparaFarma. No rediseñes ni refactorices nada fuera del alcance descrito abajo. No toques `mobile/`, `packages/domain/` ni `api/` — esta feature es 100% aditiva sobre `web/`.

## Objetivo

Construir en `web/` una vista de "comparación de receta completa": el usuario agrega varios medicamentos (hasta 8) a una lista personal, y la app calcula y muestra dos alternativas de compra:

1. **"Todo en una farmacia"** — la farmacia más barata que tenga todos los items de la lista (o, si ninguna los tiene todos, la mejor cobertura parcial disponible, igual que ya hace `mobile/src/app/cart.tsx`).
2. **"Repartido al mejor precio"** — comprar cada medicamento en la farmacia donde sale más barato individualmente, aunque sean farmacias distintas.

Se muestra el total de cada alternativa y la diferencia en pesos entre ambas, para que el usuario decida entre comodidad (un solo lugar) y ahorro máximo (repartido).

Versión simple acordada con el CEO: **sin cuenta de usuario, sin link para compartir**. La lista vive únicamente en `localStorage` del navegador.

Leé antes de escribir código:
- `web/src/lib/search.ts` — función `searchMedications()` existente, no la modifiques.
- `web/src/lib/format.ts` — reutilizá `formatCLP()` para cualquier monto.
- `web/src/components/MedicationCard.tsx` y `web/src/app/medicamento/[slug]/page.tsx` — convención de props ya calculadas (el cálculo de "mejor precio" se hace en `lib/`/página, no dentro del componente de presentación).
- `mobile/src/app/cart.tsx` (**solo lectura, es referencia de diseño, no se toca `mobile/`**) — la función `calcTotals()` ahí ya resuelve la alternativa "todo en una farmacia" con cobertura parcial; portá esa lógica (adaptada, sin `activePharmacySlugs` de `useConfigStore`, derivando el universo de farmacias directamente de las `prices` presentes en los resultados).
- `web/src/test-utils.tsx` y cualquier `*.test.tsx` existente — patrón de testing del repo (import de `render`/`screen` desde `@/test-utils`, mock de `next/link` si aplica).
- Confirmado en investigación previa: `web/` no tiene ninguna `app/api/route.ts` — el fetch al backend siempre corre server-side, intencionalmente (comentario en `web/.env.example:1`). No agregues un Route Handler; usá **Server Actions** (`"use server"`) para mantener ese patrón.

## Restricciones duras

1. No modificar `mobile/`, `packages/domain/`, ni el contrato de `/api/search`. Verificable con `git diff --stat -- mobile/ packages/domain/ api/` vacío al final.
2. No agregar cuenta de usuario, autenticación, ni persistencia en base de datos para esta feature. Solo `localStorage`.
3. No agregar un link para compartir la lista (fuera de alcance de esta versión).
4. No exponer `API_URL` al cliente ni crear un Route Handler nuevo — usar Server Actions.
5. Límite duro de 8 medicamentos en la lista. Si el usuario intenta agregar un 9°, **bloquear y avisar** (no truncar en silencio como hace `mobile/`) — es una mejora consciente sobre el patrón de `mobile/`, no un error.
6. Reutilizar `formatCLP()` para todo monto en pesos. No reimplementar formato de moneda.
7. La lista debe sobrevivir a un refresh de página (persistida en `localStorage`), pero no necesita sincronizarse entre dispositivos ni navegadores.

## Implementación requerida

### A. Lógica pura (testeable sin React/Next)

Crear `web/src/lib/recipeList.ts`:
- `export const MAX_RECIPE_ITEMS = 8;`
- `export interface RecipeItem { matchKey: string; canonicalName: string; imageUrl: string | null; }`
- Funciones puras sobre arrays de `RecipeItem`: `addRecipeItem(items, newItem): { items: RecipeItem[]; result: "added" | "duplicate" | "full" }` (no duplica por `matchKey`, respeta `MAX_RECIPE_ITEMS`), `removeRecipeItem(items, matchKey): RecipeItem[]`.

Crear `web/src/lib/recipeComparison.ts`:
- Input: `MedicationResult[]` (uno por cada item de la lista que todavía existe en el backend; puede venir con menos elementos que la lista si algún producto ya no aparece).
- `export interface PharmacyTotal { pharmacySlug: PharmacySlug; pharmacyName: string; total: number; found: number; missing: number }`
- `computeAllInOneTotals(medications: MedicationResult[]): PharmacyTotal[]` — portá y adaptá `calcTotals()` de `mobile/src/app/cart.tsx`: para cada farmacia presente en al menos un resultado, suma `channels.effective` de los medicamentos que esa farmacia tiene, cuenta `found`/`missing`, ordena primero las que tienen cobertura completa (por `total` ascendente), después las parciales.
- `export interface SplitBreakdownItem { matchKey: string; canonicalName: string; pharmacySlug: PharmacySlug; pharmacyName: string; price: number }`
- `computeSplitTotal(medications: MedicationResult[]): { breakdown: SplitBreakdownItem[]; total: number }` — para cada medicamento, elegí la farmacia con `channels.effective` mínimo entre sus `prices`; sumá esos mínimos. **Esta función no existe en ningún lado del repo — es lógica nueva.**
- `export function compareOptions(allInOne: PharmacyTotal[], splitTotal: number): { bestAllInOneTotal: number | null; savings: number | null }` — `bestAllInOneTotal` es el total de la primera entrada con `missing === 0` de `allInOne` (o `null` si ninguna farmacia cubre todo); `savings = bestAllInOneTotal - splitTotal` cuando ambos existen, si no `null`.

Escribí tests unitarios completos para las tres funciones de arriba (`recipeList.test.ts`, `recipeComparison.test.ts`) con casos de cobertura completa, cobertura parcial, ninguna farmacia con cobertura completa, y empates de precio.

### B. Server Action

Crear `web/src/lib/actions/getRecipePrices.ts` con `"use server"` al inicio del archivo:
- `export async function getRecipePrices(items: { matchKey: string; canonicalName: string }[]): Promise<(MedicationResult | null)[]>`
- Para cada item, llamá `searchMedications(item.canonicalName)` (ya maneja errores devolviendo `{ results: [], error }`, no relances excepciones) y buscá dentro de `results` el elemento cuyo `matchKey === item.matchKey`. Si no aparece (producto descontinuado/renombrado), devolvé `null` en esa posición — nunca rompas el array completo por un item faltante.
- Las llamadas a `searchMedications` para distintos items pueden ir en paralelo (`Promise.all`).

### C. Hook cliente de la lista

Crear `web/src/lib/useRecipeList.ts` con `"use client"`:
- Hook `useRecipeList()` que lee/escribe `localStorage` bajo la key `"recipe-list-v1"`, usando las funciones puras de `recipeList.ts`.
- Hidratación segura para SSR: estado inicial `[]`, hidratar desde `localStorage` en un `useEffect` que corre una sola vez al montar (evitar leer `localStorage` durante el render del servidor).
- API expuesta: `{ items: RecipeItem[]; add(item: RecipeItem): "added" | "duplicate" | "full"; remove(matchKey: string): void; clear(): void; isInList(matchKey: string): boolean }`.

### D. Botón "Agregar a mi receta"

Crear `web/src/components/AddToRecipeButton.tsx` con `"use client"`:
- Props: `{ matchKey: string; canonicalName: string; imageUrl: string | null }`.
- Usa `useRecipeList()`. Muestra "Agregar a mi receta" / "✓ En tu receta" (toggle add/remove) según `isInList()`. Si `add()` devuelve `"full"`, mostrar mensaje visible "Ya tienes 8 medicamentos, el máximo por receta" (no fallar en silencio).
- Insertalo dentro de `web/src/components/MedicationCard.tsx` (junto al resto de acciones de la card) **y** en el header de `web/src/app/medicamento/[slug]/page.tsx` (junto al nombre/imagen del medicamento). En ambos casos el padre sigue siendo el mismo Server Component de siempre — solo se agrega este componente cliente como hijo, sin convertir la página entera en cliente.

### E. Indicador de la lista

Crear `web/src/components/RecipeLinkBadge.tsx` con `"use client"`: link a `/mi-receta` que muestra "Mi receta" y, si `items.length > 0`, un badge con el conteo. Insertalo donde ya vive `<SearchBox />` en `web/src/app/buscar/[query]/page.tsx` y en el header de `web/src/app/medicamento/[slug]/page.tsx` (no hay layout global compartido con nav — confirmá esto antes de asumir un lugar único; si encontrás un layout compartido mejor, usalo ahí una sola vez).

### F. Página de comparación

Crear `web/src/app/mi-receta/page.tsx`:
- `export const metadata = { robots: { index: false, follow: false } };` (página personal, no debe indexarse).
- Server Component mínimo que renderiza `<RecipeComparisonView />` (el componente cliente hace todo el trabajo real).

Crear `web/src/components/RecipeComparisonView.tsx` con `"use client"`:
- Usa `useRecipeList()`. Si `items.length === 0`: estado vacío con link a `/` o `/buscar` para empezar a agregar.
- Si hay items: al montar (y cada vez que cambie la lista de `matchKey`s), llamar a la Server Action `getRecipePrices()` con `startTransition`/estado de carga explícito.
- Con los resultados (filtrando los `null` y avisando si algún item ya no está disponible, con mensaje claro por nombre), calcular con `recipeComparison.ts`: `computeAllInOneTotals`, `computeSplitTotal`, `compareOptions`.
- Renderizar:
  - Lista de medicamentos agregados con botón de quitar (`removeRecipeItem` vía el hook).
  - Tarjeta "Todo en una farmacia": farmacia ganadora, total (`formatCLP`), si es cobertura parcial avisarlo ("Solo tiene N de M — falta: <nombres>", igual que el patrón de `mobile/cart.tsx` pero con nombres en vez de solo el conteo, que es mejor que lo que hoy tiene `mobile/` — no hace falta igualarlo, mejorarlo).
  - Tarjeta "Repartido al mejor precio": total y detalle de qué farmacia por cada medicamento.
  - Diferencia entre ambas ("Ahorras $X repartiendo" o "Es lo mismo, compra todo junto" si `savings <= 0` o es `null` por falta de cobertura completa en ninguna farmacia).

## Validación obligatoria

Ejecutar y confirmar en verde antes de reportar terminado:

```bash
pnpm --filter web typecheck
pnpm --filter web test
pnpm --filter web lint
pnpm --filter web build
git diff --stat -- mobile/ packages/domain/ api/
```

El último comando debe devolver **vacío**. Si no lo está, revertí lo que se haya tocado fuera de `web/` antes de continuar.

## Entrega final

No commitear ni hacer push salvo pedido explícito. El reporte final debe incluir:

1. Resumen de qué se construyó, en 3-4 líneas.
2. Lista de archivos creados/modificados (rutas exactas).
3. Decisiones técnicas tomadas que no estaban 100% especificadas en este prompt (y por qué).
4. Comandos ejecutados en "Validación obligatoria" y su resultado real (no asumido).
5. Deuda o limitaciones conocidas de esta versión (ej. qué pasa si `getRecipePrices` tarda mucho con 8 items en paralelo, qué pasa si dos medicamentos distintos comparten `canonicalName`).
6. Confirmación explícita de que `mobile/`, `packages/domain/` y el contrato de `/api/search` no se tocaron.

Si algo de lo descrito arriba no calza con el código real que encuentres al implementar (por ejemplo, si `calcTotals` en `mobile/cart.tsx` ya cambió de forma), priorizá la consistencia con el código real por sobre seguir este prompt al pie de la letra, y documentá la diferencia en el punto 3 del reporte final.
