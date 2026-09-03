# CF-SEARCH-012 S1 — Esquema y migración

**Dónde vive:** `docs/technology/database/schema.sql`, sección
*"Search Engine v2 — S1: Registro Canónico Persistente"*, al final del archivo.

**Estado:** `CODE_READY`. **No ejecutado en producción.**

---

## 1. Por qué se agrega a `schema.sql` y no a una carpeta de migraciones

El proyecto **no tiene herramienta de migraciones** (sin Supabase CLI, sin
Prisma, sin Flyway). La convención vigente y documentada en la cabecera del
propio archivo es: las tablas se crean a mano en el SQL Editor de Supabase y
`schema.sql` es la referencia de qué se corrió, con `if not exists` en todo para
que reejecutar el script completo sea seguro.

Introducir una herramienta de migraciones es una decisión de arquitectura que no
corresponde a este ticket (CLAUDE.md §1). S1 sigue la convención existente y la
audita con un test (`api/src/__tests__/canonicalRegistrySql.test.ts`) que verifica
aditividad, reejecutabilidad, restricciones, cardinalidades, privilegios y
ausencia de datos personales — sin necesitar una base de datos.

---

## 2. Up migration

Siete tablas nuevas, cuatro secuencias, ocho índices, los `revoke`/`grant`, y una
fila de configuración. Todo con prefijo `canonical_`.

```
canonical_concepts                 CFM-CONCEPT-######
canonical_presentations            CFM-PRESENTATION-######    → concept_id
canonical_products                 CFM-PRODUCT-######         → concept_id
canonical_product_presentations    N:M                        PK (product, presentation)
canonical_signature_aliases        firma → identidad          PK (kind, version, signature)
canonical_offer_observations       CFM-OFFER-######           enlaces NULLABLE
canonical_resolutions              linaje append-only
```

### Es aditiva

- **cero** `ALTER` sobre tablas existentes (los únicos `alter table` de la sección
  son `enable row level security` sobre las tablas nuevas);
- **cero** `DROP`, `RENAME`, `TRUNCATE` y `DELETE`;
- la única escritura sobre una tabla preexistente es
  `insert into app_config … on conflict (key) do nothing` con el interruptor del
  shadow **apagado**;
- no toca `price_history`, `pharmacy_clicks`, `email_alerts`, `medications`,
  `medication_match_key_aliases`, `profiles`, `subscriptions`,
  `subscription_plans`, `flow_customers` ni `account_deletion_requests`.

### No bloquea tráfico

Sin `ALTER` sobre tablas legacy, no toma ningún lock sobre nada que `/api/search`
use. Un `CREATE TABLE` toma lock solo sobre la tabla que crea, y no existe todavía.
Se puede correr en caliente.

### Se puede desplegar el código SIN correrla

El shadow arranca apagado y `SupabaseCanonicalRegistry` degrada a `[]` / `null`
ante "tabla ausente". El comportamiento de `/api/search` es idéntico corriendo o
sin correr la migración. Es el mismo patrón que RFC-002 usó con `medications`.

---

## 3. Restricciones e índices, y para qué está cada uno

| Objeto | Para qué |
|---|---|
| `canonical_concepts.canonical_signature UNIQUE` | **impide que dos requests simultáneos con la misma firma completa acuñen dos IDs**. Es la restricción central de S1 |
| idem en `canonical_presentations`, `canonical_products` | lo mismo en los otros dos niveles |
| `canonical_signature_aliases` PK `(entity_kind, signature_version, signature)` | una firma pertenece a exactamente una identidad |
| `canonical_offer_observations.observation_key UNIQUE` | idempotencia: la misma ficha de la misma farmacia actualiza su fila, no crea una nueva cada día |
| `canonical_product_presentations` PK `(product_id, presentation_id)` | el par comparable es único; el `upsert` es idempotente |
| `…aliases using gin (bucket_keys)` | prefiltro de resolución por molécula/discriminante. Sin él, resolver exigiría escanear el registro entero en el camino de una búsqueda |
| `…aliases (entity_kind, signature_version, concept_id)` | candidatos de presentación y producto, acotados por concepto |
| `…aliases (entity_kind, entity_id)` | `rebindSignature` |
| `canonical_presentations/products (concept_id)` | navegación del agregado |
| `canonical_offer_observations (concept_id)`, `(product_id)` | consultas de cobertura y de auditoría |
| `canonical_resolutions (offer_observation_id)`, `(entity_kind, entity_id)` | responder "¿por qué esta oferta cayó acá?" |

