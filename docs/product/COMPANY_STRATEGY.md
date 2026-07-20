# ComparaFarma — De app a empresa

**Fecha:** 2026-07-19
**Autor:** Claude Code (CTO)
**Estado:** Propuesta para discusión — no ejecutado

---

## 1. El hallazgo que cambia la prioridad de todo lo demás

**Hoy ComparaFarma no tiene base de datos propia.** Todo el sistema es stateless: el caché de búsqueda vive 5 minutos en Redis, y el historial de precios, favoritos y alertas de cada usuario viven solo en el AsyncStorage de su teléfono. Si un usuario cambia de celular, pierde todo. Si mañana querés saber "¿cuánto costaba el paracetamol hace 3 meses en Cruz Verde?", no hay forma de responder esa pregunta — nadie la guardó en ningún lado.

Esto no es un detalle técnico menor. Es la diferencia entre tener una app y tener una empresa:

- **Sin base de datos no hay moat.** El valor de un comparador de precios en el día 1 es igual al de cualquier competidor que scrapee las mismas 9 farmacias. El valor que se vuelve difícil de copiar es la **serie histórica** — meses o años de precios acumulados, tendencias, estacionalidad. Eso solo existe si alguien lo guarda desde ahora.
- **Sin base de datos no hay negocio B2B.** Aseguradoras, laboratorios y clínicas (ya identificados como audiencia secundaria en `VISION.md`) no pagarían por "ver los mismos precios que ve un usuario en la app" — pagarían por **datos agregados y históricos** vía una API. Ese producto no existe sin dónde guardar los datos.
- **Sin base de datos no hay cuentas de usuario reales.** "Favoritos sincronizados entre dispositivos" y "alertas push" (ya en el backlog v2.0) dependen de tener un usuario identificable en un servidor, no solo en un `AsyncStorage` local.

**Recomendación:** cualquier plan de "hacer empresa" debería tratar la introducción de una base de datos como la dependencia técnica de la que cuelga casi todo lo demás, no como un ítem más del backlog.

---

## 2. Estado actual — inventario honesto

| Dimensión | Qué existe | Qué falta para ser empresa |
|---|---|---|
| Producto | App Android en producción, 9 farmacias, búsqueda/comparación/favoritos/alertas/carrito | Sin iOS, sin web, sin ningún canal fuera de Play Store |
| Datos | Caché efímero (5 min) + AsyncStorage local por usuario | Sin historial server-side, sin analítica de negocio propia (solo PostHog de producto) |
| Monetización | Banner de donación voluntaria (Khipu) | Sin modelo de ingresos real — la donación es simbólica, no un negocio |
| Usuarios | Anónimos, sin cuenta | Sin identidad de usuario, sin retención medible más allá de analytics de producto |
| Operación | Monitoreo activo (healthcheck horario + Sentry + alertas por email, reforzado esta sesión), CI/CD estable, documentación de ingeniería madura (RFC/ADR/postmortems) | Sin panel admin — todo se opera vía variables de entorno en Vercel y `git push` |
| Legal/societario | — | Sin entidad legal constituida, sin términos de servicio revisados legalmente, Data Safety de Play Console pendiente (ya señalado en `RELEASE_READINESS_V1.md`) |
| Equipo | Un desarrollador (con asistencia de IA) | Bus factor de 1 — sin documentación no sería viable escalar el equipo, aunque la disciplina de RFC/ADR ya construida ayuda bastante acá |

---

## 3. Modelos de negocio — opciones evaluadas

| Opción | Mecanismo | Complejidad | Riesgo a la neutralidad |
|---|---|---|---|
| **Afiliación / comisión por click** | Cobrar a cada farmacia una comisión cuando un usuario hace click en "Ver en farmacia" y compra | Baja — el link ya existe, falta tracking + acuerdos comerciales | Bajo, si la comisión es igual para las 9 farmacias (no altera el ranking) |
| **API B2B de datos** | Aseguradoras/laboratorios/clínicas pagan por acceso a precios históricos agregados vía API | Alta — requiere la base de datos del punto 1, más un producto/documentación de API | Ninguno — es un producto distinto, no toca la app de consumidor |
| **Funciones premium** | Alertas push, sincronización multi-dispositivo, cuenta familiar | Media — requiere cuentas de usuario (depende de la DB) | Ninguno |
| **Posicionamiento pagado / destacados** | Una farmacia paga por aparecer destacada | Baja técnicamente | **Alto** — choca directo con `PRODUCT_PRINCIPLES.md` (neutralidad es un valor de marca explícito); solo viable con etiquetado "Patrocinado" muy claro y sin alterar el orden por precio real |
| **Partnership institucional** | Convenio con MINSAL u otro organismo público (ya es fuente de datos de sucursales) | Alta, depende de terceros | Ninguno, pero fuera del control técnico directo |

**Recomendación:** empezar por **afiliación** (rápido de instrumentar, no compromete neutralidad) mientras se construye la base de datos que habilita la **API B2B** — esta última es la de mayor valor a largo plazo, pero no existe sin el punto 1.

