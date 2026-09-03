# CF-SEARCH-012 S1 — Asignación de identidad

## 1. La tabla de decisión, completa

`resolveAgainstRegistry(observed, candidates, { mintable })` — pura, sin
repositorio, sin consulta.

| Firma observada | Estado del registro | Desenlace | ¿Acuña? |
|---|---|---|---|
| cualquiera | existe un ALIAS con la firma idéntica | `exact` | no, reutiliza |
| parcial | exactamente 1 anfitriona maximal | `subsumed` | no, reutiliza |
| parcial | ≥ 2 anfitrionas maximales | `ambiguous` | **no, y no elige** |
| parcial, no acuñable | 0 anfitrionas | `unresolved` | no |
| acuñable | 0 anfitrionas | `created` | **sí** |

Dos detalles del orden que importan:

- **las anfitrionas se buscan ANTES de acuñar.** Reutilizar es siempre preferible
  a crear. Para una firma literalmente completa el paso no cambia nada (una firma
  completa no puede tener anfitrionas: `subsumes` exige un eje estrictamente más
  débil), pero para una acuñable-por-excepción sí.
- **de las anfitrionas se conservan solo las MAXIMALES.** La subsunción es
  transitiva: si A ⊂ B ⊂ C, A tiene dos candidatas y sin el filtro se declararía
  ambigua cuando el destino correcto es único.

Con ≥ 2 anfitrionas **no se elige**. Adivinar entre dos concentraciones
candidatas es el falso merge que el proyecto prohíbe por riesgo clínico
(`PRODUCT_IDENTITY.md` §10). La ambigüedad se registra con sus `candidate_ids`.

---

## 2. Qué firma habilita ACUÑAR

Acuñar es crear una identidad **científica permanente**. La regla base es la de
S0 —firma completa— con dos matices que derivan de la FORMA FARMACÉUTICA
DECLARADA, nunca de una inferencia sobre datos ausentes.

### Concepto

```
mintable(observación) =
    forma farmacéutica DECLARADA
  ∧ concentración ≠ absent
  ∧ (concentración ≠ mass-only  ∨  forma ∈ {comprimido, cápsula, supositorio, óvulo, parche})
  ∧ principio(s) activo(s) DEMOSTRADO(S) y completos
  ∧ (unidad DECLARADA  ∨  forma ∈ {líquido oral, crema, gel, pomada, loción,
                                    shampoo, inhalador, colirio, gotas óticas})
```

**Excepción de `unit`.** Un jarabe o una crema no se cuentan en unidades: son un
volumen o una masa continua dentro de un envase. La ausencia es una consecuencia
de la forma declarada, no un dato faltante. Es el mismo criterio que S0 ya aplica
en `FORMS_WITHOUT_PACKAGE_VOLUME`.

**Restricción de `conc` en `mass-only`.** En un comprimido, "500 mg" ES la
concentración. En un jarabe, "30 mg" es una lectura parcial de "30 mg/5 mL". Sin
esta restricción, "Ambroxol 30 mg Jarabe 100 ml" acuñaría un Concepto
Farmacéutico propio, permanente, distinto del de "Ambroxol 30 mg/5 mL Jarabe" —
un falso split grabado en piedra. Cremas y geles quedan fuera a propósito: su
concentración se declara en porcentaje y el lector de S0 no la modela (toma la
primera masa del nombre, que en esos nombres es el PESO DEL ENVASE; ver
`S1_FAILURES.md` §4).

**No hay excepción para `ing`.** Acuñar una identidad permanente para "no sé qué
molécula es esto" sería crear conocimiento científico donde no lo hay. Es la
restricción que más pesa sobre las cifras de S1 y está reportada como tal.

### Presentación

Sin excepciones: todos los ejes declarados. Una presentación que no dice ni
cuántas unidades trae ni qué volumen tiene no es una presentación, es una lectura
incompleta.

### Producto