### `bucket_keys`, el prefiltro

Derivado del texto de la firma (`conceptBucketKeys()`): una clave por molécula
nombrada (`ing:amoxicilina`, `ing:clavulanico`) más el discriminante de identidad
no resuelta (`disc:tapsin`). Es un prefiltro **exacto**, no heurístico: para que
una identidad hospede a una firma parcial, ningún eje puede contradecirse, y
tanto `ing` (por contención) como `disc` (siempre declarado) permiten filtrar sin
descartar anfitrionas posibles.

Cuando la firma no declara ni molécula ni discriminante no hay clave selectiva.
La implementación Supabase devuelve `[]`, lo que produce `unresolved` — que no
acuña identidad ni fusiona nada. `InMemoryCanonicalRegistry` escanea (semántica
exacta) y es con esa semántica exacta que se midieron los gates.

---

## 4. Costo, medido sobre el corpus congelado

839 observaciones únicas de 16 consultas, 8 farmacias:

| Tabla | Filas |
|---|---:|
| `canonical_concepts` | 76 |
| `canonical_presentations` | 87 |
| `canonical_products` | 271 |
| `canonical_product_presentations` | 227 |
| `canonical_signature_aliases` | 434 |
| `canonical_offer_observations` | 839 |
| `canonical_resolutions` | 7.551 |
| **Total** | **9.485** |

El linaje domina: ~9 filas por observación (3 niveles × las pasadas de
convergencia). Es la tabla que más crece y la única append-only.

**Escala.** `canonical_resolutions` crece con las búsquedas muestreadas, no con
el catálogo. Con el shadow al 10 % y el techo de `MAX_OBSERVATIONS = 60` por
corrida, el peor caso es 180 filas de linaje por búsqueda muestreada. Las demás
tablas convergen al tamaño del catálogo y dejan de crecer: superada la fase de
descubrimiento, casi toda resolución es `exact` y no escribe identidad nueva.
Para comparar: `price_history` ya escribe una fila por `(match_key, farmacia,
día)`, indefinidamente.

**Recomendación operativa antes de subir el muestreo:** definir una política de
retención de `canonical_resolutions` (por ejemplo, conservar la última resolución
por observación y nivel más N días de histórico). No se implementa acá: con el
shadow apagado no hay nada que retener, y es una decisión operativa.

---

## 5. Seguridad

RLS habilitado en las siete tablas, **sin policies permisivas** — mismo patrón
que `subscriptions` / `flow_customers` / `account_deletion_requests`: solo
`api/` con `SUPABASE_SECRET_KEY` (rol `service_role`, que bypasea RLS por diseño)
lee y escribe.

Como defensa en profundidad, y sin depender de que "no haya policy":

```sql
revoke all on table canonical_*  from anon, authenticated;
grant  all on table canonical_*  to   service_role;
```

Las **secuencias** llevan sus propios `revoke`/`grant`: son objetos de
privilegios independientes de la tabla y un `INSERT` que dependa del `DEFAULT`
necesita `USAGE` sobre ellas. Es el mismo gotcha ya documentado en
`account_deletion_requests_id_seq`.

---

## 6. Cómo aplicarla

1. Abrir el SQL Editor de Supabase del proyecto de producción.
2. Copiar la sección *"Search Engine v2 — S1"* completa de
   `docs/technology/database/schema.sql`.
3. Ejecutar. Es idempotente: reejecutarla no toca nada existente.
4. Verificar: las 7 tablas existen, `app_config` tiene la fila
   `search_v2_shadow` con `{"enabled": false, "sampleRate": 0}`.
5. **No encender nada.** Encender el shadow es una decisión aparte, de
   CTO/Product, con la evidencia de este paquete a la vista.

Rollback en `ROLLBACK.md`.
