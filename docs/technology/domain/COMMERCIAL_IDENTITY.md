# Identidad Comercial de Medicamentos (FASE 1 — Product Identity)

| Campo | Valor |
|---|---|
| **Fecha** | 2026-08-19 (FASE 1), actualizado 2026-08-19 (FASE P1 — hardening) |
| **Estado** | Implementado (FASE 1 + FASE P1) |
| **Origen** | Auditoría P0 — fusión incorrecta de Omeprazol 20mg x30 (Ascend / OPKO-Ley Cenabast / CuraeSpring) bajo el mismo `matchKey`. FASE P1: auditoría de producción real (5 búsquedas) encontró `commercialIdentity` inválidos ("detalleproducto", "recubiertos", "chile" vía URL, "100ml", "x30com", el propio principio activo, etc.) — ver §5. |
| **Documentos relacionados** | `docs/technology/domain/NORMALIZATION_AND_DEDUPLICATION.md` (matchKey, mergeDuplicates — sin cambios en su cálculo), `docs/technology/domain/PRODUCT_IDENTITY.md` (CF-SEARCH-001 — ejes `\|var:`/`\|form:` de `presentationKey` e integridad de oferta), `docs/technology/decisions/rfc/RFC-002_CANONICAL_MEDICATION_REGISTRY.md` (CFM-ID — ver FOLLOW_UP §6) |

> **Actualización 2026-08-27 (CF-SEARCH-001).** `resolveCommercialIdentity` no cambió, pero se comprobó su límite: resuelve el **laboratorio**, que es el mismo para todas las variantes comerciales de una familia de marca (Tapsin Rojo, Forte, Periodo, Duo, Migraña e Instaflu son todos de Maver). El eje `brand:` por sí solo no puede separarlas, y la separación que a veces se observaba era accidental — dependía de que una farmacia entregara `laboratory` y la otra no (`brand:maver` vs `brand:unknown`). `presentationKey` incorporó por eso los ejes `\|var:` y `\|form:`; ver `PRODUCT_IDENTITY.md`.

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
| 1 | Campo estructurado (`laboratory`/`manufacturer`/`brand` que ya entrega la farmacia) — **solo si pasa la validación de plausibilidad (§2b)** | `high` |
| 2 | Marca extraída de `onlineUrl` — **solo para farmacias con patrón de URL verificado (hoy: únicamente EasyFarma, §2c) y solo si pasa §2b** | `medium` |
| — | Sin evidencia suficiente, o candidato implausible en cualquiera de los dos pasos anteriores | `unknown` (nunca se inventa una marca) |

**Política conservadora, explícita y deliberada:** una oferta con identidad comercial conocida **nunca** se fusiona con una de identidad `unknown`. Se prefiere un falso negativo temporal (el mismo producto mostrado en dos tarjetas) antes que un falso positivo de precio (dos productos distintos mostrados como uno). Dos ofertas `unknown` entre sí sí pueden agruparse — es una limitación conocida y aceptada (sin ninguna evidencia de marca en ninguna de las dos, no hay base para separarlas con seguridad), no un bug. **Esta política no cambió en FASE P1** — el hardening solo endurece qué cuenta como "evidencia suficiente", nunca la debilita.

### 2b. Validación de plausibilidad (FASE P1 — hardening, 2026-08-19)

Hasta FASE 1, cualquier token no vacío que saliera de `normalizeBrandToken()` se aceptaba como marca — esto permitía que ruido de URL o campos estructurados de mala calidad se convirtiera en una "marca" válida. FASE P1 agrega un paso de validación explícito, `isPlausibleCommercialIdentity()` (`packages/domain/src/commercialIdentity.ts`), que se aplica **después** de normalizar y **antes** de aceptar cualquier candidato (estructurado o de URL). Rechaza por categoría, no por una lista gigante manual:

| Categoría | Regla | Ejemplos reales rechazados |
|---|---|---|
| `ACTIVE_INGREDIENT_NOT_BRAND` | El candidato coincide con (o es un run-on que empieza por) el principio activo de **esta misma oferta**, leído del primer segmento de su propio `matchKey`, y ese principio activo está en la lista pequeña y evidenciada `KNOWN_ACTIVE_INGREDIENTS` | `omeprazol`, `ibuprofeno`, `paracetamol`, `losartan`, `amoxicilina`, `losartanhidroclorotiazida`, `lorsartanpotasicohidroclorotiazida`, `amoxicilinaacidoclavulanico` |
| `DOSAGE_FORM_NOT_BRAND` | El candidato es una forma farmacéutica conocida (`DOSAGE_FORM_WORDS`) | `recubiertos`, `blandas`, `blanda`, `granulos`, `masticables`, `jarabe`, `oral` |
| `QUANTITY_TOKEN` | El candidato es un token de cantidad/dosis puro (`QUANTITY_TOKEN_PATTERN`) | `100ml`, `120ml`, `500mg`, `x30com`, `x20com` |
| `URL_GENERIC_TOKEN` | (solo para candidatos de URL) el candidato es un token de navegación/URL genérico (`URL_GENERIC_TOKENS`) — no aplica a campos estructurados | `detalleproducto`, `producto`, `chile` (cuando viene de URL, no de un campo estructurado) |
| `RUNON_TOO_LONG` | El candidato supera 20 caracteres — casi siempre una composición completa colada como marca | (los mismos ejemplos de `ACTIVE_INGREDIENT_NOT_BRAND` de más de 20 caracteres) |
| `STRUCTURED_SENTENCE` | (solo para campos estructurados) el texto crudo original tiene más de 3 palabras — casi seguro no es un nombre de marca sino una oración/descriptor colado por error | `"Losartan Potasico 50 mg x 30 Comprimidos susc-1 de 6 meses"` (observado en Salcobrand) |

**¿Por qué la guardia de principio activo necesita una lista pequeña además del `matchKey`?** `matchKey()` (`matching.ts`) extrae la primera palabra-marca del nombre sin distinguir si es un principio activo genérico o el nombre propio de un producto de marca (`Tapsin`, `Actron`, `Kitadol`, `Corodin`, `Cozaar`, `Hyzaar`, `Lomex` — todos observados en la auditoría). Si se rechazara cualquier candidato que coincidiera con el primer segmento de `matchKey` sin este filtro adicional, se perderían también esas marcas reales. `KNOWN_ACTIVE_INGREDIENTS` es intencionalmente pequeña y evidenciada (los 5 términos de la auditoría de producción de FASE P1 más las moléculas relacionadas observadas en los mismos resultados) — no un intento de enumerar todos los principios activos existentes.

### 2c. Campos estructurados — ya no se confían automáticamente (FASE P1)

Hasta FASE 1, cualquier `laboratory`/`brand` estructurado no vacío se aceptaba como `HIGH` sin más validación. La auditoría de producción encontró campos estructurados de mala calidad en más de una farmacia — Salcobrand, en particular, entregó en algunos casos el nombre completo de la composición (`"Losartan Hidroclorotiazida"`, `"Lorsartan Potasico Hidroclorotiazida"`) o un descriptor de suscripción completo como si fuera marca. **Política nueva:** `STRUCTURED + plausible => HIGH`; `STRUCTURED + implausible => se degrada, intenta URL (§2d) o cae a UNKNOWN` — nunca se "premia" un campo estructurado de mala calidad con confianza `HIGH` solo por venir de un campo dedicado.

### 2d. Extracción desde URL — restringida a farmacias con patrón verificado (FASE P1)

