> [!IMPORTANT]
>
> ## Frozen
>
> La identidad visual queda congelada.
>
> Cualquier modificación futura deberá realizarse mediante RFC aprobado por el comité.
>
> Cierre declarado el 2026-08-06 (sprint `PROJECT-001`) — ver `docs/archive/project/PROJECT_PHASES_2026-08-06.md`. Incluye, sin limitarse a: `DESIGN_TOKENS.md`, `COMPONENT_LIBRARY.md`, `PATTERNS.md`, `SCREEN_TEMPLATES.md` y los Signature Components definidos en `docs/design/product/SIGNATURE_COMPONENTS.md`.
>
> No crear nuevos Design Tokens, familias de componentes ni patrones fuera de RFC. Trabajo permitido: implementación real de esta arquitectura y su consumo por nuevas experiencias de producto (`docs/product/experiences/`).

# docs/design-system/ — Dominio del Design System de ComparaFarma

Este documento es el punto de entrada al dominio `docs/design-system/`. No redefine la marca. No propone Design Tokens, componentes ni patrones concretos. Su función es explicar qué vive en este dominio, por qué existe, y cómo se relaciona con `docs/brand/`, `docs/product/` e Ingeniería.

Sigue obligatoriamente la estructura de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | DSY-RDM-001 |
| **Nombre** | README.md (dominio `docs/design-system/`) |
| **Dominio** | Design System (`docs/design-system/`) |
| **Estado** | Activo |
| **Versión** | 1.0 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Documentation Architect / Design Governance Architect |
| **Nivel de Gobierno** | Chárter de Dominio — mismo nivel introducido en `docs/design/README.md` §1 y ya aplicado en `docs/design/brand/README.md` |
| **Clasificación** | Documento de Gobierno Documental |
| **Fuente Oficial** | Este mismo documento |
| **Documentos de los que depende** | `docs/design/system/DESIGN_SYSTEM.md`, `SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md`, `DESIGN_SYSTEM_DECISION_LOG.md`, `docs/design/brand/BRAND_GUIDELINES.md`, `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | `docs/design/system/DESIGN_SYSTEM.md`, `SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md`, `DESIGN_SYSTEM_DECISION_LOG.md`, y todo documento futuro que se cree dentro de `docs/design-system/` |
| **Pregunta que responde** | ¿Qué documenta `docs/design-system/`, y qué no le corresponde documentar? |

---

## 2. Propósito

`docs/design/brand/BRAND_GUIDELINES.md` y los cuatro sistemas de identidad que integra (`LOGO_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md`, `COLOR_SYSTEM.md`) definen **quién es** ComparaFarma y **cómo deben convivir** los sistemas que expresan esa identidad. Ninguno de esos documentos gobierna, sin embargo, **cómo esa identidad se convierte en la arquitectura de un producto real**, multiplataforma, que debe construirse de forma consistente, escalable y mantenible.

`docs/design-system/` existe para llenar exactamente ese vacío, ya anticipado de forma explícita y reciproca en `docs/design/brand/BRAND_GUIDELINES.md` §4.5: *"BRAND_GUIDELINES.md gobierna la identidad. El futuro Design System gobernará la implementación del producto."* Su propósito no es redefinir la marca — eso ya está resuelto y consolidado en `docs/brand/` — sino **traducirla, de forma arquitectónica y trazable, a la base sobre la que se construye el producto**: sus Foundations, y en el futuro, sus Design Tokens, Componentes y Patrones.

---

## 3. Alcance

**Este documento define:**

- El propósito del dominio `docs/design-system/` (§2).
- Qué documentos pertenecen a este dominio y en qué orden deben leerse (§4.1).
- La relación de gobierno con `docs/brand/`, `docs/product/` e Ingeniería (§4.2, §4.3, §4.4).
- Los principios de gobierno que rigen este dominio (§4.5).

**Este documento NO define:**

- Identidad de marca, principios de percepción, ni los cuatro sistemas de identidad. Corresponde íntegramente a `docs/brand/`.
- Ninguna arquitectura de capas, Foundation, Token, Componente o Patrón concreto. Corresponde a los documentos que este índice referencia, no a este documento.
- Backlog, roadmap o KPIs de producto. Corresponde exclusivamente a `docs/product/`.
- Documentación de arquitectura técnica de software, ADRs o RFCs de implementación. Corresponde a `docs/architecture/`, `docs/adr/` y `docs/engineering/`.

---

## 4. Contenido principal

### 4.1 Documentos de `docs/design-system/` y orden recomendado de lectura

1. **`DESIGN_SYSTEM.md`** (v1.0, Draft) — la arquitectura completa de capas del Design System (Foundations → Design Tokens → Componentes → Patrones → Plantillas → Pantallas → Aplicaciones), sus principios, y la frontera explícita con `BRAND_GUIDELINES.md` y con un futuro Design System de producto. Es el punto de partida de todo lo demás en este dominio.
2. **`SPACING_SYSTEM.md`** (v1.0, Draft) — la Foundation de espaciado: capas conceptuales (Micro, Component, Section, Layout, Page spacing) y ritmo espacial.
3. **`GRID_SYSTEM.md`** (v1.0, Draft) — la Foundation de estructura espacial: capas conceptuales (Estructura primaria, Regiones funcionales, Zonas de contenido, Alineación, Continuidad).
4. **`ELEVATION_SYSTEM.md`** (v1.0, Draft) — la Foundation de jerarquía perceptual: capas conceptuales de prioridad (Información base, contextual, prioritaria, crítica, Interrupciones excepcionales). Cierra el conjunto completo de Foundations que `DESIGN_SYSTEM.md` había señalado como pendientes.
5. **`DESIGN_SYSTEM_DECISION_LOG.md`** (v1.0, Activo) — el registro oficial de decisiones de arquitectura de este dominio, abierto en el Sprint DG.001 — Design System Governance.

Cada documento de Foundation depende de `DESIGN_SYSTEM.md` (que define la arquitectura de capas dentro de la cual cada Foundation se inserta) y se relaciona con los otros dos sin duplicarlos: Grid organiza dónde, Spacing organiza cuánta distancia, Elevación organiza qué requiere atención primero.

### 4.2 Relación con Brand

**`docs/brand/` define. `docs/design-system/` implementa.** Esta frontera ya está declarada de forma explícita y reciproca en `docs/design/brand/BRAND_GUIDELINES.md` §4.5. `docs/design-system/` depende, en cadena, de toda la Arquitectura de Marca — en particular, de los cuatro sistemas de identidad, que este dominio trata como sus Foundations de tipografía, color e iconografía (`docs/design/system/DESIGN_SYSTEM.md` §4.3 remite directamente a `TYPOGRAPHY_SYSTEM.md`, `COLOR_SYSTEM.md` e `ICONOGRAPHY_SYSTEM.md` para esas tres Foundations, sin duplicarlas).

Ningún documento de `docs/design-system/` tiene autoridad para modificar `docs/brand/`. Cuando exista una discrepancia entre lo que se gobierna aquí y lo ya consolidado en `docs/brand/`, prevalece `docs/brand/`.

### 4.3 Relación con Product

`docs/product/` define qué hace el producto, a quién sirve, y qué prioriza su backlog (`PRODUCT_DEFINITION_v1.0.md`, `PRODUCT_PRINCIPLES.md`, `ROADMAP.md`, entre otros). `docs/design-system/` no gobierna ninguna de esas decisiones — las consume como contexto cuando corresponde (por ejemplo, `TYPOGRAPHY_SYSTEM.md` §4.1 cita `PRODUCT_PRINCIPLES.md` como fuente de los principios de Escalabilidad y Mantenibilidad).

Este dominio tampoco gobierna backlog, features ni KPIs de producto — esa responsabilidad sigue siendo exclusiva de `docs/product/`, incluso cuando una decisión de arquitectura del Design System tenga impacto sobre el trabajo de producto.

### 4.4 Relación con Engineering

`docs/design-system/` no habla de tecnología — cada uno de sus cuatro documentos de Foundation lo declara explícitamente como restricción de alcance. Es, en cambio, la autoridad de arquitectura conceptual que Ingeniería (`mobile/`, `web/`, `api/`) debe consumir al construir Design Tokens, Componentes y Patrones reales. `docs/design/system/DESIGN_SYSTEM.md` §5.2 ya desarrolla, en detalle, cómo debe convivir este dominio con Frontend Web, Frontend Mobile, Backend, QA y Documentación — este README no repite ese contenido, solo lo referencia como parte de la relación con Ingeniería.

### 4.5 Principios de gobierno del dominio

1. **Brand define. Design System implementa.** `docs/brand/` es la única fuente de verdad sobre identidad; `docs/design-system/` no la reinterpreta, la traduce en arquitectura de producto (§4.2).
2. **Ninguna Foundation puede tomar una decisión que corresponde a otra.** Grid organiza estructura, Spacing organiza distancia, Elevación organiza prioridad — cada una respeta la frontera de las demás, mismo principio de herencia arquitectónica ya declarado en cada uno de los cuatro documentos de Foundation.
3. **Ninguna decisión de arquitectura de producto es oficial sin registrarse en `DESIGN_SYSTEM_DECISION_LOG.md`.** Mismo principio ya aplicado en `docs/design/README.md` §4.3 (principio 2) para decisiones de identidad de marca, extendido aquí a decisiones de arquitectura de producto.
4. **Toda decisión debe ser trazable a su fuente conceptual.** Ninguna fila de `DESIGN_SYSTEM_DECISION_LOG.md` puede aprobarse sin citar el documento de Foundation, de `docs/brand/` o de `docs/product/` que la justifica — misma regla ya declarada en `docs/design/README.md` §4.3 (principio 4).
5. **Este dominio no tiene autoridad de gobierno de marca ni de producto.** Cuando exista una discrepancia entre lo que aquí se gobierna y lo ya consolidado en `docs/brand/` o `docs/product/`, prevalecen esos dominios — mismo principio de gobierno ya declarado en `docs/enterprise/README.md`: *"Cuando exista una discrepancia entre modelos, deberá revisarse la documentación correspondiente para mantener una única fuente de verdad."*

---

## 5. Relaciones

```
docs/design/brand/BRAND_GUIDELINES.md
   (integra LOGO_SYSTEM, TYPOGRAPHY_SYSTEM,
    ICONOGRAPHY_SYSTEM, COLOR_SYSTEM)
              ↓
