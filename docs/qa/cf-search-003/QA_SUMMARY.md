# CF-SEARCH-003 — Resumen de QA

| Campo | Valor |
|---|---|
| **Issue** | #144 — CF-SEARCH-003: Concentración incompatible en formas líquidas (P1) |
| **Base** | `origin/main` @ `2400fca1ee02a9be3a06ea4116c8a62e84c5706e` |
| **Branch** | `fix/cf-search-003-liquid-concentration` |
| **Captura** | 2026-08-31, `GET https://comparafarma-api.vercel.app/api/search?q=…` (read-only, público, sin `?debug=1`) |
| **Muestra** | 24 consultas · 1.599 tarjetas · 1.806 ofertas · 1.555 nombres únicos · 9 farmacias |
| **Resultado** | 7 falsos merges eliminados · 0 concentraciones incompatibles fusionadas · 0 falsos splits |

---

## 1. Causa raíz

`packages/domain/src/matching.ts:108-117` — `matchKey()` elige **una sola** dosis
y prioriza el mililitro sobre el miligramo:

```ts
if (mlHits.length)       dose = `${Math.max(...mlHits.map(...))}ml`;
else if (mcgHits.length) dose = `${...}mcg`;
else if (mgHits.length)  dose = `${...}mg`;
else if (gHits.length)   dose = `${...}mg`;
```

El nombre de un jarabe trae **los dos** números (`30 mg/5 mL … 100 mL`). Gana el
`ml`, y con `Math.max` gana además el más grande, que es el **volumen del
frasco**. Resultado: `ambroxol|100ml` — la concentración se descarta por
completo.

`presentationKey()` (`commercialIdentity.ts:614`) hereda esa clave y le agrega
`|bio:`, `|brand:`, `|combo:`, `|var:` y `|form:`. **Ninguno de esos ejes mira la
concentración**, así que dos jarabes de potencia distinta comparten clave.

`deduplication.ts::canMergeOffers()` era la última defensa —valida
`pharmacological`/`combination`/`variant`/`form`/`unitCount`— y tampoco tenía eje
de concentración. Las ofertas se fusionaban y la diferencia de precio se
presentaba como ahorro.

Es el eje simétrico de los que ya existen: `combo:` (S-1) separó combinaciones,
`unitCountKey` separó tamaños de envase; la concentración de líquidos es el que
faltaba.

---

## 2. Diseño

Eje **independiente**, en la capa de identidad, sin tocar `matchKey` ni
`presentationKey`:

- `liquidConcentration(name)` (`productIdentity.ts`) — concentración declarada,
  en dos niveles de evidencia:
  1. **razón masa/volumen** explícita (`30 mg/5 mL`, `600 mg/100 ml`, `0,5 mg/ml`);
  2. **masa absoluta** declarada *junto a un volumen* (`Cam Betametasona 2 mg
     Jarabe 120 mL`) — el caso en que ninguna fuente escribe la razón.
- `isCompatibleConcentration(a, b)` — dos concentraciones del mismo nivel y
  distinta potencia ⇒ incompatibles. Se comparan por **razón**, no por texto.
- El eje se consume en `canMergeOffers()` (deduplicación) y en `isSameProduct()`.

Las primitivas (`Measurement`, `Concentration`, tabla de unidades,
`isSameConcentration`) **no se duplicaron**: se movieron de `queryIntent.ts`
(CF-SEARCH-002) a `concentration.ts`, del que ahora dependen las dos capas.
`queryIntent.ts` no podía ser importado desde `productIdentity.ts` sin ciclo.

### Concentración ≠ volumen del envase

`"Ambroxol 30 mg/5 mL 100 mL"` → `concentración = 30 mg/5 mL`,
`volumen = 100 mL`. El volumen sigue gobernado por `matchKey`; el eje nuevo lo
ignora deliberadamente. Dos frascos de 60 mL y 100 mL de la misma concentración
siguen siendo compatibles.

El eje **no infiere** una razón por yuxtaposición: `"30 mg 100 ml"` es 30 mg/5 mL
envasado en 100 mL, no 30 mg/100 mL. Leerlo como razón inventaría una
concentración 20 veces menor — es la confusión que este ticket corrige.

---

## 3. Política "explícita vs ausente" (medida, no asumida)

`analysis/policy-evidence.json`. De los **157 grupos multi-oferta**:

| Clase | Grupos |
|---|---|
| todas sin concentración | 108 |
| todas explícitas y equivalentes | 30 |
| **explícitas INCOMPATIBLES** | **7** |
| mixtas (explícita + ausente) | 12 |