Todos los ejes menos `isp`. Marca, variante, momento y laboratorio están SIEMPRE
declarados por construcción (su ausencia es un VALOR: `unbranded`, `none`,
`unidentified`). Exigir el registro sanitario haría el nivel inoperante —ningún
adaptador lo captura (#156)— y sería contrario a ADR-0005, que declara la fuente
ISP **en revisión** mientras #157 siga abierto.

---

## 3. La comparación se hace sobre el TEXTO de la firma

Lo único que el registro persiste de una identidad es el texto de su firma. Por
lo tanto toda decisión de resolución debe poder tomarse con ese texto y nada más.
Si una regla necesita un dato que la firma no conserva, **no es reproducible
contra un registro y no puede gobernar identidad permanente**.

### Un intento anterior hizo lo contrario y produjo 198 falsos merges reales

La primera implementación reconstruía la firma candidata como objeto y dejaba
decidir al comparador propio del eje observado (`compareConcentration`). Como la
firma reconstruida no llevaba la evidencia estructurada, ese comparador la leía
como `absent` —"no declara concentración"— en vez de como "declara otra".

Medido sobre el corpus congelado: **198 pares** de amoxicilina + ácido
clavulánico donde una presentación de **875/125 mg** quedaba subsumida dentro del
Concepto Farmacéutico de **500/125 mg**. Una potencia de antibiótico declarada
igual a otra distinta. Gate C = 0,4371 y Gate D = 0,4907.

### Por qué la regla mixta `mass-only ⊂ ratio` no sobrevive a la normalización

La tabla R5 de S0 decide comparando la masa contra el **numerador** de la razón.
La firma guarda la razón ya normalizada (`conc:ratio:6mg/ml`), y `30 mg/5 mL`,
`6 mg/mL` y `600 mg/100 mL` son la misma concentración y producen la misma firma
— aunque R5 daría respuestas distintas para cada escritura frente a una masa de
`30 mg`. `canonicalConcentration.ts` ya documenta ese caso como limitación
conocida. En un registro persistente eso significaría que la identidad depende de
**cómo estaba escrita** la oferta que acuñó el concepto, es decir del orden de
llegada.

**Decisión:** dos concentraciones DECLARADAS con firma distinta son
`incompatible`, aunque una sea masa y la otra razón. Es estrictamente más
conservador que S0 —produce, como mucho, un `unresolved` de más y jamás un merge
de más—, es la dirección que el proyecto eligió por riesgo clínico, y es
reproducible. El costo está medido: 98 observaciones (11,7 %) quedan
`unresolved` por esta regla (`S1_FAILURES.md` §3).

El eje `ing` SÍ conserva toda su semántica: el conjunto de moléculas y la
cardinalidad declarada son íntegramente recuperables del segmento
(`amoxicilina+?2` = "declara 2 componentes, nombré amoxicilina"), así que la
regla de contención de S0 se aplica igual.

---

## 4. Concurrencia e idempotencia

**Dos requests simultáneos con la misma firma completa no pueden acuñar dos IDs.**

`SupabaseCanonicalRegistry.create()` — tres pasos, ninguno capaz de duplicar:

1. **lectura** de la entidad por su firma. Resuelve el caso normal con un
   round-trip y sin escribir;
2. `insert … on conflict (canonical_signature) do nothing … returning *`. La
   atomicidad la da Postgres, no el código: el `id` lo genera la secuencia dentro
   del mismo statement, así que **no existe ventana entre "elijo un id" y "lo
   inserto"**. Si el statement no devuelve fila, otro proceso ganó: se **relee al
   ganador**. Nunca se reintenta insertar, y el `do nothing` evita las filas
   huérfanas que sí deja el patrón de RFC-002;
3. **alias**, también `do nothing`, publicado DESPUÉS de que la entidad existe —
   al revés habría una ventana en la que otra invocación resuelve a un ID sin
   fila.

`create*` devuelve `{ record, created }`: el llamador necesita saber si acuñó o
si perdió la carrera para reportar `identity_created` frente a `identity_reused`
sin mentir. `created: false` se traduce a desenlace `exact`.

**Idempotencia de la observación:** `observation_key = 'farmacia|referencia'`, con
`upsert on conflict`. La misma ficha vista mil veces produce una fila.

**Idempotencia del par:** `upsert on conflict (product_id, presentation_id)`.

**Verificado en test** (`searchV2.persistentRegistry.test.ts`, "CONCURRENT
CREATION"): con un gancho de latencia que intercala las dos llamadas justo donde
una implementación real haría el round-trip —las dos leen "no existe" antes de
que ninguna escriba—, salen un solo concepto y desenlaces `["created", "exact"]`.
Y sobre el corpus real: 30 observaciones de la misma firma lanzadas en paralelo →
1 identidad.

---

## 5. Degradación

Ningún método del repositorio lanza. Las lecturas devuelven `[]`; las acuñaciones,
`null`. El asignador traduce `null` a `unresolved` — **nunca a un identificador
inventado**, y nunca a una excepción que aborte el resto del lote.

Si el concepto no se resuelve, presentación y producto **no se inventan**: se
reportan `unresolved` con el motivo explícito. Una presentación sin concepto no es
una presentación de nada.

Si el registro entero cae, la búsqueda v1 termina normalmente: v1 no llama a nada
de este código.
