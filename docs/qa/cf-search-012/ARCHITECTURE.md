# CF-SEARCH-012 S1 — Arquitectura

## 1. Las tres responsabilidades, separadas de verdad

S0 demostró que se puede DERIVAR identidad canónica. Lo que no podía hacer era
ASIGNARLA de forma permanente, porque no tenía dónde guardarla y porque su
mecanismo de resolución usaba como anfitrionas las firmas del corpus recuperado
— es decir, el conjunto circunstancial de ofertas que una búsqueda devolvió.

S1 parte la responsabilidad en tres piezas que no se tocan entre sí:

```
  CANONICALIZATION            texto libre → atributos tipados
  packages/domain/src/searchV2/canonicalAttributes.ts (+ compositionReader)
  · PURA por observación: no mira ninguna otra oferta, no ve el registro
  · sin cambios de conducta respecto de S0
                        │
                        ▼
  RESOLUTION                  firma observada vs identidades PERSISTIDAS
  packages/domain/src/searchV2/canonicalResolver.ts
  · pura: recibe una firma y una lista de candidatos, devuelve una decisión
  · NO escribe, NO conoce el repositorio, NO conoce la consulta
                        │
                        ▼
  IDENTITY ASSIGNMENT         acuñar o reutilizar un ID PERMANENTE
  packages/domain/src/searchV2/canonicalIdentityAssigner.ts
  · única pieza que escribe, y solo a través del puerto del repositorio
```

La frontera se puede comprobar leyendo las firmas de las funciones:
`resolveAgainstRegistry(observed, candidates, options)` no recibe repositorio; y
`assignIdentity(repository, input)` no recibe consulta, ranking ni precio.

---

## 2. De qué NO puede depender la identidad

Ninguno de estos datos entra en ninguna firma de identidad. No es disciplina: es
que la función que las construye no los recibe.

| Dato | Dónde está | Por qué no puede entrar |
|---|---|---|
| Consulta del usuario | no llega al asignador | la identidad del producto no cambia según cómo lo busquen |
| Ranking / posición | otra etapa, posterior | ADR-0005: "la identidad no dependerá del ranking" |
| Orden de llegada | — | verificado con el test de independencia de orden sobre el corpus real |
| Farmacia | eje de la OBSERVACIÓN, no del concepto | invariantes 1-4 del modelo canónico |
| Nº de resultados | — | el resolutor solo ve candidatos del REGISTRO |
| Candidatos recuperados | — | las anfitrionas salen del registro, nunca del corpus |
| Precio / stock / canal | `price_history`, fuera del registro | son mercado, no conocimiento |

---

## 3. La capa de persistencia

```
  domain                        api
  ─────────────────────────     ────────────────────────────────────
  CanonicalRegistryRepository   SupabaseCanonicalRegistry   (producción)
  (puerto, sin SQL)         ◄── InMemoryCanonicalRegistry   (tests + harness)
```

**Ninguna sentencia SQL vive fuera de una implementación del puerto**, y
`searchService.ts` / `handleSearchRoute` no conocen ninguna de las dos: hablan
con el asignador. Es lo que permite correr S1 entero offline con la misma
semántica que contra Postgres, y lo que hace que "el registro cayó" sea una
condición local en vez de una excepción atravesando el motor de búsqueda.

`InMemoryCanonicalRegistry` no es una maqueta: modela la sección crítica de la
restricción UNIQUE (comprobar y escribir sin `await` en el medio) y emite IDs de
secuencia. Es la definición ejecutable de lo que la implementación Supabase debe
cumplir.

---

## 4. Dónde encaja el shadow

```
              9 farmacias  (un solo retrieval, sin peticiones nuevas)
                    │
                    ▼
              MedicationResult[]  ← v1, ya fusionado
                    │
        ┌───────────┴────────────────────────────┐
        │ json(res, 200, …)                      │  scheduleSearchV2Shadow()
        ▼                                        ▼   (después de responder)
    USUARIO                            interruptor → muestreo → timeout
    (100 % v1)                                     │
                                                   ▼
                                          assignIdentity() × N
                                                   │
                                                   ▼
                                          canonical_* (Supabase)
```

Cinco propiedades, y dónde se cumple cada una:

1. **No cambia la respuesta** — se invoca después de `json(...)`, y
   `scheduleSearchV2Shadow` devuelve `void`, así que un `await` accidental es
   imposible.
2. **No agrega latencia** — `waitUntil` cuando el runtime lo expone; si no,
   desacoplado. Nunca se espera.
3. **No puede romper la búsqueda** — `try/catch` por oferta y global; un fallo
   del registro degrada a `unresolved` y sigue.
4. **No duplica tráfico a las farmacias** — reprocesa lo que v1 ya trajo. R-009:
   3 de 9 scrapers son frágiles.
5. **No escribe en tablas de v1** — solo en `canonical_*`.

---

## 5. Qué se reutilizó de S0, y qué no

**Se reutiliza sin cambios de conducta:** los 9 adapters, el modelo estructurado
de concentración, `dosageFormClass`, `unitCountKey`, `combinationKey`,
`resolveBrandIdentity`, `canonicalizeOffer`, `conceptSignature`,
`presentationSignature`, `compositionReader`.

**Se agrega, aditivo:** `IngredientComposition.negatedComponents` y
`CanonicalAttributes.negatedComponents`. La negación ya se calculaba
internamente; ahora se PUBLICA porque sin ella la clase 7 del Gate D no es
detectable. **No participa de ninguna firma**: el agrupamiento de S0 es idéntico
con y sin ella.

**No se reutiliza, y por qué:** `productSignature()` de S0 ancla el producto a la
PRESENTACIÓN. El EDM define el Producto Medicinal Comercial por marca,
laboratorio, registro ISP, estado y bioequivalencia — la presentación no es una
de sus propiedades — y declara que un Concepto se relaciona directamente con
"múltiples Productos Medicinales Comerciales". El registro usa
`registryProductSignature()`, anclada al CONCEPTO, y materializa el par
`(producto, presentación)` en su propia relación N:M. `productSignature()` de S0
queda intacta y sus tests siguen verdes sin tocarlos.

**No se reutiliza `resolveBySubsumption()`**, por la razón de fondo de S1: sus
anfitrionas son el corpus. El resolutor de S1 solo mira el registro.
