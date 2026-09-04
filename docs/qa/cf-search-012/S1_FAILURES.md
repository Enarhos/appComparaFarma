# CF-SEARCH-012 S1 — Lo que S1 encontró

Incluye lo que S1 **no** resuelve. Evidencia en `analysis/s1-failures.json`.

---

## 1. El falso merge que S1 introdujo, y cómo se detectó

**Severidad: alta. Corregido dentro de S1.**

La primera implementación del resolutor reconstruía la firma candidata como
objeto y dejaba decidir al comparador propio del eje observado
(`compareConcentration`). La firma reconstruida no llevaba la evidencia
estructurada, así que ese comparador la leía como `absent` —"no declara
concentración"— en vez de como "declara otra".

Resultado medido sobre el corpus congelado:

```
Gate C — False Merge Rate ........... 0,4371  (198 / 453 pares)   FAIL
Gate D — Concept Semantic Collision . 0,4907  (993 / 2.024)       FAIL
```

Los 198 pares eran todos de la misma clase:

```
farmex     "Amoxicilina + Ácido Clavulánico 875 mg / 125 mg x 20 comprimidos"
              conc = conc:mass:875mg   → subsumed → CFM-CONCEPT-000008
farmex     "Amoxicilina 500 mg + Acido Clavulánico 125 mg x 20 Comp"
              conc = conc:mass:500mg   → el concepto anfitrión
```

Una potencia de antibiótico declarada igual a otra distinta, con las dos ofertas
en la misma tarjeta comparable y su diferencia de precio presentada como ahorro.
Es exactamente el riesgo clínico que `PRODUCT_IDENTITY.md` §10 prohíbe.

**Corrección:** la resolución pasa a comparar sobre el TEXTO de la firma — lo
único que el registro persiste — con la regla de que dos concentraciones
declaradas y distintas son `incompatible`, aunque una sea masa y la otra razón.
Fundamento completo en `IDENTITY_ASSIGNMENT.md` §3.

**Lo detectó el Gate D**, no un test unitario. Es el argumento para haberlo
construido.

---

## 2. 411 observaciones (49,0 %) no llegan a tener `CFM-CONCEPT-ID`

**Es el hallazgo principal de S1.** No es un bug: es la consecuencia directa y
buscada de la regla de acuñación. Atribución:

| Causa | Observaciones | % del corpus |
|---|---:|---:|
| **Sin principio activo demostrable** | **260** | **31,0 %** |
| Concentración `mass-only` en forma no sólida | 98 | 11,7 % |
| Sin concentración declarada | 90 | 10,7 % |
| Sin forma farmacéutica declarada | 33 | 3,9 % |

(Se solapan.) Desglose de los 336 `unresolved` por combinación de causas:

```
sin-molecula .............................. 141
sin-molecula + sin-concentracion ........... 68
masa-en-forma-no-solida .................... 50
sin-molecula + masa-en-forma-no-solida ..... 26
sin-concentracion .......................... 18
sin-molecula + masa-no-solida + sin-forma ... 16
masa-en-forma-no-solida + sin-forma ......... 6
sin-molecula + sin-forma .................... 5
sin-molecula + sin-conc + sin-forma ......... 4
asociacion-parcial .......................... 1
sin-forma ................................... 1
```

### La causa dominante es el vocabulario de moléculas, no el motor

**260 observaciones (31,0 %) no tienen ninguna molécula demostrable.** S0 ya lo
había medido (36,5 %) y su `DECISION.md` lo puso como recomendación 1:
*"ampliar `COMPOSITION_VOCABULARY` antes que refinar el motor"*.

El caso más elocuente de este corpus: **`omeprazol` no está en el vocabulario**,
y es una de las 16 consultas congeladas. Todas sus ofertas quedan sin identidad:

```
"Omeprazol 20 mg x 30 Comprimidos"
   → ing=?  disc=omeprazol  conc=conc:mass:20mg  form=comprimido  route=oral  unit=comprimido
   → unresolved
```

El motor hace lo correcto —no afirma una molécula que no puede demostrar— y por
eso mismo no puede acuñar. **Cualquier mejora del algoritmo tiene un techo duro
mientras el vocabulario no crezca.**

### 75 observaciones `ambiguous`

Todas por concentración o forma sin declarar:

```
sin-concentracion .......................... 51
sin-concentracion + sin-forma .............. 17
masa-en-forma-no-solida + sin-forma .......... 7
```

Son observaciones compatibles con dos o más identidades del registro. **No se
elige**, y eso es lo correcto: elegir sería adivinar entre dos potencias.

---

## 3. El costo de la regla conservadora de concentración

98 observaciones (11,7 %) quedan sin identidad porque declaran una masa absoluta
en una forma donde la concentración es una razón. El caso testigo:

