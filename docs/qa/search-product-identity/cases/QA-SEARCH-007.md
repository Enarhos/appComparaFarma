# QA-SEARCH-007 — EasyFarma: 68 % de sus nombres llegan truncados desde la fuente

| Campo | Valor |
|---|---|
| **Severidad** | **P3** — dato incompleto; escala a P2 por su efecto sobre la identidad |
| **Clasificación** | `SOURCE_TRUNCATION` (no `UI_TRUNCATION`) |
| **Test** | 9 (nombres truncados) |
| **Estado** | Preexistente. Indiferente al PR bajo prueba |
| **Reproducibilidad** | Determinista |

## Comportamiento observado

| Farmacia | Ofertas | Nombres truncados | % |
|---|---|---|---|
| **easyfarma** | 245 | **167** | **68,2 %** |
| las otras 8 | 2.382 | 0 | 0 % |

Ejemplos reales (`raw/omeprazol.json`, `raw/clotrimazol.json`, `raw/amoxicilina.json`):

```
"Omeprazol 20 mg x 60..."
"Clotrimazol / Betametasona..."
"Amoxicilina 500 mg 21 Caps...."
"Levocetirizina 5 Mg 30..."
"Betavol 5 + 2 mg/mL x 1..."
"Diclofenaco Sodico 100 Mg 8..."
```

## `SOURCE_TRUNCATION`, no `UI_TRUNCATION`

Verificado en el adaptador: el nombre se toma del texto del `<a>` dentro de
`h3.product-title` del listado de PrestaShop
(`api/src/clients/easyfarma.ts:68-75`):

```ts
const nameM = block.match(
  /class="[^"]*product-title[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>\s*([^<]+?)\s*<\/a>/
);
```

Los puntos suspensivos **están en el HTML de origen** — PrestaShop trunca el título en
la vista de listado. No es CSS de PreciosFarma ni recorte de la tarjeta: el dato entra
truncado al sistema y se propaga a `matchKey`, `presentationKey`, `canonicalName` y al
slug de ficha de Web.

El adaptador ya obtiene el `href` del producto en el mismo match, así que la página de
detalle —donde el título está completo— es alcanzable sin una búsqueda adicional. No
se propone la implementación acá.

## Consecuencias medidas

1. **Marcas inventadas** — es el origen de `brand:15gr` / `brand:20gr` (QA-SEARCH-005):
   con el nombre cortado, el extractor de marca cae sobre la última medida visible.
2. **Cantidad perdida** — `Omeprazol 20 mg x 60…` conserva la cantidad por casualidad;
   `Clotrimazol / Betametasona...` la pierde entera.
3. **Slugs de ficha ilegibles** — `/medicamento/clotrimazol-crema-topica-al-1-x-20-g-...`
   y varios de los enlaces rotos de QA-SEARCH-002 vienen de aquí.

## Evidencia

- `analysis/findings.json` → `findings.truncation` (167 entradas, todas `easyfarma`)
- `analysis/laboratory-matrix.json` → `truncByPharmacy`
- `api/src/clients/easyfarma.ts:58-80`

## Issue recomendado

`CF-SEARCH-005 — EasyFarma: nombre truncado en origen` (P3, escala a P2 por su efecto
en identidad). Nota de riesgo: EasyFarma es uno de los tres scrapers frágiles
identificados en `CLAUDE.md` §11 y en R-009 de `docs/program/RISKS.md`. Cualquier
cambio que agregue un fetch por producto multiplica las peticiones a un sitio ya
frágil, y `docs/operations/` documenta riesgo de timeout en Vercel para el scraping
PHP de Sermecoop — el mismo tipo de exposición. **Es una decisión de arquitectura, no
de QA.**