| Política | Falsos splits | Falsos merges corregidos |
|---|---|---|
| **(A) ausencia = comodín** ← elegida | **0** | 7 |
| (B) ausencia = bloqueo | 12 | 7 |
| (C) condicionada por otras señales | 0 | 7 (idéntico a A, regla menos auditable) |

Los 12 grupos mixtos son, uno por uno, la misma presentación escrita con y sin
concentración por dos farmacias — la que calla es la que trunca o abrevia el
nombre:

- `Alledryl (loratadina) Jarabe 60ml` (Sermecoop) vs `Alledryl Loratadina 5 mg / 5 mL Jarabe 60 mL` (Cruz Verde)
- `Cidoten Gotas x 30 ml` (EasyFarma) vs `Cidoten 0,5 Mg/ml Gotas X 30 Ml` (Sermecoop)
- `Paracetamol Gotas 15ml` (Salcobrand) vs `Paracetamol 100 mg Gotas 15 mL` (Cruz Verde)
- `Tocalm Ambroxol Jarabe Adulto 100 mL` (EcoFarmacias) vs `Tocalm Adulto Ambroxol 30 mg/5mL Jarabe 100 mL` (Cruz Verde)

(C) se descarta porque en los 12 grupos las otras señales de identidad ya
coinciden: produce el mismo resultado que (A) a cambio de una regla más difícil
de auditar. Sin un caso en la muestra donde cambie la decisión, no hay evidencia
que la justifique.

---

## 4. No degradar productos sólidos

Cobertura del eje por `dosageFormClass` sobre las 1.806 ofertas:

| Forma | Ofertas | Con razón | Con masa absoluta |
|---|---|---|---|
| `solid-oral` | 814 | **0** | **0** |
| `topical` | 118 | **0** | **0** |
| `suppository` | 44 | **0** | **0** |
| `fluid-oral` | 515 | 303 | 44 |
| `injectable` | 59 | 32 | 2 |
| (sin forma declarada) | 174 | 36 | 4 |
| `inhaled` | 61 | 1 | 0 |
| `ophthalmic` | 21 | 1 | 0 |

Ningún nombre de sólido, crema o supositorio declara una razón masa/volumen ni
una masa junto a un volumen. La dosis sólida (`500 mg x 20 comprimidos`,
`50 mg 5 supositorios`) **no la toca este eje ni por accidente**, sin necesidad
de un filtro por forma farmacéutica — que además dejaría fuera las 40 ofertas
líquidas cuyo nombre no declara forma reconocible.

---

## 5. A/B sobre datos reales

`analysis/ab-merge.json`, `analysis/pair-split.json`.

| Métrica | Base (`2400fca`) | Branch |
|---|---|---|
| Consultas | 24 | 24 |
| Ofertas de entrada | 1.806 | 1.806 |
| Tarjetas | 1.599 | 1.606 (+7) |
| Consultas con delta | — | 5 |
| **Concentraciones explícitamente incompatibles fusionadas** | **7** | **0** |
| Falsos merges eliminados | — | 7 |
| Pares de ofertas que compartían tarjeta | 274 | — |
| Pares separados | — | 14 |
| · separación directa (par contradictorio) | — | 12 |
| · separación colateral (comodín que debe caer de un lado) | — | 2 |
| · **separación no intencional (falso split)** | — | **0** |
| **Diferencias de `presentationKey`** (1.806 ofertas) | — | **0** |
| **Diferencias de `matchKey`** (1.555 nombres únicos) | — | **0** |

Consultas con delta: `ambroxol` (54→56), `betametasona` (114→115), `ibuprofeno`
(109→111), `muxol` (18→19), `pyriped` (10→11).

Las 2 separaciones colaterales son consecuencia necesaria de una separación
correcta: una oferta que no declara concentración (comodín) no puede quedar en
las dos tarjetas resultantes a la vez.

---

## 6. Robustez del recorrido de aceptación

`deduplication.ts` validaba cada oferta **solo contra la canónica**. La
compatibilidad con `null` no es transitiva, así que si la oferta canónica fuera
la que calla, dos ofertas mutuamente contradictorias entrarían las dos a la misma
tarjeta. Verificado ejecutando las dos estrategias sobre el mismo caso:

```
canonical-only    -> 1 tarjeta: [Ambroxol jarabe 100 ml + Ambroxol 30mg/5ml + Ambroxol 15 mg/5mL]
all-pairs (branch)-> 2 tarjetas: [Ambroxol jarabe 100 ml + Ambroxol 30mg/5ml] · [Ambroxol 15 mg/5mL]
```