docs/design-system/          ← este dominio
   DESIGN_SYSTEM.md (arquitectura de capas)
              ↓
   ┌──────────────┬──────────────┬──────────────┐
   ↓              ↓              ↓
SPACING_SYSTEM  GRID_SYSTEM  ELEVATION_SYSTEM
   └──────────────┴──────────────┴──────────────┘
              ↓
DESIGN_SYSTEM_DECISION_LOG.md
   (registro de decisiones de este dominio)
              ↓
futuros Design Tokens, Componentes, Patrones,
catálogo de componentes vivo (Storybook u otra herramienta)
```

La relación de fondo, en una frase: **`docs/brand/` define la identidad. `docs/design-system/` gobierna la arquitectura del producto que la implementa. Ninguno de los documentos de este dominio tiene autoridad para modificar `docs/brand/` ni `docs/product/`; la dirección de dependencia es estrictamente hacia esos dos dominios, nunca al revés.**

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Frontera entre identidad y producto | `docs/design/brand/BRAND_GUIDELINES.md` §4.5 | ✔ (§2, §4.2) | Este dominio es el Design System anticipado por esa frontera |
| Arquitectura de capas del Design System | `docs/design/system/DESIGN_SYSTEM.md` | ✔ — referenciada como punto de partida (§4.1) | No se duplica su contenido |
| Foundations de espaciado, grid y elevación | `SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md` | ✔ — referenciadas (§4.1) | Conjunto completo de Foundations ya gobernadas |
| Registro de decisiones del dominio | `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` | ✔ — referenciado (§4.1, §4.5) | Abierto en el Sprint DG.001 |
| Relación con Ingeniería | `docs/design/system/DESIGN_SYSTEM.md` §5.2 | Referenciada, no duplicada (§4.4) | El detalle completo vive en ese documento |
| Existencia y ubicación del dominio `docs/design-system/` | — (vacío antes de este documento) | ✔ | No existía previamente ningún README en esta carpeta |
| Reconocimiento formal del dominio en la plantilla de gobierno | `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` v1.1 | ✔ — consistente con la actualización realizada en el mismo Sprint DG.001 | — |

---

## 7. Gobierno

`docs/design/system/README.md` **no reemplaza** ni tiene autoridad para modificar:

- `docs/design/brand/BRAND_GUIDELINES.md` y los cuatro sistemas de identidad que integra.
- `docs/design/system/DESIGN_SYSTEM.md`, `SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md` — este documento no redefine su arquitectura; es un índice y un mapa de relaciones.

Este documento es, en cambio, gobernado por `docs/design/brand/BRAND_GUIDELINES.md` (frontera de identidad/producto, §4.2) y por `docs/design/system/DESIGN_SYSTEM.md` (arquitectura de capas dentro de la cual se organiza todo el dominio). A su vez, funciona como chárter del dominio para los documentos que lista en "Documentos que gobierna" (§1): ningún documento nuevo debería crearse dentro de `docs/design-system/` sin ser coherente con los principios de gobierno declarados en §4.5.

Cuando exista una discrepancia entre cualquier documento de `docs/design-system/` y su fuente en `docs/brand/` o `docs/product/`, prevalecen esos dominios — mismo principio ya declarado en `docs/enterprise/README.md`.

---

## 8. Documentos relacionados

- `docs/design/system/DESIGN_SYSTEM.md`
- `docs/design/system/SPACING_SYSTEM.md`
- `docs/design/system/GRID_SYSTEM.md`
- `docs/design/system/ELEVATION_SYSTEM.md`
- `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md`
- `docs/design/brand/BRAND_GUIDELINES.md`
- `docs/design/README.md`
- `docs/design/brand/README.md`
- `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Creación inicial de este índice, como parte del Sprint DG.001 — Design System Governance (no existía previamente ningún README en `docs/design-system/`, confirmado por inspección directa). Documenta el orden de lectura de los cinco documentos del dominio, la relación con Brand, Product e Ingeniería, y los cinco principios de gobierno del dominio. | `docs/design/system/DESIGN_SYSTEM.md` v1.0; `SPACING_SYSTEM.md` v1.0; `GRID_SYSTEM.md` v1.0; `ELEVATION_SYSTEM.md` v1.0; `DESIGN_SYSTEM_DECISION_LOG.md` v1.0; `docs/design/brand/BRAND_GUIDELINES.md` v1.0; `docs/design/README.md` v1.0; `docs/design/brand/README.md` v1.0 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Creación del dominio `docs/design-system/` y definición de la arquitectura oficial del Design System | Design Systems Architect / Product Design Director / Enterprise Documentation Architect | `docs/design/system/DESIGN_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de las especificaciones de espaciado, grid y elevación | Design Systems Architect / Spatial Systems Director, Information Architecture Director e Interaction Design Director / Enterprise Documentation Architect | `docs/design/system/SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md` v1.0 |
| 2026-08-05 | Apertura del Sprint DG.001 — Design System Governance: registro de decisiones, reconocimiento formal del dominio y creación de este índice | Enterprise Documentation Architect / Design Governance Architect | `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` v1.0; `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` v1.1; `docs/design/system/README.md` v1.0 (este documento) |

**Pendiente de definición:** ninguna de las acciones anteriores cuenta todavía con una aprobación formal registrada del CEO/fundador.
