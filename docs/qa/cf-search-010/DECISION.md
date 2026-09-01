# CF-SEARCH-010 — Decisión

> **Naturaleza de este documento.** Es una **recomendación de análisis** para
> revisión de Mario + ChatGPT (dirección CTO/Product), no una decisión tomada.
> `CLAUDE.md` §1: el alcance de producto y la arquitectura de alto impacto no se
> redefinen unilateralmente.

---

## 1. La pregunta

Después de once cambios en catorce días sobre la capa de identidad, ¿qué
corresponde: otro parche, una simplificación del motor actual, o un motor v2
alineado al Enterprise Data Model?

---

## 2. Lo que dicen los datos

### 2.1 El motor v1 ya no comete el error que se le corrigió

```
Contradicciones dentro de una tarjeta:  0  (sobre 229 pares de ofertas)
  · matchKey 0 · combinación 0 · variante 0 · forma 0 · cantidad 0 · concentración 0
```

CF-SEARCH-001, el fix de cantidad y CF-SEARCH-003 funcionan. **No hay falsos
merges.** Los seis fixes recientes hicieron su trabajo.

### 2.2 Y falla masivamente en el error contrario

| Métrica | Valor |
|---|---:|
| Tarjetas que comparan **una sola** farmacia | **89,6 %** (1.297/1.447) |
| Presentaciones repartidas en más de una tarjeta | **280 de 369 (75,9 %)** |
| Comparaciones perdidas (sin solapamiento de farmacias) | **185** |
| Tarjetas por concepto farmacéutico | **4,96** |

Un solo losartán potásico 50 mg x 30 comprimidos se publica en **9 tarjetas**
separadas, de 7 farmacias, entre $490 y $1.840. El usuario no ve una
comparación: ve nueve productos.

CF-QA-001 midió 90,5 % hace 24 horas. Tres correcciones después, **sin cambio.**

### 2.3 Los defectos que quedan no son corregibles donde están

| Defecto | Alcance | Por qué no se puede corregir |
|---|---:|---|
| Volumen de envase leído como cantidad (`x 100 ml` → 100 unidades) | **141 ofertas / 78 nombres** | Está en `matchKey`, persistido en 4 tablas. `unitCountKey` **ya lo lee bien** y no puede aplicarse |
| Principio activo leído como variante comercial (`var:ambroxol`) | **65 ofertas / 23 nombres** | Depende de una lista manual (`COMPOSITION_TOKENS`) alimentada por observación. Se repetirá con la próxima molécula |
| Concentración pedida degradada a `other` | **32 tarjetas** | El modelo masa-absoluta vs razón es correcto para identidad y equivocado para consulta |
| Pares de productos con el mismo hash de slug | **4** (12 ocurrencias) | Consecuencia **declarada y aceptada** de dejar concentración y cantidad fuera de la clave para no rotar URLs |

Los cuatro tienen la misma forma: **el fix correcto existe, y está en la capa
equivocada, porque la capa correcta está congelada por persistencia o por SEO.**

### 2.4 El EDM ya define el destino, y no está implementado

| Entidad EDM | ¿Existe como identidad? | Brecha |
|---|---|---|
| Concepto Farmacéutico (CFM-CONCEPT-ID) | ❌ | Alta |
| Presentación Farmacéutica (CFM-PRESENTATION-ID) | ❌ | Alta |
| Producto Medicinal Comercial (CFM-PRODUCT-ID) | Aproximada, por concatenación de texto | Alta |
| Oferta (CFM-OFFER-ID) | ❌ (sin ID propio) | Media |

`ENTERPRISE_DATA_MODEL.md` exige *"la concentración deberá administrarse de
manera estructurada, nunca únicamente como texto"*. **El modelo estructurado ya
existe** (`concentration.ts`) **y no participa de ninguna clave de identidad.**
Está construido y desconectado.

