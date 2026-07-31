# Sprint Web 2 — UX, Visualización e Inteligencia de Precios

Repositorio:
ComparaFarma

Objetivo:

No agregar nuevas funcionalidades grandes.
El objetivo de este Sprint es transformar la experiencia de usuario de la ficha del medicamento para que parezca un producto terminado.

No modificar mobile/.
No modificar packages/domain/.
Mantener compatibilidad completa con la API existente.

--------------------------------------------------------
1. Gráfico principal
--------------------------------------------------------

El gráfico debe transformarse en el elemento principal de la página.

Actualmente ocupa poco espacio.

Cambios:

- aumentar considerablemente su altura
- hacerlo responsive
- mayor separación visual
- mejorar tipografía
- mejorar espaciados

Debe sentirse como el centro de la página.

--------------------------------------------------------
2. Colores consistentes por farmacia
--------------------------------------------------------

Cada farmacia debe tener un color fijo en toda la plataforma.

Ejemplo:

Ahumada
Salcobrand
Cruz Verde
AraucoMed
Farmex
EcoFarmacias
EasyFarm

Definir una paleta consistente y reutilizable.

La leyenda debe utilizar exactamente esos colores.

--------------------------------------------------------
3. Línea de referencia
--------------------------------------------------------

Agregar una línea horizontal punteada mostrando uno de estos valores:

- mejor precio histórico

o

- precio promedio

(seleccionar la alternativa técnicamente más útil)

Debe verse claramente en el gráfico.

--------------------------------------------------------
4. Mejorar tarjetas de farmacias
--------------------------------------------------------

Las tarjetas actuales son muy básicas.

Rediseñarlas.

Agregar:

✔ nombre

✔ precio

✔ indicador "Mejor precio" cuando corresponda

✔ botón claro:

Ir a la farmacia →

Mantener accesibilidad.

--------------------------------------------------------
5. Reorganizar cabecera
--------------------------------------------------------

Reducir el espacio vertical.

Mostrar:

imagen

nombre

precio destacado

ahorro respecto al más caro

última actualización

Todo mucho más compacto.

--------------------------------------------------------
6. Insights automáticos
--------------------------------------------------------

Crear una nueva sección:

"Insights"

Generar automáticamente frases como:

• El precio bajó 35% durante la última semana.

• AraucoMed posee actualmente el menor precio.

• La diferencia entre la farmacia más barata y la más cara es de $10.809.

• Salcobrand mantiene el precio más alto.

• Este medicamento presenta alta dispersión de precios.

Las frases deben depender de los datos disponibles.

Si no existe suficiente historial, ocultar las frases que no puedan calcularse.

--------------------------------------------------------
7. Responsive
--------------------------------------------------------

Revisar especialmente:

Desktop

Tablet

Mobile Web

El gráfico debe seguir siendo legible.

--------------------------------------------------------
8. SEO
--------------------------------------------------------

Mejorar:

OpenGraph

Twitter Cards

Structured Data (Schema.org)

para la ficha del medicamento.

No modificar URLs.

--------------------------------------------------------
9. Performance
--------------------------------------------------------

No incorporar librerías pesadas.

Mantener SVG.

No agregar Chart.js.

No agregar Recharts.

No agregar D3.

--------------------------------------------------------
10. Calidad
--------------------------------------------------------

Actualizar pruebas.

Actualizar snapshots.

Mantener cobertura.

Typecheck limpio.

Build limpio.

--------------------------------------------------------
11. Restricciones
--------------------------------------------------------

No modificar mobile/

No modificar packages/domain/

No cambiar contratos de API

No romper PR anteriores

Todo debe ser aditivo.

--------------------------------------------------------
12. Entrega
--------------------------------------------------------

Trabajar en un worktree nuevo.

No hacer push directamente a main.

Crear rama:

web/ui-improvements

Al finalizar entregar:

- resumen técnico
- decisiones tomadas
- screenshots
- resultados de tests
- diff
- PR listo para revisión.