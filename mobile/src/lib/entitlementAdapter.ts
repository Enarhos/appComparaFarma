// Entitlement Adapter — Épica 1 (Identity Foundation), TASK-001A.
//
// Traduce el contrato crudo de los Servicios de Plataforma
// (`GET /api/subscriptions?action=me`, confirmado real en
// docs/execution/SPIKE-001_IDENTITY_ENTITLEMENT_POC.md y expuesto sin
// transformar por `lib/entitlements.ts`) al modelo de dominio de Mobile.
// Es el único archivo, además del propio cliente HTTP en `entitlements.ts`,
// que puede conocer los nombres `active`/`planId`/`benefits` — ningún store
// ni componente de UI debe importarlos ni referenciarlos directamente
// (ver `store/authStore.ts`).
//
//   Backend (crudo, no debe fugarse más allá de este adapter)
//   { active, planId, benefits, expiresAt }
//   ↓
//   Dominio Mobile (lo único que el resto de la app debe conocer)
//   { entitlements, plan, expiresAt }
//
// Regla de mapeo usada (documentada aquí porque no hay otra fuente que la
// fije, ver EPIC-01/SPIKE-001 — ambos describen el contrato crudo, no el
// modelo de dominio de Mobile):
// - `entitlements` = `benefits` tal cual — la lista de capacidades otorgadas.
// - `plan` = `planId` únicamente si `active === true`; si no, `null`.
//   `null` representa "sin plan vigente" (estado de dominio normal, ej.
//   Cuenta anónima o sin suscripción), nunca un error — no confundir con una
//   falla de red, que ya se degrada a este mismo estado neutro dentro de
//   `fetchEntitlement()`.
// - `expiresAt` pasa igual, sin transformación.
import { fetchEntitlement } from "./entitlements";

export interface Entitlement {
  /** Lista de capacidades otorgadas a la Cuenta (`benefits` del backend). */
  entitlements: string[];
  /** Identificador del plan vigente, o `null` si no hay plan activo. */
  plan: string | null;
  /** Fecha de expiración (ISO) del entitlement, si aplica. */
  expiresAt: string | null;
}

/**
 * Resuelve el entitlement de dominio de la Cuenta autenticada por
 * `accessToken`, delegando la llamada HTTP cruda a `fetchEntitlement()`
 * (`lib/entitlements.ts`) y aplicando la regla de mapeo documentada arriba.
 * Nunca lanza — hereda la degradación elegante de `fetchEntitlement()` ante
 * falta de sesión, falta de red, timeout o 401.
 */
export async function resolveEntitlement(accessToken: string | null): Promise<Entitlement> {
  const raw = await fetchEntitlement(accessToken);
  return {
    entitlements: raw.benefits,
    plan: raw.active ? raw.planId : null,
    expiresAt: raw.expiresAt,
  };
}