`MASTER_DATA_STRATEGY.md` ya define el Medicamento Maestro con CFM-ID, DCI,
concentración, forma, presentación, laboratorio, registro ISP y ATC. RFC-002 ya
implementó el mecanismo de registro persistido — a la granularidad de `matchKey`,
que es la equivocada, y su propio texto lo declara: *"hereda sus
imperfecciones"*.

**No hay que diseñar el modelo. Hay que conectarlo.**

---

## 3. Por qué `EXTEND_CURRENT_ENGINE` no alcanza

Es la opción más barata y hay que descartarla con argumento, no por preferencia.

| Si se extendiera… | Qué pasaría |
|---|---|
| Corregir `QUANTITY_PATTERN` (141 ofertas) | Cambia `matchKey` ⇒ invalida `price_history`, `pharmacy_clicks`, `email_alerts`, `medication_match_key_aliases` y los favoritos de Mobile. **Prohibido** |
| Agregar `ambroxol` a `COMPOSITION_TOKENS` | Arregla 65 ofertas y no arregla la próxima molécula. Es el décimo vocabulario manual |
| Meter la concentración en `presentationKey` | Rota el 23,4 % de las URLs (medido por CF-SEARCH-003) y exige Gen 7 |
| Meter cantidad + concentración | Rota el 72,6 % (medido por CF-WEB-002) |
| Relajar `brand:unknown` para recuperar comparaciones | **Reintroduce el falso merge de Omeprazol Ascend/OPKO/CuraeSpring**, porque en v1 la marca *es* la identidad |

La última fila es la decisiva. **La fragmentación (89,6 %) y la seguridad de la
comparación son, en v1, el mismo botón.** No se puede mejorar una sin empeorar
la otra, porque los dos ejes que permitirían separarlas con seguridad
—concentración y cantidad— están fuera de la clave, y meterlos rota el catálogo
de URLs.

Eso no es un defecto de implementación. **Es la estructura.**

---

## 4. Recomendación

# `BUILD_SEARCH_ENGINE_V2`

Construir el motor v2 **en paralelo**, en shadow mode, alineado a la jerarquía
`CFM-CONCEPT-ID → CFM-PRESENTATION-ID → CFM-PRODUCT-ID → CFM-OFFER-ID` que el
EDM ya define, con migración aditiva y sin big bang.

**Con tres condiciones que forman parte de la recomendación:**

1. **v1 no se toca.** Sigue sirviendo el 100 % del tráfico hasta que haya
   evidencia medida. `matchKey` y `presentationKey` se conservan indefinidamente.
2. **Se descarta si no pasa S0.** Si sobre el corpus congelado v2 no alcanza
   `offerCoverage ≥ 99,5 %`, `SPLIT_LOST = 0` y `falseMergeRate = 0`, se borran
   las tablas y no se sigue. El riesgo real es V-09 (quedar a medias), y la
   forma de contenerlo es un criterio de abandono explícito y barato.
3. **`mobile/` va último**, después de que cierre vc34.

### Lo que NO es esta recomendación

- No es reescribir el motor. **Los 9 adaptadores, los 4 canales de precio,
  `concentration.ts`, `dosageFormClass`, `unitCountKey`, `combinationKey`,
  `resolveBrandIdentity` y `rankByRelevance` se conservan** — cambia dónde viven
  y quién decide la identidad, no la mayoría de las reglas.
- No es una lista de fixes. Los cuatro defectos medidos son **síntomas**; la
  causa es que la identidad se calcula por concatenación de texto en cada
  request y está atada a la persistencia y al ruteo.
- No es urgente por sí sola: el sprint activo es el cierre de vc34.

---

## 5. Scoring CFPS

Framework: `docs/product/decisions/PRODUCT_DECISION_FRAMEWORK.md`.

