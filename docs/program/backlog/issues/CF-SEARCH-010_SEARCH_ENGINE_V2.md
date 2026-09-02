# CF-SEARCH-010 — Search Engine v2 aligned to Enterprise Data Model

| Campo | Valor |
|---|---|
| **Workstream** | Product / Engineering |
| **Fase** | FASE 3 — Futuro |
| **Estado** | ✅ Decisión arquitectónica aprobada / implementación no iniciada |
| **Prioridad** | Alta |
| **CFPS** | 4,20 |
| **Decisión** | `BUILD_SEARCH_ENGINE_V2` |
| **Issue** | GitHub #150 |
| **ADR** | `ADR-0005_SEARCH_ENGINE_V2_EDM.md` |
| **Evidencia** | `docs/qa/cf-search-010/` |

---

## Problema

El motor v1 alcanzó 0 % de false merges observados en el corpus auditado, pero su arquitectura impide seguir mejorando cobertura de comparación sin tensionar contratos legacy.

Baseline CF-SEARCH-010:

- 1.634 ofertas reales;
- 89,6 % de tarjetas single-pharmacy;
- 75,9 % de presentaciones fragmentadas;
- 280/369 presentaciones repartidas en más de una tarjeta;
- 4,96 tarjetas por concepto farmacéutico aproximado;
- 4 pares de productos con colisión de hash de slug.

`matchKey` está congelado por persistencia y `presentationKey` por SEO/routing. Los fixes anteriores resolvieron defectos reales, pero la identidad sigue calculándose a partir de claves heurísticas con responsabilidades cruzadas.

---

## Objetivo

Construir Search Engine v2 en paralelo a v1, alineado al Enterprise Data Model:

`CFM-CONCEPT-ID → CFM-PRESENTATION-ID → CFM-PRODUCT-ID → CFM-OFFER-ID`

La nueva arquitectura debe separar identidad canónica, query intent, relevancia, grouping, ranking y routing.

---

## Métricas de éxito

Objetivo de producto/arquitectura:

- false merge = **0** como condición de bloqueo;
- tarjetas por concepto: 4,96 → **< 2,0**;
- tarjetas single-pharmacy: 89,6 % → **< 50 %**;
- precisión de presentación exacta: 24,5 % → **> 50 %**;
- colisiones de slug v2: 4 → **0**.

Gate S0 obligatorio antes de continuar:

- `offerCoverage >= 99,5 %`;
- `SPLIT_LOST = 0`;
- `falseMergeRate = 0`.

Si falla S0, la iniciativa se abandona antes de una migración costosa.

---

## Estrategia

1. v1 permanece intacto en producción salvo defectos críticos.
2. Crear foundation de identidad canónica v2.
3. Ejecutar v2 en shadow mode sobre el mismo tráfico/corpus.
4. Medir V1 vs V2 con criterios reproducibles.
5. Introducir mappings legacy → canonical IDs de forma aditiva.
6. Migrar Web/API solo cuando existan gates de evidencia.
7. Mantener históricos, alertas, clicks y URLs legacy.
8. Migrar Mobile al final, después de vc34.

---

## Dependencias y relación con backlog existente

| Ítem | Relación con CF-SEARCH-010 |
|---|---|
| `CF-SEARCH-004` — Métrica de cobertura de comparación | **Prerrequisito**: baseline continuo para comparar v1/v2 |
| `CF-SEARCH-006` — Robustez de `unitCountKey` | **Absorbido** por v2: quantity pasa a ser atributo de identidad de primera clase |
| `CF-SEARCH-007` — Sinónimos de variante comercial | **Absorbido** por v2 |
| `CF-DATA-002` — Tokens no-marca en identidad comercial | **Absorbido** por v2 |
| `BIOEQUIVALENCE-DATA-QUALITY-01` pasos posteriores | **Convergencia parcial**: v2 desacopla bioequivalencia de identidad legacy |
| `CF-WEB-002` follow-up de resolución | **Abordado** por identidad persistida/routing v2 |
| `CF-SEARCH-001` follow-up Mobile | **Abordado en migración**, no se cambia Mobile al inicio |
| Sprint B — Bioequivalentes | **Dependencia de datos sigue abierta**; fuente ISP debe revalidarse |

Los ítems absorbidos no deben ejecutarse como fixes estructurales independientes de v1 salvo que aparezca un defecto crítico de producción que requiera intervención puntual.

---

## Componentes a reutilizar

- 9 adapters;
- concentración estructurada;
- `dosageFormClass`;
- `unitCountKey`;
- `combinationKey`;
- `commercialVariantKey` como extractor, no como identidad canónica;
- `resolveBrandIdentity`;
- ranking/relevance actual como punto de partida.

---

## Quick win separado

Capturar de forma aditiva `ispRegistration` / identificadores upstream ya expuestos por Dr. Simi y Farmex. La auditoría estimó 230/1.634 ofertas (14,1 %) con identificador regulatorio fuerte disponible sin petición adicional.

Este trabajo **no bloquea S0** y debe gestionarse en ticket independiente.

---

## Riesgo de datos regulatorios

La fuente ISP de `datos.gob.cl` registrada previamente como confirmada debe revalidarse. La sonda del 2026-09-01 encontró DataStore con 0 filas y CSV declarado como actualizado al 31-05-2016. No usarla como fuente de verdad canónica hasta cerrar esa validación.

---

## Próximo incremento

Abrir **S0 — Canonical Identity + Shadow Evaluation Foundation** como ticket separado, pequeño, medible y abortable.

No iniciar aún migración de tráfico, URLs, históricos ni Mobile.
