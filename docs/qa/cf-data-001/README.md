# CF-DATA-001 — Brand / Laboratory Identity Quality

Evidencia de la campaña que separó **marca comercial**, **laboratorio/fabricante**
y **principio activo** en tres campos con semántica propia, y corrigió el mapeo
de las 9 farmacias según lo que cada campo **contiene medido**, no según cómo se
llama en el origen.

- **Base:** `origin/main` = `57cbd5d` (incluye CF-SEARCH-003 y CF-WEB-002)
- **Branch:** `fix/cf-data-001-brand-laboratory-identity`
- **Fecha de medición:** 2026-08-31

## Causa raíz

`ScrapedProduct.laboratory` → `MedicationResult.laboratory` era **un solo campo
con semántica distinta por farmacia**, y la UI lo rotulaba siempre igual.

| Farmacia | Campo | Lo que CONTIENE (medido) | % no-null |
|---|---|---|---:|
| salcobrand | `hit.brand` | **MARCA** | 100 % |
| dr-simi | `product.brand` | **FABRICANTE** (el nombre engaña: es VTEX) | 100 % |
| araucomed | `manufacturer_name` | **FABRICANTE** | 79,1 % |
| farmex | `vendor` | **FABRICANTE** | 100 % |
| cruz-verde | `hit.brand` | **NO EXISTE** — mapeo muerto | 0 % |
| ahumada / ecofarmacias / easyfarma / sermecoop | — | sin campo | 0 % |

De ahí los tres síntomas reportados por QA:

1. **"EUROLAB" / "ABBOTT" como Marca** — son fabricantes (Farmex `vendor`).
2. **"Marca no identificada"** en Tocalm / Pazbronq / Amrodil — vienen de las
   5 farmacias sin ningún campo, aunque la marca esté escrita en el nombre.
3. **Salcobrand aportaba una marca real** al mismo campo donde el resto pone
   fabricante, y la UI llamaba a las dos cosas "Marca".

Corrección de CF-QA-001: aquella campaña leyó el `hit.brand` de Salcobrand como
"contaminado con el nombre del producto" (≈83,5 % prefijo del nombre). La
medición de ahora (83,7 % prefijo, mismo patrón) muestra lo contrario: **el campo
es correcto, es una marca, y estaba mal clasificado**. Una marca comercial
coincide con el prefijo de su propio nombre de producto por definición.

## Archivos

| Archivo | Qué contiene |
|---|---|
| `QA_SUMMARY.md` | Métricas A/B completas, precisión medida, resultado de tests |
| `source-semantics.csv` | Matriz Fase 1: campo, archivo:línea, semántica medida, % no-null, mapeo propuesto |
| `before-after.csv` | Una fila por tarjeta (870): `laboratory` anterior vs `brand`/`manufacturer`/`activeIngredient` nuevos |
| `identity-impact.csv` | Fase 3: impacto sobre `matchKey`, `presentationKey`, dedup, slugs, SEO |
| `active-ingredient-vocabulary.csv` | Los 34 tokens de composición derivados, con sus conteos de evidencia |
| `representative-cases.md` | Casos concretos buenos y malos, con nombres reales |
| `scripts/` | Captura, derivación del vocabulario y arnés A/B — reproducibles |

## Diseño elegido

Tres campos nuevos en `MedicationResult`, **aditivos**:

- `brand` — marca comercial, o `null`. Un genérico legítimamente no tiene marca.
- `manufacturer` — laboratorio. **Nunca se infiere del nombre.**
- `activeIngredient` — molécula reconocida, o `null`.
- `brandSource` — `"structured" | "name" | "unknown"`, para auditar la procedencia.

`laboratory` **se mantiene con su valor exacto anterior** (`manufacturer ?? brand`)
como alias de compatibilidad. No es inercia: es lo que le sigue llegando a
`resolveCommercialIdentity()` y, por lo tanto, a `presentationKey`, que gobierna
la deduplicación y el hash del slug de las fichas Web. Ver
`legacyLaboratoryValue()` en `packages/domain/src/pricing.ts`.

**Resultado:** 0 cambios de `matchKey`, 0 de `presentationKey`, 0 de agrupación,
0 de slug. La capa de PRESENTACIÓN mejora; la de IDENTIDAD queda congelada.

### Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| Alimentar `presentationKey` con la marca ya saneada | Rotaría la clave de las ofertas de Salcobrand y de todas las que ganan marca derivada ⇒ slugs indexados rotos y una generación nueva en `resolveMedication.ts`. El ticket pide explícitamente no rotar masivamente. |
| Reemplazar `laboratory` en vez de conservarlo | `mobile/` lo consume en producción y es el input de la clave de identidad. |
| Derivar la marca sin vocabulario de moléculas (solo posicional) | Medido: 5,7 % de las marcas derivadas eran el principio activo. Inaceptable para un ticket cuyo objetivo es no confundirlos. |
| Vocabulario de moléculas escrito a mano | Se derivó algorítmicamente del catálogo real (`scripts/derive-inn.mjs`) para que sea medible, reproducible y ampliable sin criterio humano. |
| Corroboración cruzada entre las ofertas de una misma respuesta | Sería más cobertura, pero haría que `brand` dependiera de qué farmacias respondieron: el mismo producto cambiaría de marca entre búsquedas y entre entradas de caché. |
| Extraer el fabricante del texto libre del nombre | Prohibido por el ticket y correcto que lo esté: afirmaría quién fabrica un medicamento sin evidencia. |

## Plan de retiro de `laboratory`

No se ejecuta en este ticket. Requiere, en este orden:

1. `mobile/` deja de leer `laboratory` y pasa a `brand`/`manufacturer`
   (`MedicationListItem.tsx`, `medication.tsx`, `cart.tsx`) + bump de `CACHE_PREFIX`.
2. `api/src/lib/medicationRegistry.ts` decide qué persistir en la columna
   `laboratory` de Supabase (hoy escribe el alias) — implica migración de datos.
3. Recién entonces se puede quitar del contrato, con una generación de slug nueva
   solo si en ese momento se decide además cambiar el input de `presentationKey`.