| Criterio | Puntaje | Justificación |
|---|:---:|---|
| **VU** — Valor para el usuario (25 %) | **5** | 89,6 % de las tarjetas no comparan nada, en un comparador de precios. En `ambroxol 30mg` los jarabes correctos de $790 quedan debajo de comprimidos de $11.190. Es la promesa central del producto |
| **VN** — Valor para el negocio (15 %) | **4** | La confianza es el activo central; la cobertura de comparación es el producto. No toca monetización |
| **DF** — Diferenciación (20 %) | **4** | Un registro canónico farmacéutico propio es DAR-100 (Patrimonio de Conocimiento). Es lo que separa a PreciosFarma de un scraper de precios |
| **IE** — Impacto estratégico (20 %) | **5** | Implementa la entidad que el EDM declara central. `MASTER_DATA_STRATEGY.md` y RFC-002 ya lo proyectan. Es el habilitante de bioequivalentes, ATC, sustitutos, observatorio y API comercial |
| **CT** — Complejidad técnica (10 %) | **2** | Alta. Cruza `packages/domain`, `api`, `web`, `mobile` y Supabase; 4 tablas nuevas; 8 pasos de migración; sin herramienta de migraciones |
| **CM** — Costo de mantención (5 %) | **4** | Sustituye 9 vocabularios manuales *como identidad* por un registro persistido y auditable. Menor mantención a largo plazo, a cambio de curación puntual |
| **RG** — Riesgo (5 %) | **3** | V-01 (falso merge) es crítico y V-09 (quedar a medias) es probable. Mitigados por shadow mode, contrato aditivo y criterio de abandono |

```
CFPS = (5×0,25) + (4×0,15) + (4×0,20) + (5×0,20) + (2×0,10) + (4×0,05) + (3×0,05)
     = 1,25 + 0,60 + 0,80 + 1,00 + 0,20 + 0,20 + 0,15
     = 4,20  →  ALTA  ("Planificar pronto")
```

Score de referencia para la priorización de Mario/ChatGPT. **No es una decisión
de sprint ni un aval de merge.**

---

## 6. Regla 4 del framework

| | |
|---|---|
| **Problema** | La identidad de producto se calcula por concatenación de texto libre en cada request, está atada a `matchKey` (congelado por persistencia) y a `presentationKey` (congelado por SEO). Resultado medido: 89,6 % de tarjetas comparan una sola farmacia; 280 presentaciones fragmentadas; 4 pares de productos compartiendo URL; 4 defectos cuya corrección es imposible en la capa donde viven |
| **Usuario** | Persona que compara el precio de un medicamento entre farmacias (persona primaria de `PERSONAS.md`) |
| **Beneficio** | Ver **una** tarjeta por producto con todas las farmacias que lo tienen, en vez de N tarjetas de una farmacia cada una |
| **Métrica de éxito** | Tarjetas por concepto de 4,96 → **< 2,0**; tarjetas de una sola farmacia de 89,6 % → **< 50 %**; precisión de presentación exacta de 24,5 % → **> 50 %**; **falso merge = 0** (condición de bloqueo, no objetivo); colisiones de slug 4 → 0 |
| **Riesgos** | `RISKS.md` §1. Dominantes: V-01 (falso merge al relajar `brand:`) y V-09 (quedar a medias) |

---

## 7. Gobernanza — lo que corresponde a Mario/ChatGPT

### 7.1 `NEEDS_DECISION` — incorporación al backlog

**`CF-SEARCH-010` no existe en `docs/program/MASTER_BACKLOG.md`.** Según las
restricciones vigentes y la Regla 2 del framework, no se prioriza nada que no
esté antes en Program. **No se modificó `MASTER_BACKLOG.md` en esta auditoría.**

Se propone su incorporación en **FASE 3 — Product/Engineering**, con el CFPS de
§5. Si se aprueba, absorbería o superaría estos ítems ya registrados:

