# CF-DATA-007 — Huecos de parser

**Resultado: 0 arreglos de parser. Categoría B del censo = 0 observaciones.**

## 1. Qué se buscó

El ticket exige distinguir dos causas que se confunden con facilidad:

- una molécula **no está** en el vocabulario → arreglo de **vocabulario**;
- una molécula **sí está** en el vocabulario y el lector **no la lee** → arreglo
  de **parser** (`compositionReader.ts`).

La segunda es la que no se puede tapar agregando tokens, y por eso se midió
aparte.

## 2. Cómo se midió

Sobre las 839 observaciones del corpus congelado, se buscó toda observación donde
una palabra del nombre estuviera en `COMPOSITION_VOCABULARY ∪
V2_MOLECULE_VOCABULARY`, no fuera un calificador químico, y **no** apareciera en
`attributes.activeIngredients`.

```
Observaciones con una molécula conocida NO leída como principio activo: 4
```

## 3. Las 4 son comportamiento correcto, no defectos

| Farmacia | Nombre | Token "no leído" | Por qué está bien |
|---|---|---|---|
| cruz-verde | `Tapsin Puro Sin Cafeina Paracetamol 500 mg 16 Comprimidos` | `cafeina` | El nombre declara la molécula **ausente** |
| ecofarmacias | `Tapsin Puro Sin Cafeina Paracetamol 500 mg x 16 Comprimidos` | `cafeina` | ídem |
| farmex | `Tapsin Puro SIN Cafeina 500 mg x 24 comprimidos` | `cafeina` | ídem |
| ahumada | `Tapsin Puro SIN Cafeina 500 mg x 24 Comprimidos` | `cafeina` | ídem |

Las cuatro son el mecanismo de **negación** (`negatedMolecules()`) funcionando
como debe: *nombrar una molécula no demuestra que esté*. Las cuatro publican
`negatedComponents: ["cafeina"]`, que es evidencia positiva de ausencia.

Descontadas esas, **el hueco real de parser es 0**.

## 4. Conclusión

El lector de composición **no tiene defectos de lectura** sobre este corpus. Todo
lo que no lee es porque:

1. la molécula no está en ningún vocabulario (categoría A del censo), o
2. el nombre no escribe ninguna molécula (categoría C), o
3. el nombre declara la molécula ausente (negación, correcto).

Por eso este ticket **no modifica `compositionReader.ts` más allá de las dos
entradas de vocabulario y su documentación**. No había nada que arreglar en la
lógica, y "arreglar" algo que funciona habría sido riesgo puro.

## 5. Métricas de atribución

Como pide el ticket, la mejora queda separada por causa:

| Métrica | Valor |
|---|---:|
| `fixedByVocabulary` | **30** |
| `fixedByParser` | **0** |
| `fixedByRegistryResolution` | **0** |
| `stillUnresolved` | **381** |

`fixedByRegistryResolution = 0` significa que ninguna observación se resolvió por
subsunción contra un concepto que el cambio hubiera creado: las 30 acuñaron por
mérito propio. Y ninguna observación **perdió** identidad.
