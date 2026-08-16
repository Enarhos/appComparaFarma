# CF-114 — Adaptador de Google Play (solo backend)

| Campo | Valor |
|---|---|
| **ID** | CF-114 |
| **Épica** | Subscription Platform (Fase 1) |
| **Estado** | 🟡 Parcial (2026-08-02) — parser de RTDN implementado y testeado; falta la Service Account de Google Cloud (acción manual de Mario) y, por lo tanto, la verificación real de purchase tokens |
| **Prioridad** | Media |
| **Estimación** | 4-6 h (incluye alta de credencial de Google Cloud) |
| **Referencia** | RFC-003 §3.3, §5 (riesgos R-01, R-02, R-05), ADR-0002 |

---

## Objetivo

Normalizar las notificaciones de Google Play (Real-Time Developer Notifications) a un evento común que el Subscription Service pueda procesar, sin tocar `mobile/`.

## Alcance

### Incluye
- `api/src/lib/adapters/googlePlayAdapter.ts` (nuevo): `parseNotification(payload): NormalizedSubscriptionEvent | null`, siguiendo el contrato `PaymentProviderAdapter` de RFC-003 §3.3.
- Alta de una Service Account de Google Cloud con acceso a la Play Developer API, bajo `mario.lillo.alfaro@gmail.com` (ver `docs/archive/releases/SERVICE_ACCOUNT_MIGRATION.md`) — necesaria para verificar purchase tokens.
- Configuración de Real-Time Developer Notifications en Play Console (tópico de Pub/Sub) apuntando al endpoint de CF-115.
- Tests con payloads de ejemplo de Google (fixtures, sin llamar a la API real de Google en tests).

### No incluye
- **No implementa el envío del purchase token desde la app** — eso requiere Play Billing Library en `mobile/`, que está en Prueba Cerrada de Google Play y no se toca (restricción activa en `CLAUDE.md`). Sin esa pieza, `recordProviderEvent` puede procesar notificaciones de renovación/cancelación de una suscripción ya existente, pero no puede originar la primera asociación usuario↔purchase token — ver R-02 de RFC-003.
- No implementa Apple, Stripe, Flow ni Mercado Pago.

## Criterios de aceptación

1. `parseNotification` normaliza correctamente los tipos de notificación relevantes de RTDN (renovación, cancelación, expiración, reembolso) contra fixtures de ejemplo.
2. La Service Account de Google Cloud existe y tiene permiso de lectura sobre `purchases.subscriptions` en la Play Developer API (verificado con una llamada de prueba en sandbox).
3. Documentado explícitamente en el issue el límite de esta fase: sin `mobile/`, no hay forma de asociar un purchase token nuevo a un `user_id` — solo se pueden procesar eventos de suscripciones ya asociadas manualmente o vía sandbox de prueba.

## Definición de terminado

- [x] `googlePlayAdapter.ts` implementado y testeado con fixtures (15 tests — parseo de notificaciones + mapeo de los 8 `notificationType` relevantes + construcción del evento normalizado)
- [x] Limitación de asociación usuario↔purchase token documentada (este issue, RFC-003 §5 R-02, y comentario en el código del adaptador)
- [ ] Service Account de Google Cloud creada — **pendiente, acción manual de Mario** (ver `docs/archive/releases/SERVICE_ACCOUNT_MIGRATION.md`)
- [ ] RTDN configurado en Play Console (sandbox/test track) — pendiente de la Service Account