```
"Ambroxol 30 mg Jarabe 100 ml"      conc = mass-only 30 mg   → unresolved
"Ambroxol 30 mg/5 mL Jarabe 100 ml" conc = ratio 6 mg/mL     → CFM-CONCEPT-…
```

S0 las unía por subsunción, y era el caso emblemático de su modelo. S1 no puede
reproducirlo contra un registro sin hacer que la identidad dependa de **cómo
estaba escrita** la oferta que acuñó el concepto (`IDENTITY_ASSIGNMENT.md` §3).

**Es una regresión respecto de S0 en agrupamiento, y una mejora en corrección.**
La dirección es la conservadora del proyecto: produce splits, nunca merges. Se
declara acá como costo, no como logro.

**Camino de salida, no implementado:** conservar en el registro la evidencia de
concentración estructurada (numerador y denominador) además de la firma
normalizada permitiría reproducir R5 de forma reproducible. Es un cambio de
esquema y de contrato de firma; no corresponde a S1.

---

## 4. Cremas y geles: la concentración leída es el peso del envase

**Defecto heredado de S0, surfaceado por S1, no corregido.**

```
"Diclofenaco 1% Crema 30 g"  → conc = conc:mass:30000mg
```

El "1 %" no se modela; el lector toma la primera masa del nombre, que en estos
nombres es el **peso del tubo**. Acuñar una identidad permanente desde ese dato
fijaría el tamaño del envase como potencia del medicamento.

**Mitigación en S1:** las formas tópicas quedan fuera de
`FORMS_WITH_ABSOLUTE_MASS_CONCENTRATION`, así que **no acuñan**. Prefiere no
tener identidad a tener una falsa.

**No se corrige acá** porque arreglar el lector cambiaría la conducta de S0 y su
firma de concepto, fuera del alcance de este ticket.

> `FOLLOW_UP:` modelar la concentración en porcentaje para formas tópicas en
> `readConcentrationEvidence()`. Sin eso, ninguna crema ni gel podrá tener
> identidad canónica.

---

## 5. Des-resolución: 41 observaciones pierden su concepto al crecer el registro

Una observación parcial que tenía exactamente una anfitriona pasa a tener dos
cuando el registro crece, y el resolutor deja de elegir.

**No es una rotación de ID** (0 rotaciones) y no cambia el significado de ningún
identificador emitido. Es el sistema volviéndose más cuidadoso al aprender.
Converge en 2 pasadas.

**Consecuencia operativa a tener presente cuando el shadow se encienda:** el
enlace `canonical_offer_observations.concept_id` puede pasar a `NULL`. Cualquier
consumidor futuro debe tratar ese campo como nullable y volátil, no como una
asignación definitiva. Está declarado nullable en el esquema por esta razón.

---

## 6. AraucoMed devolvió 0 ofertas en las 16 consultas

**No es un defecto de S1. Es el estado de producción el 2026-09-03.**

La captura del corpus trajo 8 de 9 farmacias. Verificado aparte contra el API de
producción con `ibuprofeno`, `paracetamol` y `losartan`: las tres devuelven
`ahumada, cruz-verde, dr-simi, easyfarma, ecofarmacias, farmex, salcobrand,
sermecoop`. AraucoMed no aparece en ninguna.

Coincide con la señal de alerta que `CLAUDE.md` §11 describe para los scrapers
frágiles —"búsquedas comunes sin resultados de una farmacia puntual"— aunque
AraucoMed no está en la lista de los tres frágiles conocidos. Puede ser también
una desactivación deliberada vía `app_config['disabled_pharmacies']`, que no se
puede distinguir desde el endpoint público.

> `FOLLOW_UP:` verificar por qué AraucoMed no devuelve resultados en producción —
> si está desactivada en `app_config` o si su cliente está fallando en silencio.
> Fuera del alcance de CF-SEARCH-012.

---

## 7. Lo que S1 NO demostró

- **No demostró que v2 sea mejor para el usuario.** Midió identidad, estabilidad
  y seguridad. Relevancia, ranking y satisfacción son S2 en adelante.
- **No demostró que v2 aguante producción.** Las latencias son en memoria, sin
  Postgres, sin red y sin arranque en frío. El shadow nunca se encendió.
- **No resolvió la calidad del dato.** 31 % de las ofertas siguen sin principio
  activo demostrable.
- **No cubrió la identidad regulatoria.** ISP con cobertura 0 %, por diseño:
  #156 es independiente y #157 sigue abierto.
- **No comparó cifra por cifra contra S0.** Corpus distinto (8 farmacias en vez
  de 9) y motor distinto. Forzar la comparación habría sido inventar precisión.
