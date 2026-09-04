# CF-DATA-007 — Tokens rechazados y en revisión

Todos los tokens de esta página **aparecen junto a una dosis** en el corpus real.
Si el criterio de aprobación fuera la cercanía a una cifra, todos habrían entrado
al vocabulario. Esta lista importa tanto como la de aprobados.

## 1. REJECT — 15 tokens, por clase de riesgo

### Marca o variante comercial (4)

| Token | Nombre real del corpus | Por qué |
|---|---|---|
| `actron` | `Ibuprofeno Actron 200 mg RA (R) 10 Cápsulas Blandas` | Marca de Bayer. Acá va **detrás** de la molécula, así que la regla posicional lo toma como si fuera composición |
| `gesidol` | `Paracetamol Gesidol 1gr x 20 Comprimidos` | Marca escrita después del genérico, mismo patrón |
| `advance` | `Panadol Advance 500mg x 12 Comprimidos` | Variante comercial de Panadol |
| `ellipta` | `Trelegy Ellipta 92 mcg Polvo Para Inhalacion Oral 30 Dosis` | Nombre del dispositivo inhalador, no una molécula |

**Las marcas comerciales nunca entran al vocabulario.** Es regla dura del ticket.

### Sal, ion o calificador químico (4)

| Token | Nombre real | Por qué |
|---|---|---|
| `diclorhidrato` | `Ambroxol Diclorhidrato 30 mg` | Sal. Ya está en `ION_AND_SALT_TOKENS` |
| `epolamina` | `Flector Diclofenaco Epolamina 50 mg 10 Sobres` | Sal de diclofenaco |
| `resinato` | `Merpal Diclofenaco Resinato 15mg/5ml Oral Gotas 20ml` | Forma de resinato de diclofenaco |
| `potsico` | `Losartan Potsico 50 mg x 30...` | Errata de "potásico" (sal) |

**`sodico`, `potasico`, `diclorhidrato` y `clorhidrato` no son un segundo
principio activo.** "Losartán potásico" es *un* principio activo, no dos. Se
atraviesan de forma transparente al buscar la dosis de la molécula anterior.

### Descriptor de forma, envase, vía o fabricación (4)

| Token | Nombre real | Por qué |
|---|---|---|
| `retard` | `Lertus Retard 100 mg x 10 Comprimidos` / `Diclofenaco Retard 100 mg x 8 cápsulas` | Liberación prolongada |
| `efervecente` | `Tapsin Efervecente 1 g x 20 sobres` | Forma farmacéutica (con errata) |
| `oftalmologica` | `Oftic Gotas Diclofenaco Sodico 0,1% Solución Oftalmológica 25ml` | Vía de administración |
| `ninos` | `Panadol Niños 100mg/Ml Gotas 15ml` | Población destino, no molécula |

> **`retard` es el caso que prueba que la fuente (1) no basta.** Pasa la regla de
> CF-DATA-001 —2 cabeceras distintas (`diclofenaco`, `lertus`) en 2 farmacias— y
> aun así se rechaza. La frecuencia es condición **necesaria, nunca suficiente**.

**`comprimido`, `capsula`, `jarabe`, `crema`, `gel`, `sobre` y `frasco` tampoco
son principio activo** — ya los cubre `V2_DESCRIPTOR_TOKENS`, y hay un test que lo
verifica.

### Régimen posológico o indicación (1)

| Token | Nombre real | Por qué |
|---|---|---|
| `triterapia` | `Zomel HP Triterapia 1 g/500 mg/20 mg 14 Blister` | Describe un **régimen** de 3 fármacos, no una molécula. `zomel` es la marca |

### Errata de escritura de la farmacia (2)

| Token | Nombre real | Por qué |
|---|---|---|
| `clauvulancio` | `Synulox (Amoxicilina 200mg-Ácido clauvuláncio 50mg)` | Errata de "clavulánico" |
| `pseudofedrina` | `Ipson-D Ibuprofeno Pseudofedrina Clorhidrato 100 mg...` | Errata de "pseudoefedrina" |

**Las erratas son especialmente peligrosas:** admitirlas crearía una molécula
fantasma que **partiría en dos conceptos distintos el mismo medicamento**, según
cómo lo escribiera cada farmacia. Es el mismo daño que `acido` causaba antes de
CF-SEARCH-011. Lo mismo aplica a `parcetamol`
(`Kitadol Parcetamol Infantil 16 Comprimidos`).

### Otros casos negativos obligatorios verificados

- **`tapsin` y `zomel` no son principio activo** — son marcas; las gestiona
  `readUnresolvedIdentityDiscriminator()`.
- **`acido` no es una molécula independiente** — es calificador químico; se
  atraviesa hasta la molécula que encabeza ("Ácido Clavulánico" → `clavulanico`).
- **`miel`, `limon`, `jengibre`, `frambuesa`, `fresa` y `sabor` no son principio
  activo** — son saborizantes/excipientes. Salvo evidencia específica, que este
  corpus no aporta.
- **"SIN cafeína" sigue significando cafeína AUSENTE** — `Tapsin Puro Sin Cafeina
  Paracetamol 500 mg` lee `ing=paracetamol` y `negatedComponents=[cafeina]`.
- **Laboratorios y etiquetas comerciales** (`opko`, `cenabast`, `curaspring`,
  `maver`, `chile`, `descuento`) nunca entran.

## 2. REVIEW — 8 tokens sin evidencia admitida

Plausiblemente moléculas reales, pero **ninguna de las fuentes admitidas las
sostiene**: una observación, una farmacia, ningún vocabulario del proyecto.

| Token | Nombre real del corpus | Obs. | Farm. |
|---|---|---:|---:|
| `dutasteride` | `Combodart 0,5/0,4 Dutasteride 0,5 mg Tamsulosina 0,4 mg 30 Cápsulas Blandas` | 1 | 1 |
| `tamsulosina` | ídem | 1 | 1 |
| `flurbiprofeno` | `Strepfen Miel y Limon Flurbiprofeno 8,75 mg 8 Pastillas` | 1 | 1 |
| `tibolona` | `Lirex Tibolona 2,5 mg 30 Comprimidos` | 1 | 1 |
| `pamabrom` | `Tapsin Periodo Pamabrom 25 mg 12 Comprimidos` | 1 | 1 |
| `fosfomicina` | `Uroplus Fosfomicina 3 gr Granulos para Solucion Oral 1 Sobre` | 1 | 1 |
| `colecalciferol` | `Bonavid Colecalciferol 300.000 UI Solución Oral para Gotas 2 mL` | 1 | 1 |
| `bromhexina` | `Bromhexina 4 mg/5mL Jarabe 100 mL` | 1 | 1 |

**No se implementan.** `dutasteride` y `tamsulosina` ya estaban rechazadas por
CF-SEARCH-011 con este mismo razonamiento y la decisión **se mantiene** — no se
revisó a la baja.

Aprobarlas porque "suenan a INN" sería sustituir evidencia por criterio de autor,
que es exactamente lo que el proyecto prohíbe. Si una fuente futura las respalda
(por ejemplo un corpus más amplio donde alcancen ≥ 2 cabeceras en ≥ 2 farmacias),
entran por la fuente (1) sin necesidad de aflojar nada. Hasta entonces alimentan
`MORE_DATA_REQUIRED`.

**Impacto de no aprobarlas:** 8 observaciones de 839 = 0,95 % del corpus.
Aprobarlas todas llevaría el Gate A de 54,59 % a lo sumo a 55,54 % — sigue a
44 puntos del umbral. No hay un atajo escondido acá.
