# CF-DATA-007 — Decisión

## Veredicto

```
MORE_DATA_REQUIRED
```

**No `READY_TO_RETRY_S1`. Nunca `PASS_S1`.**

## 1. Por qué

Los cinco requisitos de `READY_TO_RETRY_S1` se evalúan uno por uno:

| Requisito | Estado | |
|---|---|:--|
| Residual 100 % clasificado | 381/381 en 10 categorías | CUMPLE |
| Cambios seguros | Gates B/C/D en 0; 7/7 tests de estabilidad; 0 identidades perdidas | CUMPLE |
| Gates B/C/D en 0 | 0, 0/260, 0/2.280 | CUMPLE |
| v1 intacto | 0 cambios medidos en v1 | CUMPLE |
| **Evidencia suficiente para superar el gate** | **Gate A = 54,59 %, umbral 99,5 %** | **NO CUMPLE** |

El trabajo es correcto y seguro; lo que falta es **dato**, no calidad de
implementación. Por eso el veredicto es `MORE_DATA_REQUIRED` y no `BLOCKED`.

## 2. El hallazgo que gobierna la decisión

> **El eje de principio activo no puede llevar el Gate A al 99,5 % ni en el mejor
> caso teórico posible.**

De las 411 observaciones sin identidad, solo **142** tienen todos los demás ejes
en condiciones de acuñar. Si se identificara con precisión perfecta la molécula de
todas ellas:

```
Gate A máximo por vocabulario = (428 + 142) / 839 = 67,94 %
Umbral requerido                                  = 99,50 %
Faltarían                                           265 observaciones
```

Las otras **269** del residual están bloqueadas por **concentración o forma
farmacéutica**, no por ingrediente. Eso es otro problema, con otra causa raíz, ya
documentado como defecto conocido en `docs/qa/cf-search-012/S1_FAILURES.md`.

Y dentro de esas 142, **104 son de categoría C**: nombres que no escriben ninguna
molécula (`Actron 400 mg x 10 cápsulas`, `Rigotax 10 mg`, `Zyrtec 10 mg`). No hay
vocabulario que las resuelva — el dato no está en el texto.

**Conclusión:** ampliar el vocabulario hasta 99,5 % exigiría inventar moléculas.
La regla del proyecto lo prohíbe y este ticket la respetó: 2 tokens aprobados con
evidencia, 15 rechazados por clase de riesgo, 8 dejados en revisión por falta de
evidencia.

## 3. Qué se logró

| | |
|---|---|
| Gate A | 51,01 % → **54,59 %** (+30 observaciones) |
| Cobertura farmacológica | 69,01 % → **73,06 %** |
| Residual clasificado | **100 %** en 10 categorías, con matriz de co-bloqueos |
| Tokens nuevos | 2, ambos con evidencia documentada |
| Regresiones | **0** |

Lo más valioso no es el +3,58 pp: es haber **medido el techo**. Antes de este
ticket, la ratificación de S1 asumía que "ampliar `COMPOSITION_VOCABULARY` hasta
superar el 99,5 %" era un camino viable. Ahora está demostrado que no lo es, y
está cuantificado exactamente cuánto falta y de qué tipo.

## 4. Qué haría falta para superar el Gate A

En orden de impacto medido, **ninguno de los tres es trabajo de vocabulario**:

### (a) Tabla marca → molécula — hasta 139 observaciones (categoría C)

El bloqueo más grande. Requiere una fuente externa que diga que `Actron` es
ibuprofeno y `Rigotax` es cetirizina. Candidatos: registro sanitario ISP (hoy **en
revisión**, ADR-0005 / issue #157 — no puede ser autoridad única), o una tabla
curada con revisión humana.

**Decisión de CTO/Product pendiente:** qué fuente se acepta y con qué nivel de
revisión.

### (b) Lector de concentración — hasta 76 observaciones (categoría E)

Masa absoluta en formas no discretas (jarabe, crema, gel). El caso de crema/gel
ya está documentado: el lector toma la primera masa del nombre, que en
`Diclofenaco 1 % Crema 30 g` es el **peso del envase**. Corregirlo cambia conducta
de S0 y necesita su propio ticket.

### (c) Nombres truncados en origen — 39 observaciones (categoría H)

EasyFarma y otras entregan nombres cortados (`Losartan Potsico 50 mg x 30...`).
Es un arreglo de **captura** (scraper), no del motor.

### Lo que NO haría falta

Más vocabulario. La categoría A quedó en 75 observaciones, de las cuales solo 20
acuñarían aunque se resolviera el ingrediente, y ninguna tiene evidencia admisible
hoy.

## 5. Qué NO se hizo, deliberadamente

- **No se redefinió Gate A.** Se usó la definición ratificada, con Pipeline
  Coverage reportada aparte y nunca como sustituto del numerador.
- **No se agregaron moléculas para mejorar el porcentaje.** Los 8 tokens en
  REVIEW habrían sumado 0,95 pp; se dejaron fuera por falta de evidencia.
- **No se usó la fuente ISP** como autoridad (cuestionada en #157).
- **No se tocó v1** — aunque se midió que agregar los 2 tokens a
  `COMPOSITION_VOCABULARY` sería probablemente correcto (35 ofertas ganarían
  `activeIngredient`), es capa de presentación de v1 y otro alcance.
- **No se inició S2.**

## 6. `FOLLOW_UP` para CTO/Product

1. **`COMPOSITION_VOCABULARY` (v1) y los genéricos.** Agregar `omeprazol` y
   `esomeprazol` allí haría que 35 ofertas publicaran su `activeIngredient` en vez
   de `null`, y descartaría marcas estructuradas que en realidad son principios
   activos. `presentationKey` y los slugs **no** se moverían (medido). Requiere
   bump de `CACHE_PREFIX` en `mobile/src/lib/cache.ts`. Es una mejora de
   presentación, no de identidad, y necesita decisión de alcance.

2. **La regla de derivación de CF-DATA-001 tiene un punto ciego con los
   genéricos.** Exigir ≥ 2 cabeceras de marca hace estructuralmente imposible
   descubrir una molécula que se vende con su propio nombre — la clase de producto
   más común en un comparador de precios. Si se va a volver a derivar vocabulario
   por frecuencia, conviene revisar ese criterio (por ejemplo, admitir el token en
   posición de cabecera cuando aparece en ≥ N farmacias distintas).

3. **La fuente para marca→molécula** es la decisión que desbloquea el Gate A. Sin
   ella, ningún ticket de vocabulario puede superar el 67,94 %.
