# CF-SEARCH-010 — Search Engine v2 aligned to Enterprise Data Model

**Tipo:** auditoría + diseño arquitectónico + documentación. **No hay cambios de código productivo.**

**Base:** `origin/main` @ `3a7b5a4a473817efeb38a4769726dcdc00789648` (merge del PR #149, CF-DATA-001).
**Branch:** `audit/cf-search-010-search-engine-v2-design`.
**Fecha de captura:** 2026-09-01 (UTC).

---

## 1. Qué responde este paquete

**Pregunta central:** después de seis correcciones consecutivas sobre la capa de
identidad, ¿el motor de búsqueda actual necesita otra corrección, una
simplificación, o un motor v2 alineado al Enterprise Data Model?

**Respuesta:** ver `DECISION.md`.

---

## 2. Documentos

| Documento | Qué contiene |
|---|---|
| `CURRENT_ARCHITECTURE.md` | El pipeline v1 reconstruido etapa por etapa, con las responsabilidades que cada función mezcla |
| `REGRESSION_TIMELINE.md` | Arqueología de los 6 cambios: qué resolvió cada uno, qué regla introdujo, qué riesgo dejó abierto |
| `QUERY_TRACES.md` | Trazas reales oferta por oferta; el caso `ambroxol 30mg` completo |
| `CURRENT_METRICS.md` | Línea base medida del motor v1 sobre 16 consultas / 1.447 tarjetas / 1.634 ofertas |
| `EDM_GAP_ANALYSIS.md` | Matriz entidad EDM → implementación actual → brecha → riesgo → dato necesario |
| `CANONICAL_IDENTITY_MODEL.md` | Modelo de datos canónico propuesto (Concepto / Presentación / Producto / Oferta) + concentración |
| `QUERY_INTENT_V2.md` | Intención de consulta separada de la identidad, con clasificación de relevancia de 5 niveles |
| `SEARCH_ENGINE_V2.md` | Las 11 etapas del motor v2 y sus contratos |
| `SHADOW_MODE_DESIGN.md` | Cómo correr v2 en paralelo a v1 sin exponerlo, y cómo comparar |
| `MIGRATION_STRATEGY.md` | Compatibilidad de `matchKey`/`presentationKey`/slugs/históricos/alertas; sin big bang |
| `RISKS.md` | Riesgos del rediseño y del no-rediseño |
| `DECISION.md` | Recomendación única + scoring CFPS + `NEEDS_DECISION` abiertos |

---

## 3. Datos y reproducibilidad

```
raw/        16 sobres de /api/search de produccion (GET publico, sin ?debug=1)
analysis/   metricas y trazas derivadas
scripts/    los 4 scripts que producen todo lo anterior
```

```bash
pnpm install                                              # compila packages/domain a dist/
node docs/qa/cf-search-010/scripts/fetch-raw.mjs          # captura el corpus
node docs/qa/cf-search-010/scripts/trace.mjs              # offers.json/.csv + metrics.json
node docs/qa/cf-search-010/scripts/gap-metrics.mjs        # edm-gap.json + concept-fragmentation.csv
node docs/qa/cf-search-010/scripts/case-ambroxol.mjs ambroxol-30mg   # traza del caso del ticket
node docs/qa/cf-search-010/scripts/probe-isp.mjs          # viabilidad de la fuente regulatoria
```

Los scripts cargan `@comparafarma/domain` desde su `dist/` compilado por ruta
(`QA_DOMAIN_DIST` para apuntar a otro build), el mismo patrón que ya usan los
scripts de CF-SEARCH-003 y CF-DATA-001: `docs/` no es un paquete del workspace.

**Todas las mediciones usan las MISMAS funciones del dominio que corren en
producción.** No hay reimplementación de reglas, salvo `shortHash` (FNV-1a 64),
que se copia literal de `web/src/lib/medicationSlug.ts` para no arrastrar el
build de Next a un script de análisis.

---

## 4. Corpus

| | |
|---|---|
| Consultas | 16 (11 del alcance mínimo del ticket + 5 de control sin concentración) |
| Tarjetas | 1.447 |
| Ofertas | 1.634 |
| Nombres únicos | 982 |
| Farmacias cubiertas | 9 de 9 |

Consultas: `ambroxol`, `ambroxol 30mg`, `ambroxol 30mg/5ml`,
`ambroxol 30mg/5ml jarabe 100ml`, `tapsin`, `paracetamol 500mg`, `paracetamol`,
`ibuprofeno 400mg`, `ibuprofeno`, `losartan 50mg`, `losartan`, `omeprazol 20mg`,
`omeprazol`, `amoxicilina 500mg`, `diclofenaco 50mg`, `cetirizina 10mg`.

Las 5 de control existen para separar lo que causa la consulta de lo que causa
el catálogo: `ambroxol` y `ambroxol 30mg` devuelven **las mismas 57 tarjetas**,
así que toda diferencia observada entre ellas es de clasificación y orden, no de
recuperación.

---

## 5. Limitaciones honestas

1. **Datos post-merge.** Se usó el endpoint público, que devuelve el resultado
   ya fusionado. No se usó `?debug=1` (requiere `API_SECRET_KEY`; **no se pidió
   ni se usó**). Las ofertas descartadas por `mergeDuplicates` dentro de una
   misma farmacia no son observables desde acá. Mitigación: los ejes de
   identidad se **recomputan** desde `PharmacyPrice.productName` de cada oferta
   que sí sobrevive, con las funciones reales del dominio.
2. **Snapshot único** (~15 minutos, 2026-09-01). Precios y stock cambian; la
   identidad es determinista dado el nombre y no depende del momento.
3. **Sin navegación en vivo.** Los slugs y sus colisiones se calculan
   analíticamente con `shortHash(presentationKey)`, no resolviendo cada URL
   contra `www.preciosfarma.cl`. La colisión de hash es una propiedad
   aritmética de la clave y no requiere red; lo que **no** se midió acá es qué
   ve el usuario en pantalla ante esa colisión (eso ya lo midió CF-WEB-002).
4. **`registrosanitario.ispch.gob.cl`** responde 200 vía `curl` y falla en
   `fetch` de Node (handshake TLS). Se documenta la discrepancia; no se
   construyó ningún scraper.
5. **Ningún número de este paquete es una estimación.** Todos salen de
   `analysis/`. Donde hay una inferencia, está marcada como tal.
