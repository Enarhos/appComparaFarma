# CF-SEARCH-010 — Shadow mode

Propuesta de diseño. **No implementada.**

**Regla:** v2 no reemplaza a v1 hasta que exista evidencia medida de que es
mejor. No se sirve un solo resultado de v2 a un usuario real antes de eso.

---

## 1. Topología

```
                    9 farmacias
                         │
                         ▼
                    RawOffer[]
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
    ┌───────────┐               ┌───────────────┐
    │  MOTOR v1 │               │   MOTOR v2    │
    │  (actual) │               │   (shadow)    │
    └─────┬─────┘               └───────┬───────┘
          │                             │
          │ respuesta                   │ evaluación
          ▼                             ▼
      USUARIO                    ┌──────────────┐
      (Web/Mobile)               │ COMPARADOR   │
                                 │ v1 vs v2     │
                                 └──────┬───────┘
                                        ▼
                              search_shadow_runs (Supabase)
```

**Un solo retrieval alimenta a los dos motores.** No se duplican peticiones a
las farmacias: R-009 (3 de 9 scrapers frágiles) prohíbe duplicar carga sobre
Ahumada, Sermecoop y EasyFarma.

---

## 2. Reglas duras

| # | Regla |
|---|---|
| 1 | **v2 nunca escribe en la respuesta al usuario** mientras esté en shadow |
| 2 | **v2 nunca escribe en `price_history`, `pharmacy_clicks`, `email_alerts` ni `medications`.** Escribe solo en tablas propias con prefijo `shadow_` |
| 3 | **v2 nunca aumenta la latencia percibida.** Corre después de responder, o en `waitUntil` |
| 4 | **Un fallo de v2 no puede romper la respuesta.** `try/catch` que descarta silenciosamente, igual que `recordPriceHistory().catch(() => {})` |
| 5 | **v2 nunca dispara peticiones adicionales a las farmacias** |
| 6 | **Interruptor por variable de entorno**, apagado por defecto, con muestreo (`SHADOW_SAMPLE_RATE`) |

La regla 3 no es cosmética: `/api/search` corre en **Vercel Hobby**, con límite
de duración de función. Un shadow síncrono podría convertir una búsqueda lenta
en un timeout — que es exactamente el modo de fallo que Sermecoop ya tiene
documentado.

---

## 3. Métricas de comparación

Las que el ticket exige, con su definición operativa y su línea base ya medida:

| Métrica | Definición | V1 (medido 2026-09-01) | Objetivo v2 |
|---|---|---:|---|
| **Precisión de top results** | Tarjetas en el top-10 clasificadas `EXACT`/`COMPATIBLE` por un juez humano sobre el corpus de referencia | — (sin juez todavía) | ≥ v1 |
| **False merge rate** | Pares de ofertas de la misma tarjeta que se contradicen en algún eje | **0,0 %** (0/229 pares) | **exactamente 0** — condición de bloqueo |
| **False split rate** | Presentaciones repartidas en más de una tarjeta / presentaciones totales | **75,9 %** (280/369) | < 30 % |
| **Exact presentation precision** | Tarjetas en cohorte `EXACT` / tarjetas de consultas con concentración | **24,5 %** (218/891) | > 50 % |
| **Wrong detail navigation** | Enlaces que resuelven a otro producto | 0 medido (CF-WEB-002) con 4 pares colisionados latentes | 0 **y sin colisiones** |
| **No-result rate** | Consultas sin resultados | 0 % (0/16) | = v1 |
| **Offer coverage** | Ofertas que v2 mapea / ofertas que v1 mapea | 1.634 (100 %) | **≥ 99,5 %** — condición de bloqueo |
| **Latency** | p50/p95 de la etapa de identidad | (a instrumentar) | v2 ≤ v1 + 150 ms p95 |
| **Disagreement rate** | Ofertas cuyo agrupamiento difiere entre v1 y v2 | — | **Se espera alta** (ver §4) |
| **Comparaciones ganadas** | Presentaciones que pasan de 1 farmacia a ≥2 | 150 tarjetas multi-farmacia | **> 400** |
| **Tarjetas por concepto** | tarjetas / conceptos | **4,96** | **< 2,0** |

---

## 4. Cómo se interpreta el desacuerdo

**Un `disagreementRate` alto NO es un fallo de v2 — es el objetivo.** Si v2
coincidiera con v1 no habría razón para construirlo.

Lo que hay que clasificar es **el signo** de cada desacuerdo:

