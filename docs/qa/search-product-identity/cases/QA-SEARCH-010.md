# QA-SEARCH-010 — Resultados fuera de dominio en consultas ambiguas

| Campo | Valor |
|---|---|
| **Severidad** | **P3** — no afecta la comparación de precio |
| **Clasificación** | `RELEVANCE` |
| **Test** | complementario (fuera de los 12, surgido al estresar formas farmacéuticas) |
| **Estado** | Preexistente. Indiferente al PR bajo prueba |

## Lo que PASÓ (verificado, no asumido)

CF-SEARCH-002 clasifica cada tarjeta con `lexicalMatch` y empuja los `mismatch` al
final. Verificado sobre datos reales:

| Consulta | Tarjetas | `mismatch` | Posición del primer `mismatch` |
|---|---|---|---|
| `omeprazol` | 36 | 11 (Esomeprazol) | 25 de 36 |
| `glicerina` | 100 | 1 (Nitroglicerina) | 99 de 100 |
| `paracetamol` | 138 | 0 | — |
| `cetirizina` | 101 | 20 (Levocetirizina) | — |
| `loratadina` | 68 | 14 (Desloratadina) | — |

Total: 58 de 2.347 tarjetas marcadas `mismatch`, y en las 3 consultas inspeccionadas
en detalle **ninguna aparece antes que un resultado exacto**. El caso QA-02 histórico
("omeprazol" → "Esomeprazol") está efectivamente contenido.

## Lo que sí falla

Con una consulta que no es un principio activo, los productos no-medicamento se
clasifican `compatible` (no `mismatch`) y ocupan las primeras posiciones:

```
/api/search?q=glicerina  — top 3:
  1. "Palmolive jabón en barra humectante Oliva y Aloe Vera 85 g."  [compatible]
  2. "SANY FARM ALCO.GEL70° 60M"                                    [compatible]
  3. "Jabón Glicerina Idem 70g"                                     [exact]
```

El supositorio de glicerina —el medicamento— aparece más abajo. `Nitroglicerina`, que
sí es un fármaco distinto, queda correctamente al final.

## Causa raíz probable

`rankByRelevance()` clasifica `compatible` cuando no hay evidencia fuerte de otro
principio activo. Un jabón no tiene principio activo que contradiga nada, así que
nunca llega a `mismatch`. No hay un eje "esto es un medicamento" en el modelo.

## Evidencia

- `raw/glicerina.json`, `raw/omeprazol.json`, `raw/paracetamol.json`
- Campos `lexicalMatch` / `concentrationMatch` en la respuesta

## Issue recomendado

Ninguno con prioridad propia. Se registra como observación de cobertura: el catálogo
de las 9 farmacias incluye cosmética y aseo, y el modelo de relevancia no distingue
medicamento de no-medicamento. Si alguna vez importa, es producto, no QA.
