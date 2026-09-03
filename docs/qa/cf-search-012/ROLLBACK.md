# CF-SEARCH-012 S1 — Rollback

**Hoy no hay nada que revertir.** El shadow está apagado, la migración no se
ejecutó y no hubo deploy. Este documento existe para que, cuando algo de eso
cambie, la vuelta atrás ya esté escrita.

---

## 1. Los cuatro niveles, del más barato al más caro

| # | Situación | Acción | Tiempo | Pérdida |
|---|---|---|---|---|
| 1 | El shadow molesta y hay que cortarlo YA | `SEARCH_V2_SHADOW_KILL=true` | inmediato tras propagar la env var | ninguna |
| 2 | Hay que apagarlo sin tocar Vercel | `app_config['search_v2_shadow'] = {"enabled": false, "sampleRate": 0}` | inmediato (cache 60 s) | ninguna |
| 3 | Hay que sacar el código | revertir el PR | un deploy | ninguna |
| 4 | Hay que borrar el registro | script SQL de §4 | minutos | todo el registro canónico |

**En los cuatro casos, `/api/search` sigue funcionando exactamente igual**, porque
v1 nunca dependió de nada de esto.

---

## 2. Nivel 1-2 — apagar (lo normal)

El nivel 2 es el que se usa a diario: es una fila de `app_config`, editable
desde el SQL Editor o desde `/admin`, sin redeploy. Efecto en ≤ 60 s (TTL del
cache de `getConfigValue`).

El nivel 1 existe para cuando `app_config` no responde o quedó mal escrito.
`SEARCH_V2_SHADOW_KILL` se evalúa **antes de tocar la red**, así que funciona
aunque Supabase esté caído. Requiere propagar la variable en Vercel.

**Ninguno de los dos borra nada.** El registro queda como está, listo para
retomar.

---

## 3. Nivel 3 — sacar el código

Revertir el PR y desplegar. Las tablas quedan en la base sin nadie que las
escriba: no molestan a nada (RLS habilitado, sin policies, sin FK desde tablas
legacy) y permiten retomar sin recapturar.

**Qué NO hay que revertir por separado**, porque no cambian conducta de v1:

- `IngredientComposition.negatedComponents` y
  `CanonicalAttributes.negatedComponents` — campos aditivos, no participan de
  ninguna firma;
- el subpath `./searchV2` en `packages/domain/package.json` — aditivo, apunta a
  `dist/` (PM-001);
- la sección de `schema.sql` — es documentación de lo que se corrió.

---

## 4. Nivel 4 — borrar el registro

**Destructivo. Requiere autorización explícita.** Solo si se descarta v2 o si hay
que reconstruir el registro desde cero.

Correr en el SQL Editor de Supabase, **en este orden** (respeta las FK):

```sql
begin;

-- 1. Linaje y observaciones (no las referencia nadie).
drop table if exists canonical_resolutions;
drop table if exists canonical_offer_observations;

-- 2. La relación N:M, antes que las dos entidades que referencia.
drop table if exists canonical_product_presentations;

-- 3. Alias (sin FK declarada, pero es el índice del registro).
drop table if exists canonical_signature_aliases;

-- 4. Productos y presentaciones, antes que conceptos.
drop table if exists canonical_products;
drop table if exists canonical_presentations;
drop table if exists canonical_concepts;

-- 5. Secuencias. `canonical_resolutions_id_seq` es implícita de la columna
--    identity y se va con la tabla; las otras cuatro son explícitas.
drop sequence if exists canonical_offer_seq;
drop sequence if exists canonical_product_seq;
drop sequence if exists canonical_presentation_seq;
drop sequence if exists canonical_concept_seq;

-- 6. Interruptor del shadow.
delete from app_config where key = 'search_v2_shadow';

commit;
```

**Verificar después:** las siete tablas no existen; `/api/search` responde
normal; `price_history`, `pharmacy_clicks`, `medications`,
`medication_match_key_aliases`, `email_alerts`, `profiles` y `subscriptions`
intactas — el script no las nombra.

### Qué se pierde

Todo el registro canónico: los `CFM-CONCEPT-ID` emitidos, las presentaciones, los
productos, los pares, las observaciones y el linaje.

**Los identificadores emitidos no se pueden recuperar tal cual.** Reconstruir el
registro desde el mismo corpus produce la misma PARTICIÓN de identidades, pero
los números de secuencia serán otros. Mientras el registro no alimente nada
visible —que es la situación de S1— eso no tiene consecuencias: ninguna URL,
histórico, alerta o click apunta a un `CFM-CONCEPT-ID`.

**A partir de S3 (dual-read) dejaría de ser cierto.** Antes de esa fase hay que
decidir política de respaldo del registro. Fuera del alcance de S1.

---

## 5. Rollback parcial: reconstruir sin borrar

Si el registro quedó con identidades acuñadas por una versión defectuosa del
canonicalizador, **no hace falta borrarlo**. El mecanismo está diseñado para eso:

- `rebindSignature()` asocia la firma nueva a la identidad existente sin rotar el
  ID (verificado: 76 identidades reasociadas, 0 rotaciones);
- una identidad que resultó ser duplicada de otra se marca
  `status = 'merged'` con `merged_into_id` apuntando a la ganadora, y **conserva
  su ID para siempre**. Un ID nunca se borra ni se reasigna: es la única forma de
  que una referencia antigua no se convierta en una mentira.

La curación de duplicados no está implementada en S1 (no hay ninguno que curar
todavía). Las columnas `status` y `merged_into_id` existen para cuando lo esté.

---

## 6. Lo que NO se puede revertir con un flag

Nada, hoy. Es deliberado: S1 no toca `mobile/`, no cambia slugs, no escribe en
`price_history` ni en `medications`, y no persiste nada que un cliente ya
publicado lea. **La reversibilidad total es la propiedad que hace que este PR se
pueda mergear antes de decidir si v2 sigue.**