Antes de FASE P1, `extractBrandFromUrl()` se aplicaba a la URL de **cualquier** farmacia, aunque solo estuviera verificada contra los patrones reales de EasyFarma. Esto producía candidatos de URL genéricos en otras farmacias: `"chile"` (sufijo de país en URLs de Ahumada, sin relación con ningún laboratorio), `"detalleproducto"` (páginas genéricas de Sermecoop), formas farmacéuticas o cantidades como último tramo (EcoFarmacias, Cruz Verde). **Decisión (preferencia explícita del CTO):** la extracción desde URL ahora solo se intenta si el host de `onlineUrl` está en una whitelist pequeña de farmacias con patrón verificado (`RELIABLE_URL_HOSTS` — hoy, únicamente `nuevo.easyfarma.cl`). Para cualquier otra farmacia, `resolveCommercialIdentity()` ni siquiera llama a `extractBrandFromUrl()` — retorna `unknown` directamente por falta de evidencia, en vez de intentar adivinar con un parser genérico. Se evaluaron tres opciones (parser específico por farmacia, whitelist de hosts, genérico + validación fuerte); se eligió la whitelist de hosts por ser la de menor riesgo y menor mantenimiento, sin sacrificar cobertura real (ninguna otra farmacia tenía, a la fecha de esta auditoría, un patrón de URL confiable observado).

## 3. Normalización — pequeña, explícita, testeada

`normalizeBrandToken()` no usa una lista gigante ni heurísticas fonéticas genéricas. Solo: minúsculas + sin acentos, remoción de un puñado de frases de ruido conocidas, y alias explícitos documentados. Cada regla está cubierta por tests en `packages/domain/src/__tests__/commercialIdentity.test.ts`.

Frases de ruido (`NOISE_PHRASES`), FASE 1 + FASE P1:

| Frase | Motivo |
|---|---|
| "Ley Cenabast" / "Cenabast" | Programa de compra pública, no marca |
| "descuento" | Calificador comercial, no marca |
| "laboratorios" / "laboratorio" / "labs" / "lab" | Palabra genérica de rol, no de marca — permite que "Laboratorio Chile" se normalice a la marca real "chile" |
| "genericos" / "genericas" **(FASE P1)** | Calificador de línea de producto ("Genéricos Ascend"), no marca por sí solo — ver decisión documentada abajo |
| "caja dañada" / "caja manchada" / "caja golpeada" / "caja arrugada" **(FASE P1)** | Descriptor del estado físico del empaque (observado en EcoFarmacias/Cruz Verde), misma categoría semántica que "descuento" — no identifica un producto distinto |

Alias explícitos (`KNOWN_BRAND_ALIASES`): `curaspring` → `curaespring` (variante de escritura real observada en producción para el mismo laboratorio, Farmex vs EasyFarma).

**Decisión documentada — "genericosascend" (FASE P1):** se observó en la auditoría de producción como `commercialIdentity` resuelto, un token compuesto de "genericos" + "ascend". No fue posible confirmar contra el `name`/`onlineUrl` exacto de esa oferta específica en esta sesión (sin acceso a `debug=1`), pero "Genéricos Ascend" es una convención de nomenclatura estándar (línea de genéricos de un laboratorio) y el token contiene literalmente "ascend". Bajo la política conservadora, la opción más segura es tratar "genéricos"/"genéricas" como frase de ruido (no como alias puntual de "ascend") — así, si de verdad identifica a Ascend, normaliza correctamente; si no lo fuera, el riesgo de fusión incorrecta es mínimo porque "genéricos" nunca es en sí mismo una marca.

Extracción de marca desde `name` (texto libre) **sigue sin implementarse** — ninguna farmacia auditada tiene un patrón confiable sin riesgo de falso positivo (ver comentario en `resolveCommercialIdentity()`). El tipo `CommercialIdentitySource` ya contempla `"name"` para cuando se identifique un patrón seguro.

## 4. Qué NO cambió

- `matchKey` — mismo algoritmo, mismo significado, mismos 38+ tests intactos.
- Historial de precios, alertas, favoritos, tracking, cache keys de Supabase (`price_history`, `pharmacy_clicks`, `email_alerts`) — todos siguen persistiendo por `matchKey`, sin ningún cambio de esquema.
- CFM-ID (RFC-002) — sigue operando sobre `matchKey`, sin cambios de código ni de tabla.
- Contrato público de `/api/search` — `MedicationResult` sigue exponiendo todos sus campos existentes; `presentationKey` es aditivo.

## 5. FASE P1 — auditoría de producción y resultado del hardening

