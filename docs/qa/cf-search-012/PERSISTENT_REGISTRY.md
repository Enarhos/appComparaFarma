# CF-SEARCH-012 S1 — El registro persistente

## 1. Las cardinalidades REALES del EDM

`ENTERPRISE_DATA_MODEL.md` dibuja `Concepto → Presentación → Producto → Oferta`
como la **evolución del conocimiento hacia el mercado**, no como una cadena de
claves foráneas. Leyendo las entidades una por una:

| Entidad del EDM | Propiedades que declara | Consecuencia |
|---|---|---|
| Presentación Farmacéutica | **Concepto Farmacéutico**, Cantidad, Unidad, Contenido Total, Tipo de Envase | Presentación → Concepto |
| Producto Medicinal Comercial | Marca Comercial, Laboratorio, Registro ISP, Estado, Condición de Bioequivalencia | **NO incluye Presentación** |
| Concepto Farmacéutico (relaciones) | "múltiples Presentaciones", "múltiples **Productos Medicinales Comerciales**", "múltiples Ofertas" | Producto → Concepto, directo |
| Oferta | "deberá referenciar un Producto Medicinal Comercial" | Oferta → Producto |

Por lo tanto:

```
   Concepto ──1:N──► Presentación
      │                   ▲
      └────1:N──► Producto│
                     │    │
                     └N:M─┘   canonical_product_presentations
                     │
   Oferta ──N:1──► Producto / Presentación / Concepto   (las tres NULLABLE)
```

**Producto y Presentación son N:M.** "Tapsin 500 mg comprimido (Lab. Maver)" es
UN producto comercial que se vende en caja de 16 y en caja de 30 — dos
presentaciones —, y la caja de 30 hospeda además a los productos de todos los
demás laboratorios. Una cadena lineal de FKs no puede representarlo sin duplicar
el producto una vez por caja, que es exactamente lo que hacía la firma de
producto de S0.

**La unidad que un usuario compara no es ninguna de las dos por separado:** es el
PAR `(producto, presentación)`. Es lo que se mide como "unidad comparable" en
`S1_METRICS.md`, y la partición de ofertas que induce es la misma que inducía la
clave de producto de S0 — lo que hace las cifras comparables — mientras el conteo
de PRODUCTOS pasa a significar lo que el EDM dice que significa.

---

## 2. Las siete tablas

| Tabla | Representa | PK | UNIQUE | Inmutable | Puede evolucionar |
|---|---|---|---|---|---|
| `canonical_concepts` | EDM-100 Concepto Farmacéutico | `CFM-CONCEPT-######` | `canonical_signature` | `id` | firma, nombre canónico, ATC, estado |
| `canonical_presentations` | EDM-100 Presentación | `CFM-PRESENTATION-######` | `canonical_signature` | `id`, `concept_id` | firma, tipo de envase, estado |
| `canonical_products` | EDM-100 Producto Medicinal Comercial | `CFM-PRODUCT-######` | `canonical_signature` | `id`, `concept_id` | firma, ISP, bioequivalencia, estado |
| `canonical_product_presentations` | el PAR comparable (N:M) | `(product_id, presentation_id)` | la PK | el par | `last_seen_at` |
| `canonical_signature_aliases` | firma → identidad | `(entity_kind, signature_version, signature)` | la PK | la fila | `is_current` |
| `canonical_offer_observations` | EDM-200 Oferta (observación) | `CFM-OFFER-######` | `observation_key` | `id`, farmacia, fuente | los tres enlaces, `raw_name`, `last_seen_at` |
| `canonical_resolutions` | EDM-500 Linaje | `id` (bigint) | — | **toda la fila (append-only)** | nada |

---

## 3. Identificadores: por qué de secuencia y no del contenido

El EDM exige que el `CFM-CONCEPT-ID` **"nunca deberá cambiar"**. Cualquier
esquema *content-addressed* lo viola por definición: si la firma cambia porque el
canonicalizador mejora, el hash cambia y con él el identificador.

