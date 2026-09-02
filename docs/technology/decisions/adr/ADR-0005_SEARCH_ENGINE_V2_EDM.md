# ADR-0005 — Search Engine v2 alineado al Enterprise Data Model

**Estado:** Aprobado  
**Fecha:** 2026-09-01  
**Decisión relacionada:** CF-SEARCH-010 / GitHub #150  
**Evidencia:** `docs/qa/cf-search-010/`

---

## Contexto

La auditoría CF-SEARCH-010 reconstruyó el motor de búsqueda actual sobre datos reales de las 9 farmacias y concluyó que los defectos restantes no corresponden a un bug aislado, sino a una restricción estructural.

`matchKey` está acoplado a persistencia (`price_history`, `medication_match_key_aliases`, `pharmacy_clicks`, `email_alerts`) y `presentationKey` está acoplado a SEO/routing. Por ello, las correcciones de identidad han tenido que agregar ejes paralelos sin poder modificar la identidad en su capa natural.

La línea base auditada sobre 1.634 ofertas mostró:

- false merge observado: 0 %;
- 89,6 % de tarjetas de una sola farmacia;
- 75,9 % de presentaciones fragmentadas;
- 280/369 presentaciones repartidas en más de una tarjeta;
- 141 ofertas con volumen `x 100 ml` interpretado por la identidad legacy como cantidad de unidades;
- 65 ofertas donde `ambroxol` es tratado como variante comercial;
- 4 pares de productos con colisión real de hash de slug.

Los fixes previos son válidos y se conservan. La limitación está en dónde vive la decisión de identidad.

---

## Decisión

Se aprueba **BUILD_SEARCH_ENGINE_V2**.

Search Engine v2 se construirá en paralelo a v1 y alineado al Enterprise Data Model existente:

`CFM-CONCEPT-ID → CFM-PRESENTATION-ID → CFM-PRODUCT-ID → CFM-OFFER-ID`

No se creará un modelo conceptual alternativo al EDM.

### Separación obligatoria de responsabilidades

V2 deberá separar explícitamente:

1. retrieval;
2. canonicalization;
3. resolución de Concepto Farmacéutico;
4. resolución de Presentación Farmacéutica;
5. resolución de Producto Medicinal Comercial;
6. mapeo de Oferta;
7. query intent;
8. clasificación de relevancia;
9. grouping;
10. ranking;
11. routing/slug resolution.

La identidad no dependerá del ranking. El ranking no alterará identidad. La consulta del usuario no modificará la identidad canónica del producto.

---

## Compatibilidad y migración

La migración será aditiva, reversible y sin big bang.

- v1 continúa sirviendo el 100 % del tráfico hasta que v2 supere los gates definidos.
- `matchKey` y `presentationKey` se conservan indefinidamente como contratos legacy de compatibilidad.
- v2 inicia en shadow mode.
- históricos, alertas, clicks, aliases y URLs existentes no se invalidan.
- se deberá mantener mapping legacy → canonical IDs y diseñar dual-read/dual-write cuando corresponda.
- Mobile se migra al final, después del cierre de vc34.

---

## Gate S0 y criterio de abandono

Antes de cualquier migración de tráfico, S0 debe demostrar sobre corpus congelado:

- `offerCoverage >= 99,5 %`;
- `SPLIT_LOST = 0`;
- `falseMergeRate = 0`.

Si S0 no alcanza estos tres criterios, se detiene la iniciativa antes de una migración costosa.

---

## Componentes de v1 que se conservan

No se reescribe desde cero. Se reutilizan como mínimo:

- los 9 adapters;
- el modelo estructurado de concentración;
- `dosageFormClass`;
- `unitCountKey`;
- `combinationKey`;
- `commercialVariantKey` como extracción cuando corresponda, no como identidad canónica;
- `resolveBrandIdentity`;
- ranking/relevance actual como punto de partida, desacoplado de identidad.

---

## Consecuencias

### Positivas

- la identidad deja de depender de concatenaciones heurísticas usadas simultáneamente para persistencia, grouping y routing;
- permite reducir fragmentación sin reintroducir false merges;
- implementa la jerarquía que el EDM ya declara como lenguaje oficial;
- habilita de forma consistente históricos, bioequivalencia, sustitutos, ATC, observatorio y futuros productos de inteligencia farmacéutica.

### Costos y riesgos

- implementación transversal en domain/API/Web y posteriormente Mobile;
- nuevas identidades persistidas y mappings de compatibilidad;
- riesgo de iniciativa incompleta; mitigado mediante S0 pequeño, medible y abortable;
- la fuente regulatoria ISP actualmente documentada debe revalidarse antes de usarse como fuente de verdad canónica.

---

## Fuente ISP

La auditoría del 2026-09-01 encontró que la fuente de `datos.gob.cl` previamente considerada confirmada no es suficiente para identidad canónica hoy: DataStore reportó 0 registros y el CSV disponible declara actualización al 31-05-2016.

Hasta nueva validación, esta fuente queda **en revisión** y no constituye fuente de verdad para v2.

---

## Decisiones absorbidas / relacionadas

- `CF-SEARCH-004`: prerrequisito de baseline continuo.
- `CF-SEARCH-006`: absorbido por v2.
- `CF-SEARCH-007`: absorbido por v2.
- `CF-DATA-002`: absorbido por v2.
- Bioequivalencia converge parcialmente con v2, pero mantiene su dependencia de una fuente regulatoria confiable.

El quick win de capturar `ispRegistration` ya expuesto por Dr. Simi y Farmex se mantiene como trabajo independiente y no bloquea S0.

---

## Referencias

- `docs/enterprise/ENTERPRISE_DATA_MODEL.md`
- `docs/qa/cf-search-010/DECISION.md`
- `docs/qa/cf-search-010/SEARCH_ENGINE_V2.md`
- `docs/qa/cf-search-010/CANONICAL_IDENTITY_MODEL.md`
- `docs/qa/cf-search-010/MIGRATION_STRATEGY.md`
- `docs/qa/cf-search-010/SHADOW_MODE_DESIGN.md`
- GitHub issue #150
- PR #151
