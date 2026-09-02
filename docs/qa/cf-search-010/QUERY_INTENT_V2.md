# CF-SEARCH-010 — Query Intent v2

Propuesta de diseño. **No implementada.**

**Principio no negociable:** la consulta **nunca** modifica `conceptId`,
`presentationId`, `productId` ni `offerId`. La intención solo **clasifica** y
**ordena** lo ya identificado.

CF-SEARCH-002 estableció esta separación y **se conserva íntegra**. Lo que este
documento propone es (a) enriquecer la intención con los ejes que hoy faltan y
(b) reemplazar la cohorte de 3 valores por una clasificación de 5.

---

## 1. La intención

```ts
interface QueryIntentV2 {
  rawQuery: string;
  retrievalQuery: string;          // cleanQuery(raw) — SIN CAMBIOS

  activeIngredients: string[];     // resueltos contra el vocabulario de INN
  brandTerms: string[];            // términos que no son INN conocidos
  concentration: ConcentrationEvidence;   // ratio | mass-only | absent  (CANONICAL_IDENTITY_MODEL §3.2)
  dosageForm: DosageForm | null;
  packageVolume: Measurement | null;      // NUEVO — hoy no se extrae
  quantity: number | null;
  route: AdministrationRoute | null;      // NUEVO
}
```

### Ejemplo obligatorio del ticket

```
"ambroxol 30mg/5ml jarabe 100ml"
  retrievalQuery     "ambroxol"
  activeIngredients  ["ambroxol"]
  brandTerms         []
  concentration      { kind: "ratio", value: 30 mg / 5 mL }
  dosageForm         "fluid-oral"
  packageVolume      100 mL
  quantity           null
  route              "oral"
```

### El caso que hoy falla

```
"ambroxol 30mg"
  concentration      { kind: "mass-only", value: 30 mg }     ← NO { 30 mg, denominator: null }
```

La diferencia es el tipo, y cambia toda la clasificación: `mass-only` es
**evidencia incompleta**, no una dosis absoluta afirmada. En v1 se representa
como `{numerator:{30,"mg"}, denominator:null}`, indistinguible de "500 mg
comprimido", y por eso `isSameConcentration` la declara distinta de
`30 mg/5 mL` y la cohorte hunde 32 tarjetas correctas.

**`packageVolume` separado de `concentration`** es lo que permite que
`"ambroxol 30mg/5ml jarabe 100ml"` no interprete el `100ml` como parte de la
dosis pedida.

---

## 2. Clasificación de relevancia — 5 niveles

Cada resultado se clasifica frente a la intención:

| Nivel | Significado | Regla |
|---|---|---|
| **EXACT** | Coincide en todos los ejes que la consulta declaró | Concepto ✓, concentración `ratio`=`ratio` ✓, forma ✓, cantidad/volumen ✓ (los no declarados no cuentan) |
| **COMPATIBLE** | No contradice nada, y la evidencia disponible apunta al mismo concepto | Incluye **`mass-only` vs `ratio` con el mismo numerador** — el caso `ambroxol 30mg` |
| **ALTERNATIVE** | Mismo principio activo (o bioequivalente), otra concentración/forma/presentación | Es lo que hoy se llama `other`, pero como oferta explícita al usuario, no como castigo |
| **UNKNOWN** | La consulta pidió un eje y el resultado no lo declara | Nombre truncado (EasyFarma, 68 % de sus ofertas) |
| **INCOMPATIBLE** | Evidencia fuerte de que es otra cosa | Otro principio activo (omeprazol/esomeprazol), otra vía de administración |

### Orden

```
EXACT  →  COMPATIBLE  →  UNKNOWN  →  ALTERNATIVE  →  INCOMPATIBLE
```

Dentro de cada nivel: precio efectivo ascendente (criterio histórico).

**Los tres cambios respecto de v1:**

1. **`COMPATIBLE` es un nivel propio y va arriba.** En v1, `exact` y
   `compatible` comparten tier léxico pero la cohorte de concentración
   (`exact`/`unknown`/`other`) es un límite duro que los cruza. El producto
   correcto de `ambroxol 30mg` cae en `other` y queda debajo de comprimidos de
   $11.190. En v2 cae en `COMPATIBLE`, arriba.
2. **`INCOMPATIBLE` no se elimina, se muestra al final.** Se conserva la
   política del proyecto: *este módulo nunca elimina resultados*
   (`relevance.ts:26`).
3. **`ALTERNATIVE` es una propuesta, no una degradación.** Un usuario que busca
   `ibuprofeno 600 mg` y solo encuentra 400 mg debe ver el 400 mg etiquetado
   como alternativa, no escondido. La UI ya tiene el mecanismo
   (`splitGroupsByConcentration`).

### Se conserva de v1 sin cambios

- La cohorte de concentración sigue siendo un **límite duro que el precio no
  cruza** (`relevance.ts:301`). Un ibuprofeno 400 mg barato no puede aparecer
  antes que un 600 mg caro si se pidió 600 mg.
- `evaluateLexicalMatch` con sus dos guardas (`MIN_SUBSTRING_LENGTH = 5`,
  `MIN_LENGTH_DIFFERENCE = 2`) — resuelven QA-02 y el caso real del soft hyphen
  en "Tapsín".
- `rankByRelevance` idempotente: recalcula toda la evidencia desde los nombres,
  para que un hit de caché de retrieval se pueda re-rankear con otra intención.
- La caché de dos niveles (`cfsearch:r:` retrieval / `cfsearch:v2:` respuesta).

---

## 3. Verificación contra el corpus

Sobre las 891 tarjetas devueltas a consultas con concentración:

| Cohorte v1 | Tarjetas | Clasificación v2 esperada |
|---|---:|---|
| `exact` (218) | 218 | EXACT |
| `unknown` (95) | 95 | UNKNOWN |
| `other` (578) | **32** | **COMPATIBLE** — mismo numerador, `mass-only` vs `ratio` |
| | 546 | ALTERNATIVE (correcto: son otra concentración) |

Las 32 son el defecto medido. En `ambroxol 30mg` son 12 de las 57 tarjetas, e
incluyen **todos** los jarabes de 30 mg/5 mL del catálogo, entre $790 y $1.990.

**Es una hipótesis de diseño, no un resultado.** Se valida en shadow mode antes
de exponerse — ver `SHADOW_MODE_DESIGN.md`.

---

## 4. Lo que la intención NO puede hacer

| Prohibición | Por qué |
|---|---|
| Modificar `conceptId`/`presentationId`/`productId`/`offerId` | El mismo producto debe tener la misma identidad para las 16 consultas del corpus. Hoy ya se cumple y no se relaja |
| Restringir el retrieval | `cleanQuery` sigue mandando el término amplio a las 9 farmacias. Restringirlo devuelve menos resultados (CF-SEARCH-002, verificado) |
| Eliminar resultados | Política del proyecto |
| Alterar `price_history` | El histórico no depende de con qué consulta se llegó al producto (`searchService.ts:157`) |
