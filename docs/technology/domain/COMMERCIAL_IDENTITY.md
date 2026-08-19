# Identidad Comercial de Medicamentos (FASE 1 — Product Identity)

| Campo | Valor |
|---|---|
| **Fecha** | 2026-08-19 |
| **Estado** | Implementado (FASE 1) |
| **Origen** | Auditoría P0 — fusión incorrecta de Omeprazol 20mg x30 (Ascend / OPKO-Ley Cenabast / CuraeSpring) bajo el mismo `matchKey` |
| **Documentos relacionados** | `docs/technology/domain/NORMALIZATION_AND_DEDUPLICATION.md` (matchKey, mergeDuplicates — sin cambios en su cálculo), `docs/technology/decisions/rfc/RFC-002_CANONICAL_MEDICATION_REGISTRY.md` (CFM-ID — ver FOLLOW_UP §5) |

## 1. Dos identidades, dos propósitos

- **`matchKey`** (`packages/domain/src/matching.ts`) — identidad **farmacológica amplia**: principio activo + dosis + cantidad (+ turno día/noche). Es el mecanismo que usan historial de precios, alertas, favoritos, tracking y el registro canónico CFM-ID (RFC-002). **No cambió** en esta fase — ni su cálculo ni su semántica.
- **`presentationKey`** (`packages/domain/src/commercialIdentity.ts`) — identidad **comercial**: `matchKey` + bioequivalencia + marca/laboratorio normalizado. Es la clave que `mergeDuplicates` usa para decidir si dos ofertas son **SAME_PRODUCT** (mismo artículo comercial, precios comparables entre sí) o si deben mostrarse por separado.

Ejemplo real (Omeprazol 20mg x30, mismo `matchKey`, tres productos comerciales distintos):

```
omeprazol|20mg|30|bio:false|brand:ascend
omeprazol|20mg|30|bio:false|brand:opko
omeprazol|20mg|30|bio:false|brand:curaespring
```

## 2. Regla de identidad comercial

`resolveCommercialIdentity()` resuelve la marca de una oferta con evidencia auditable, en orden de prioridad:

| Prioridad | Fuente | Confianza |
|---|---|---|
| 1 | Campo estructurado (`laboratory`/`manufacturer`/`brand` que ya entrega la farmacia) | `high` |
| 2 | Marca extraída de `onlineUrl` (patrón acotado, verificado contra EasyFarma) | `medium` |
| — | Sin evidencia suficiente | `unknown` (nunca se inventa una marca) |

**Política conservadora, explícita y deliberada:** una oferta con identidad comercial conocida **nunca** se fusiona con una de identidad `unknown`. Se prefiere un falso negativo temporal (el mismo producto mostrado en dos tarjetas) antes que un falso positivo de precio (dos productos distintos mostrados como uno). Dos ofertas `unknown` entre sí sí pueden agruparse — es una limitación conocida y aceptada (sin ninguna evidencia de marca en ninguna de las dos, no hay base para separarlas con seguridad), no un bug.

## 3. Normalización — pequeña, explícita, testeada

`normalizeBrandToken()` no usa una lista gigante ni heurísticas fonéticas genéricas. Solo: minúsculas + sin acentos, remoción de un puñado de frases de ruido conocidas ("Ley Cenabast", "Cenabast", "descuento", "laboratorios"/"labs"/"lab"), y un alias explícito documentado (`curaspring` → `curaespring`, variante de escritura real observada en producción para el mismo laboratorio). Cada regla está cubierta por tests en `packages/domain/src/__tests__/commercialIdentity.test.ts`.

Extracción de marca desde `name` (texto libre) **no se implementó en esta fase** — ninguna farmacia auditada tiene un patrón confiable sin riesgo de falso positivo (ver comentario en `resolveCommercialIdentity()`). El tipo `CommercialIdentitySource` ya contempla `"name"` para cuando se identifique un patrón seguro.

## 4. Qué NO cambió

- `matchKey` — mismo algoritmo, mismo significado, mismos 38+ tests intactos.
- Historial de precios, alertas, favoritos, tracking, cache keys de Supabase (`price_history`, `pharmacy_clicks`, `email_alerts`) — todos siguen persistiendo por `matchKey`, sin ningún cambio de esquema.
- CFM-ID (RFC-002) — sigue operando sobre `matchKey`, sin cambios de código ni de tabla.
- Contrato público de `/api/search` — `MedicationResult` sigue exponiendo todos sus campos existentes; `presentationKey` es aditivo.

## 5. FOLLOW_UP — evolución futura de CFM-ID hacia presentationKey

RFC-002 (`medications`/`medication_match_key_aliases`) declara explícitamente en su propio texto (§3, "Qué NO resuelve este RFC") que el registro canónico opera a la misma granularidad que `matchKey` y **hereda sus imperfecciones**, incluida la fusión de marcas distintas — es decir, el CFM-ID de hoy identifica "Omeprazol 20mg x30" en general, no "Omeprazol 20mg x30 Ascend" en particular. Este documento **no reabre ni modifica RFC-002** — solo registra, como trabajo futuro, que una evolución natural sería que el registro canónico opere sobre `presentationKey` (o una clave derivada de ella) en vez de `matchKey`, para que un CFM-ID represente un producto comercial específico. Esto es exactamente la clase de evolución que el propio RFC-002 proyecta hacia el "Pharmaceutical Knowledge Graph" (`DOMAIN_MODEL.md` §6) y su Fase 6 de curación manual — no un cambio urgente, y explícitamente fuera de alcance de FASE 1.
