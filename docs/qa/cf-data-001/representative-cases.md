# CF-DATA-001 — Casos representativos (datos reales)

Todos los nombres y valores son literales de las capturas del 2026-08-31
(29 búsquedas, 9 farmacias, 3.697 ofertas). "Antes" es lo que
`CommercialProductRow` rotulaba como **Marca** en `origin/main` (57cbd5d),
que era el campo único `laboratory`.

## 1. Fabricante publicado como "Marca" — CORREGIDO (57 tarjetas)

Es el defecto que el reporte de QA describe con Muxol y Broncot.

| Nombre real | Farmacia | Antes ("Marca") | Ahora: Marca | Ahora: Laboratorio |
|---|---|---|---|---|
| Muxol Jarabe adulto Ambroxol 30 mg / 5 mL x 100 mL | farmex | EUROLAB | **Muxol** | Eurolab |
| Tocalm ambroxol 15 mg/5 mL jarabe pediátrico 100 mL | dr-simi | PRATER | **Tocalm** | Prater |
| Tapsin paracetamol 500 mg 24 comprimidos | dr-simi | MAVER | **Tapsin** | Maver |
| Dropol paracetamol 1 g 20 comprimidos | dr-simi | PASTEUR | **Dropol** | Pasteur |
| Panadol para niños paracetamol 80 mg 20 comprimidos masticables | dr-simi | HALEON | **Panadol** | Haleon |
| Desdol paracetamol 300 mg clorzoxazona 250 mg 20 comprimidos rec. | dr-simi | EUROFARMA | **Desdol** | Eurofarma |
| Tral P paracetamol 325 mg tramadol 37,5 mg 30 comprimidos rec. | dr-simi | PASTEUR | **Tral** | Pasteur |

## 2. "Marca no identificada" con la marca a la vista — CORREGIDO (144 tarjetas)

Farmacias sin ningún campo estructurado (Cruz Verde, Ahumada, EcoFarmacias,
EasyFarma, Sermecoop). La marca estaba escrita en el nombre y no se leía.

| Nombre real | Farmacia | Antes | Ahora: Marca | Fuente |
|---|---|---|---|---|
| Tocalm Adulto Ambroxol 30 mg/5mL Jarabe 100 mL | cruz-verde | Marca no identificada | **Tocalm** | name |
| Muxol Ambroxol 30 mg 20 Comprimidos | cruz-verde | Marca no identificada | **Muxol** | name |
| Mintamox Pediatrico Ambroxol 15 mg/5mL Jarabe 100 mL | cruz-verde | Marca no identificada | **Mintamox** | name |
| Broncot Ambroxol 7,5 mg/mL Gotas 30 mL | cruz-verde | Marca no identificada | **Broncot** | name |
| MUXOL JARABE ADULTO Ambroxol Clorhidrato 600 mg 100 ml | ahumada | Marca no identificada | **MUXOL** | name |
| Muxol (ambroxol) 15mg/5ml Jarabe 100ml | sermecoop | Marca no identificada | **Muxol** | name |
| Pazbronq Ambroxol Clorhidrato 30 mg/5 mL Jarabe 100 mL | — | Marca no identificada | **Pazbronq** | name |

## 3. Genérico que mostraba su laboratorio como "Marca" — CORREGIDO (227 tarjetas)

No es una pérdida de información: el laboratorio se sigue mostrando, ahora con
su etiqueta correcta. Lo que desaparece es la afirmación falsa de que "Ascend"
o "Mintlab" sean la marca de un genérico que no tiene marca.

| Nombre real | Antes ("Marca") | Ahora: Marca | Ahora: Laboratorio |
|---|---|---|---|
| Ambroxol 15mg/5ml jarabe infantil x 100 ml. (Ascend) | Ascend | Marca no identificada | Ascend |
| Ambroxol 30mg/5ml Jarabe Adulto 100ml (Opko) | Opko | Marca no identificada | Opko |
| Ambroxol 30mg/5ml Jarabe Adulto x 100 ml. (Hospifarma) | Hospifarma | Marca no identificada | Hospifarma |
| Ambroxol 30mg/5ml Jarabe Adulto 100ml (Seven Pharma) | Seven Pharma | Marca no identificada | Seven Pharma |

## 4. Principio activo publicado como marca por la propia farmacia — CORREGIDO

Salcobrand entrega `hit.brand` con la molécula en sus genéricos. Aceptarlo
habría sido exactamente lo que el ticket prohíbe.

| Nombre real | `hit.brand` de Salcobrand | Marca publicada |
|---|---|---|
| Ambroxol 30mg/5ml Jarabe 100ml | `Ambroxol` | *(null)* |
| Diclofenaco Sódico 50 mg 20 Comprimidos | `diclofenaco` | *(null)* |
| Muxol Adulto Ambroxol Jarabe 100ml | `Muxol` | **Muxol** |
| Muxol Pediátrico Ambroxol Jarabe 100ml | `Muxol Pediatrico` | **Muxol Pediatrico** |

## 5. Corrupción de datos detectada de paso

Salcobrand emite `hit.brand` con SOFT HYPHEN (U+00AD) incrustado: `Tapsi­n`
(3 ofertas de la muestra). Se limpia para presentación. No afecta
`presentationKey` — `normalizeBrandToken()` ya descartaba todo lo que no fuera
`[a-z0-9]`.

## 6. Casos que siguen SIN marca — falsos negativos aceptados

La política es preferir el hueco antes que el dato inventado.

| Nombre real | Farmacia | Por qué |
|---|---|---|
| Amrodil 30 Mg/5ml 100 Ml | easyfarma | El nombre nunca nombra la molécula: no se puede demostrar que no sea un genérico de nombre inusual. |
| Broncot Forte G.T.F. Jarabe 30 mg / 5 mL x 120 mL | farmex | Ídem. Sí se corrige lo principal: ABBOTT deja de figurar como "Marca" y pasa a "Laboratorio". |
| Tocalm Adulto 30 mg/5 mL x 100 mL Jarabe | ahumada | Ídem. La MISMA marca sí se recupera en las farmacias que sí escriben "Ambroxol". |
| Ibuprofeno Actron 200 mg RA (R) 10 Cápsulas Blandas | salcobrand | Orden invertido (molécula primero, marca después): no hay forma general de decidir cuál token es la marca sin arriesgar publicar "Ibuprofeno" como marca. |

## 7. Falsos positivos que la versión sin guardias producía — ELIMINADOS

Medición de la variante SIN las dos guardias (`brandFromName` sin vocabulario):
40,0 % de cobertura pero **5,7 % de marcas que eran el principio activo**.

`diclofenaco` (24), `paracetamol` (8), `cetirizina` (8), `tramadol` (7),
`ibuprofeno` (7), `levocetirizina` (6), `losartan`, `amoxicilina`, `ipratropio`,
`sales`. Con las guardias: **0 observados**, a cambio de bajar la cobertura a
31,6 %.