| Clase | Qué es | Veredicto |
|---|---|---|
| **MERGE_GAINED** | v1 emite 2+ tarjetas, v2 emite 1, y las ofertas son el mismo producto | ✅ Mejora — es el objetivo |
| **MERGE_LOST** | v1 emite 1, v2 emite 2+, y eran el mismo producto | ❌ Regresión |
| **SPLIT_GAINED** | v1 emite 1, v2 emite 2+, y eran productos distintos | ✅ Mejora |
| **SPLIT_LOST** | v1 emite 2+, v2 emite 1, y eran productos distintos | 🚨 **Falso merge — bloqueante absoluto** |
| **RANK_ONLY** | Mismo agrupamiento, distinto orden | Se evalúa aparte |

**`SPLIT_LOST` es la única clase con tolerancia cero.** El proyecto entero eligió
falsos splits sobre falsos merges por riesgo clínico (`PRODUCT_IDENTITY.md` §10),
y v2 no puede revertir esa política — solo puede eliminar los splits que no eran
necesarios.

La clasificación de las clases ambiguas (¿eran el mismo producto?) **no puede
ser automática**: requiere revisión humana sobre una muestra. Se propone el
mismo método de las campañas anteriores: casos con nombres reales, en
`docs/qa/`, revisables uno por uno.

---

## 5. Corpus de referencia congelado

Prerrequisito para que las comparaciones sean válidas entre corridas.

- **Semilla:** los 16 sobres de `docs/qa/cf-search-010/raw/` de esta auditoría.
- **Ampliación propuesta:** hasta ~30 consultas cubriendo las 8 clases de forma
  farmacéutica y los casos de las campañas previas (CF-QA-001, CF-SEARCH-003,
  CF-WEB-002).
- **Uso:** v1 y v2 corren sobre el **mismo JSON congelado**, no contra la red.
  Es la técnica que ya usaron CF-SEARCH-003 (`ab-merge.mjs`) y CF-WEB-002
  (`--raw-label baseline`), y es lo que permite afirmar `sameCorpus: true`.

---

## 6. Fases y criterios de salida

| Fase | Qué corre | Criterio para pasar a la siguiente |
|---|---|---|
| **S0 — Offline** | v2 sobre el corpus congelado, sin desplegar | `offerCoverage ≥ 99,5 %` · `SPLIT_LOST = 0` · `falseMergeRate = 0` |
| **S1 — Shadow productivo** | v2 en `waitUntil`, muestreo 10 % | 7 días sin incidentes · p95 sin degradar · desacuerdos clasificados |
| **S2 — Shadow completo** | Muestreo 100 % | Métricas objetivo de §3 alcanzadas · revisión humana de ≥100 desacuerdos |
| **S3 — Dual read** | v2 sirve a un % del tráfico Web detrás de flag; Mobile sigue en v1 | Sin aumento de rebote ni de `medication_slug_*` en logs |
| **S4 — v2 por defecto** | v1 queda como fallback | Decisión explícita de Mario |

**Cada transición de fase es una decisión de Mario/ChatGPT, no un automatismo.**

`mobile/` va **último** en todas las fases: los binarios publicados leen el
contrato actual y no se pueden revertir con un flag de servidor. Solo `eas
update` o una versión nueva.

---

## 7. Esquema de shadow (aditivo, tablas propias)

```sql
create table if not exists shadow_search_runs (
  id            bigint generated always as identity primary key,
  run_at        timestamptz not null default now(),
  engine_version text not null,          -- 'v2.0.0-shadow'
  raw_query      text not null,
  retrieval_query text not null,
  offers_in      integer not null,
  v1_cards       integer not null,
  v2_cards       integer not null,
  v1_multi_pharmacy integer not null,
  v2_multi_pharmacy integer not null,
  disagreements  jsonb not null default '[]',
  v1_duration_ms integer,
  v2_duration_ms integer
);
alter table shadow_search_runs enable row level security;
```

Sin FK a `medications`, `price_history` ni ninguna tabla productiva: si se
descarta v2, se borra esta tabla y no queda rastro.

---

## 8. Qué invalida el experimento

1. **Corpus no congelado** entre corridas ⇒ toda diferencia es ruido de
   catálogo. Fue una limitación honesta de CF-QA-001 y se corrige congelando.
2. **v2 alimentado por otro retrieval.** Debe ser el mismo `RawOffer[]`.
3. **Comparar contra un v1 que ya cambió.** Se fija el SHA de referencia
   (`3a7b5a4`), como hicieron `QA_BASE_DIST`/`QA_PR_DIST` en CF-SEARCH-003.
4. **Medir solo con tests unitarios.** 379 tests verdes conviven hoy con 185
   comparaciones perdidas. La suite no es la métrica.