---

## 4. Evolución de la arquitectura técnica

```
Hoy                                    Propuesto
─────────────────────────             ─────────────────────────
mobile/ (Expo, Android)                mobile/ (Expo, Android + iOS eventual)
  ↕ EXPO_PUBLIC_API_URL                  ↕
api/ (Vercel, stateless)               api/ (Vercel)
  ↕ Redis (caché 5 min)                  ↕ Redis (caché) + Postgres (Supabase)
packages/domain (compartido)             ├─ historial de precios (server-side, todos los usuarios)
                                          ├─ cuentas de usuario (Supabase Auth)
                                          └─ uso de API B2B (para facturación)
                                        web/ (Next.js, nuevo) — SEO, panel admin, docs de API B2B
                                        packages/domain (sin cambios — ya es agnóstico de framework)
```

**Por qué Supabase específicamente:** Postgres administrado, tiene autenticación incluida (resuelve cuentas de usuario y la DB en la misma pieza), tier gratuito generoso para arrancar, y encaja bien con el patrón serverless que ya usa Vercel — no exige levantar infraestructura propia.

**Ingesta de historial sin tocar el flujo de búsqueda:** cada vez que `searchService` ya calcula un `MedicationResult`, se puede escribir una fila (`matchKey`, farmacia, precio, fecha) en Postgres de forma asíncrona ("fire and forget"), sin bloquear ni enlentecer la respuesta al usuario. Esto empieza a acumular la serie histórica desde el día 1, para **todos** los usuarios, no solo para quien abrió esa pantalla en su teléfono.

### Un solo panel administra los dos proyectos, por diseño

`mobile/` y `web/` van a consumir el **mismo** `api/` — ninguno tiene backend propio. Eso significa que **no hace falta construir dos sistemas de administración**: cualquier configuración que viva en la base de datos (farmacias activas, banner de donación, feature flags) se lee desde el mismo lugar sin importar si el cliente es la app o el sitio. Esto ya es así hoy, aunque de forma rudimentaria — hoy la "consola" son variables de entorno en Vercel (`DISABLED_PHARMACIES`, `DONATION_BANNER_ENABLED`), leídas por el mismo `/api/config` que ambos clientes consultarían.

El panel admin de la Fase 3 no es un tercer proyecto: vive como una sección autenticada (`/admin`) **dentro del mismo `web/`** que ya se construye para SEO, separada de las páginas públicas por rol de acceso (Supabase Auth + chequeo de rol), no por infraestructura aparte. Lo que administraría, todo compartido entre mobile y web:

- Farmacias activas/inactivas y configuración del banner de donación (ya existe, hoy vía env vars — pasa a vivir en la DB con UI en vez de redeploy).
- Tracking de clicks/afiliación por farmacia (Fase 1).
- Feedback de usuarios (hoy solo llega por email vía Resend, sin ningún lugar donde revisarlo).
- Llaves de API B2B — alta, revocación y consumo por cliente (Fase 3).
- Estado de salud de los scrapers y del deploy (extiende el trabajo de monitoreo ya hecho esta sesión).

---

## 5. Roadmap propuesto (secuenciado por dependencia real)

| Fase | Foco | Depende de |
|---|---|---|
| **1** | Base de datos (Supabase) + ingesta de historial de precios server-side + tracking de clicks a farmacia (base para afiliación) | Nada — es el punto de partida |
| **2** | Web con SEO (Next.js) + cuentas de usuario (favoritos/alertas sincronizados) | Fase 1 (DB + Auth) |
| **3** | Productizar la API B2B + panel admin interno en `/admin` dentro de `web/` — administra mobile y web desde un solo lugar, reemplaza las variables de entorno de Vercel como "consola" | Fase 1 (datos acumulados con volumen suficiente para ser vendibles) |
| **4** | Canales adicionales: bot de WhatsApp (fricción casi cero en Chile), iOS, expansión regional | Fases 1–2 |

---

## 6. Fuera de alcance técnico — decisiones de negocio, no de código

- Constitución de la empresa (SpA u otra figura legal en Chile).
- Levantar capital o postular a programas como Corfo / Start-Up Chile.
- Negociar acuerdos comerciales de afiliación con las 9 farmacias.
- Revisión legal de términos de servicio y política de privacidad (ya existe una política básica, pero no legalmente validada para manejo de datos de salud).
- Contratación de equipo.

Estas decisiones son tuyas — lo que puedo hacer es dejar la arquitectura lista para que, cuando se resuelvan, no haya que rehacer trabajo técnico.

---

## 7. Recomendación de próximo paso concreto

Si se aprueba esta dirección, el primer ticket técnico real sería **Fase 1**: dar de alta un proyecto Supabase, definir el esquema mínimo de historial de precios, y conectar la ingesta asíncrona desde `searchService` — sin tocar ni romper nada de lo que ya funciona en producción. Todo lo demás (web, cuentas, API B2B) se construye encima de esa base.