Sobre la captura del 2026-08-31 las dos estrategias dan el **mismo** resultado
(0 incompatibles fusionadas): en este snapshot la canónica nunca resulta ser el
comodín. Se adopta igual la validación contra todas las ofertas aceptadas porque
la elección de canónica depende de qué farmacias respondan y de la longitud de
sus nombres — variables de dato, no de código. Delta medido sobre datos reales:
**0 tarjetas**.

---

## 7. Criterios de aceptación

| # | Criterio | Estado | Evidencia |
|---|---|---|---|
| 1 | Los 5 falsos merges de CF-QA-001 eliminados | ✅ | `cases/`, `analysis/ab-merge.json` |
| 2 | 0 concentraciones explícitamente incompatibles fusionadas | ✅ | `incompatibleConcentrationsMergedPr: 0` |
| 3 | Formatos distintos pero equivalentes siguen compatibles | ✅ | `liquidConcentration.test.ts` §3 |
| 4 | Concentración y volumen de envase separados | ✅ | `liquidConcentration.test.ts` §2 |
| 5 | Sin falsos splits masivos | ✅ | `separatedUnintended: 0` |
| 6 | `matchKey` compatible, contrato intacto | ✅ | `analysis/matchkey-contract.json` → `MATCHKEY_CONTRACT_INTACT` |
| 7 | Cantidad / forma / variante / combinación no rotos | ✅ | 0 diferencias en los 4 ejes (mismo informe) |
| 8 | Tests domain/api/web/mobile verdes | ✅ | 350 + 383 + 281 + 51 = 1.065 |
| 9 | Typecheck verde | ✅ | `pnpm typecheck` (domain + api + web + mobile) |
| 10 | Evidencia A/B reproducible | ✅ | `scripts/`, `raw/`, `analysis/` |
| 11 | Impacto en `presentationKey` documentado | ✅ | §8 |
| 12 | Impacto SEO/slugs documentado | ✅ | §8 |

---

## 8. `presentationKey` y SEO — las dos opciones, y por qué se elige la segunda

### Opción 1 — agregar `|conc:` a `presentationKey`

`web/src/lib/medicationSlug.ts` deriva el hash del slug de ficha **de la
`presentationKey` completa**. Agregarle un segmento rota el hash de **toda oferta
líquida que declare concentración**: 423 de las 1.806 ofertas de la muestra
(23,4 %). Cada URL `/medicamento/{nombre}-{hash}` ya emitida e indexada dejaría
de resolver por hash vigente.

`web/src/lib/resolveMedication.ts` ya arrastra **seis generaciones** de fallback
(Gen 1 → Gen 5 + Gen 6-bio) por rotaciones anteriores (FASE 1, S-1,
CF-SEARCH-001, BIOEQUIVALENCE-DATA-QUALITY-01). Esta opción exigiría una **Gen 7**
—`presentationKey` sin `|conc:`— más su interacción con las 6 existentes, y una
oleada de redirects 301 sobre URLs indexadas.

### Opción 2 — concentración solo como validación en `canMergeOffers()` ← **elegida**

Es el **precedente directo** del eje de cantidad (`unitCountKey`, fix
`fix/quantity-mismatch-false-merge`), que por esta misma razón se dejó fuera de
la clave y se aplicó solo en la deduplicación.

- `presentationKey`: **0 diferencias** sobre 1.806 ofertas
  (`analysis/pair-split.json`).
- Slugs de Web: **no rotan**. Ninguna URL indexada se rompe, no hace falta Gen 7,
  no hay redirects nuevos, no cambia el sitemap ni los canonical.
- `matchKey`: **0 diferencias** sobre 1.555 nombres únicos → `price_history`,
  `medication_match_key_aliases`, `pharmacy_clicks` y `email_alerts` intactos.

**Recomendación: NO cambiar `presentationKey`.** El beneficio de tener la
concentración en la clave (una tarjeta por concentración ya desde la agrupación,
en vez de partirla después) no compensa romper las URLs indexadas de todo el
catálogo líquido, y el resultado visible para el usuario es el mismo.

### Limitación conocida que esto deja abierta

Dos tarjetas resultantes de una separación comparten `presentationKey`, así que
en Web resuelven al **mismo slug** de ficha. Es exactamente la limitación ya
documentada y aceptada para el eje de cantidad (`productIdentity.ts`, nota sobre
`|form:`) — no una regresión nueva de este fix. Queda registrada como
`FOLLOW_UP` en el informe del PR.