S1 usa **secuencia + `lpad(6)`**, la mecánica que el proyecto ya tiene en
`medications.cfm_id` (RFC-002), más el segmento de entidad que el EDM nombra
literalmente:

```
CFM-CONCEPT-000001    CFM-PRESENTATION-000001
CFM-PRODUCT-000001    CFM-OFFER-000001
```

El segmento no es decorativo: `medications.cfm_id` ya ocupa `CFM-000123` con una
identidad **legacy derivada de `matchKey`**. Sin él, un `CFM-000123` sería
ambiguo entre dos modelos de identidad distintos. Las dos tablas conviven y
**ninguna FK las une**.

**`matchKey` y `presentationKey` no son PK ni identidad v2 en ninguna parte.**
Viajan como columnas de trazabilidad en `canonical_resolutions`
(`legacy_match_key`, `legacy_presentation_key`) y nada más.

---

## 4. Firma, versión y alias: cómo un ID no rota

Tres cosas distintas, deliberadamente separadas:

- **identidad permanente** — `id`. Inmutable. Se emite una vez.
- **firma canónica vigente** — `canonical_signature` + `signature_version`.
  Evoluciona.
- **alias históricos** — `canonical_signature_aliases`. Todas las firmas que
  alguna vez identificaron a esa entidad.

Cuando una mejora del canonicalizador cambia la firma de un concepto,
`rebindSignature()` **agrega** una fila de alias apuntando al MISMO `entity_id` y
marca la anterior `is_current = false`. La firma vieja **no se borra**: borrarla
rotaría el ID para cualquier observación que todavía la produzca.

Verificado sobre el corpus real (`s1-stability.json`): 76 identidades
reasociadas a una firma nueva, **0 rotaciones**, 76 conceptos antes y después.

---

## 5. Qué NO guarda el registro

**Ni precio, ni stock, ni canal comercial.** El precio ya vive en
`price_history`; duplicarlo crearía una segunda fuente de verdad comercial. Este
registro es de IDENTIDAD.

**Ningún dato personal.** No hay columna de consulta, IP, sesión, user-agent ni
identificador de persona, y la consulta ni siquiera llega como parámetro a
`canonicalRegistryDb.ts`. Lo que se guarda es metadata de producto y de oferta:
farmacia, nombre publicado, firmas canónicas, versiones y motivos. Auditado por
test sobre el texto del esquema (`canonicalRegistrySql.test.ts`).

---

## 6. Provenance: responder "¿por qué esta oferta cayó en este concepto?"

`canonical_resolutions` guarda **una fila por (observación, nivel)**, append-only,
con todo lo necesario para responder sin reconstruir el código histórico:

```
source pharmacy          pharmacy_slug (en la observación)
source product id        source_product_id
raw name                 raw_name
raw signature            raw_signature
canonical signature      normalized_signature
resolved entity          entity_id
resolution type          outcome  (exact|created|subsumed|ambiguous|unresolved)
reason                   reason (texto legible)
evidence declarada       upstream_fields  (lo que la farmacia entrega)
evidence inferida        inferred_fields  (lo que el motor derivó, con su lector)
campos desconocidos      unknown_axes
candidatos               candidate_count, candidate_ids
versiones                canonicalizer_version, resolver_version, signature_version
trazabilidad legacy      legacy_match_key, legacy_presentation_key
```

Sobre el corpus congelado: **7.551 filas de linaje** para 839 observaciones (tres
niveles × observación, más las re-resoluciones de la convergencia).

**Integración con #156 (`ispRegistration`):** el contrato está completo de punta a
punta —`RawOfferInput.ispRegistration` → `CanonicalAttributes.ispRegistration` →
eje `isp` de la firma de producto → `canonical_products.isp_registration` →
`upstream_fields`—. Ningún adaptador lo emite todavía, así que vale `null` en el
100 % del corpus. Capturarlo será un cambio de datos, no de arquitectura.
**No se usa como fuente de verdad canónica** mientras el issue #157 siga abierto
(ADR-0005, sección "Fuente ISP"): es el único eje subsumible del nivel de
producto y no bloquea la acuñación.