| Ítem existente | Relación |
|---|---|
| `CF-SEARCH-004` — métrica de cobertura de comparación | **Prerrequisito.** Sin ella no hay línea base continua |
| `CF-SEARCH-006` — robustez de `unitCountKey` | Absorbido: en v2 `quantity` es identidad de primera clase |
| `CF-SEARCH-007` — sinónimos de variante comercial | Absorbido |
| `CF-DATA-002` — tokens no-marca en identidad comercial | Absorbido: la marca deja de ser identidad de concepto |
| `BIOEQUIVALENCE-DATA-QUALITY-01` pasos 3-8 (Option D) | **Convergen.** El paso 7 (sacar `bio:` de `presentationKey`) es exactamente lo que v2 hace por diseño |
| `CF-WEB-002` `FOLLOW_UP` — resolución sin persistencia | Resuelto por la etapa 11 |
| `CF-SEARCH-001` `FOLLOW_UP` — claves persistidas de Mobile | Abordado en `MIGRATION_STRATEGY.md` §8, **sigue requiriendo decisión de producto** |
| Sprint B — Bioequivalentes (🔴 bloqueado) | Habilitado parcialmente: `ispRegistration` capturado da un identificador fuerte al 14,1 % de las ofertas |

### 7.2 `NEEDS_DECISION` — la fuente ISP cambió de estado

`DECISION_LOG.md` (2026-07-31) registra la fuente ISP de `datos.gob.cl` como
*"API real vía CKAN DataStore… confirmado con datos reales, no vacío"*. Sonda
read-only del 2026-09-01 (`analysis/isp-source-probe.json`):

- la **API DataStore devuelve `total: 0`, cero registros**;
- el **CSV** sigue descargable pero su propio encabezado dice **"actualizado al
  31 de Mayo de 2016"**;
- contiene **1.555 filas** de productos con equivalencia terapéutica —
  **`AMBROXOL`: 0 filas**.

Corresponde a Mario/ChatGPT decidir si se actualiza esa entrada del
`DECISION_LOG` y el estado de "Sprint B — Bioequivalentes", que descansa sobre
esa premisa. **No se modificó ningún documento de gobierno.**

### 7.3 `NEEDS_DECISION` — quick win independiente de esta decisión

Capturar `sourceProductId` e `ispRegistration` en los adaptadores que **ya los
exponen en la respuesta que hoy se consume y se descarta** (Dr. Simi: campo
`"Registro Sanitario"` del JSON VTEX; Farmex: `RegistroISP=F-####/##` en el HTML
de `body`). Son campos **aditivos**, no alimentan ninguna clave, no rotan ningún
slug, y valen **230 de 1.634 ofertas (14,1 %)** de identificador regulatorio
fuerte.

Tiene valor con v2 y sin v2. Podría entrar como ítem propio, antes y con
independencia de esta decisión arquitectónica.

---

## 8. Si la decisión fuera otra

Para que la alternativa quede formulada y no sea solo el descarte de §3:

- **Si Mario/ChatGPT eligen `EXTEND_CURRENT_ENGINE`**, la secuencia mínima
  coherente sería: (1) `CF-SEARCH-004` para instrumentar la métrica de
  cobertura; (2) BIOEQ-01 paso 7 (sacar `bio:` de `presentationKey`, con la
  rotación de slugs que implica); (3) `CF-DATA-002`. Recupera parte de la
  fragmentación **sin** resolver los 141 casos de `matchKey`, las colisiones
  de slug ni la dependencia de vocabularios manuales, y suma la séptima
  generación de slug.
- **`INSUFFICIENT_DATA` no aplica.** Hay 1.634 ofertas reales de las 9
  farmacias, cuatro defectos cuantificados, y el modelo objetivo ya está escrito
  en `docs/enterprise/`. Lo que falta no es evidencia: es una decisión.

---

## 9. Estado

**`NEEDS_DECISION`** — recomendación `BUILD_SEARCH_ENGINE_V2` (CFPS 4,20, Alta)
entregada para revisión de Mario + ChatGPT. Ningún código productivo modificado,
ningún documento de gobierno modificado, ningún PR abierto.