Auditoría real (5 búsquedas: omeprazol, paracetamol, losartán, ibuprofeno, amoxicilina, 2026-08-19) encontró 213 ofertas ya en `unknown` y 311 con `commercialIdentity` no-`unknown`, de las cuales una simulación fiel de las nuevas reglas (aplicada sobre los tokens ya resueltos por el código anterior, con las limitaciones de reconstrucción descritas abajo) reclasifica aproximadamente 105 (~34%) como `unknown` por caer en alguna categoría de la §2b/§2d — quedando 206 identidades conocidas genuinas intactas (Ascend, OPKO, CuraeSpring, Teva, Notts, Maver, Hospifarma, Hetero, Seven Pharma, Actron, Corodin, Cozaar, Hyzaar, Lomex, Tapsin, Kitadol, Eurofarma, GSK, Andrómaco, etc. — ninguna marca real conocida se perdió). Ningún caso de fusión incorrecta conocido (Ascend/OPKO/CuraeSpring) se vio afectado — siguen correctamente separados.

**Limitación metodológica de esta medición (documentada, no oculta):** la comparación ANTES/DESPUÉS se hizo re-evaluando, con las nuevas reglas de plausibilidad, los tokens **ya normalizados** que el código anterior había resuelto contra producción real — no fue posible re-ejecutar `resolveCommercialIdentity()` con el campo `structuredBrand` crudo original de cada oferta individual (la API pública no expone ese campo pre-fusión, y esta sesión no tuvo acceso a `debug=1`). Esto significa que la medición **subestima** la mejora real en dos casos ya verificados por tests unitarios pero no visibles en la métrica agregada:
- `"danada"`/`"arrugada"` — el código real los elimina en el paso de normalización (`NOISE_PHRASES`, §3) antes siquiera de llegar a la validación de plausibilidad; la métrica agregada no puede reproducir ese paso porque solo tiene el token ya normalizado por el código viejo (sin las nuevas frases de ruido).
- `"meses"` — el código real lo rechaza por `STRUCTURED_SENTENCE` (§2b), que depende del texto crudo original (`"...susc-1 de 6 meses"`), no disponible a nivel agregado.

Ambos casos están cubiertos por tests unitarios explícitos contra el texto crudo real observado (`packages/domain/src/__tests__/commercialIdentity.test.ts`) y confirmados como corregidos ahí, aunque la métrica agregada de esta sección no los refleje.

**Residuales observados, no corregidos en esta fase (evidencia insuficiente o riesgo bajo, no ameritan una regla nueva todavía):** `"pharma"` (posible truncamiento de un nombre de laboratorio más largo, un solo caso, no se pudo confirmar), `"perritos"` (token anómalo, un solo caso, farmacia/contexto no confirmado sin `debug=1`), `"actron600"` (marca real "Actron" con la dosis concatenada — no crea una identidad incorrecta, solo una fragmentación menor evitable con una mejora de normalización futura). Ninguno de estos representa un riesgo de fusión incorrecta entre marcas distintas; se documentan aquí para que una fase futura decida si amerita evidencia adicional o una regla nueva.

## 6. FOLLOW_UP — evolución futura de CFM-ID hacia presentationKey

RFC-002 (`medications`/`medication_match_key_aliases`) declara explícitamente en su propio texto (§3, "Qué NO resuelve este RFC") que el registro canónico opera a la misma granularidad que `matchKey` y **hereda sus imperfecciones**, incluida la fusión de marcas distintas — es decir, el CFM-ID de hoy identifica "Omeprazol 20mg x30" en general, no "Omeprazol 20mg x30 Ascend" en particular. Este documento **no reabre ni modifica RFC-002** — solo registra, como trabajo futuro, que una evolución natural sería que el registro canónico opere sobre `presentationKey` (o una clave derivada de ella) en vez de `matchKey`, para que un CFM-ID represente un producto comercial específico. Esto es exactamente la clase de evolución que el propio RFC-002 proyecta hacia el "Pharmaceutical Knowledge Graph" (`DOMAIN_MODEL.md` §6) y su Fase 6 de curación manual — no un cambio urgente, y explícitamente fuera de alcance de FASE 1.
