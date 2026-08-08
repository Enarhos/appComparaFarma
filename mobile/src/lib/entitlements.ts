// Cliente de Entitlements — Épica 1 (Identity Foundation), TASK-001.
//
// Única abstracción de solo lectura sobre `GET /api/subscriptions?action=me`
// — contrato real confirmado con llamadas de producción en
// docs/execution/SPIKE-001_IDENTITY_ENTITLEMENT_POC.md. No implementa
// Billing ni Premium — solo lee y expone el resultado tal como lo devuelven
// los Servicios de Plataforma (`api/`), que son la única fuente de verdad
// (Principio 2). Ningún proveedor (Google Play Billing, Flow) se consulta
// directo desde Mobile — no aplica aún, y esta capa no insinúa ese
// acoplamiento (Principio 3/4).
const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";

export interface EntitlementSnapshot {
  active: boolean;
  planId: string | null;
  benefits: string[];
  expiresAt: string | null;
}

/**
 * Estado por defecto — "esta Cuenta no tiene ningún entitlement activo".
 * Mismo criterio de degradación elegante que `web/src/lib/profile.ts`
 * (`fetchEntitlementPlan`): cualquier fallo (sin sesión, red, timeout, 401
 * de `api/`) se trata como este estado neutro, nunca como una excepción
 * fatal — nunca se le niega a nadie una función gratuita por un fallo de
 * red o por no tener sesión.
 */
const NO_ENTITLEMENT: EntitlementSnapshot = {
  active: false,
  planId: null,
  benefits: [],
  expiresAt: null,
};

/**
 * Consulta el entitlement de la Cuenta autenticada por `accessToken` contra
 * `GET {EXPO_PUBLIC_API_URL}/api/subscriptions?action=me`, con
 * `Authorization: Bearer <accessToken>` — sin cookies, sin ningún otro
 * header (contrato confirmado en SPIKE-001). Si `api/` responde 401 (token
 * inválido o sesión ya cerrada, ver SPIKE-001 Paso 6d) o cualquier otro
 * error, se degrada a `NO_ENTITLEMENT` en vez de lanzar.
 */
export async function fetchEntitlement(accessToken: string | null): Promise<EntitlementSnapshot> {
  if (!API_URL || !accessToken) return NO_ENTITLEMENT;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/subscriptions?action=me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
    if (!res.ok) return NO_ENTITLEMENT;

    const data = (await res.json()) as Partial<EntitlementSnapshot>;
    return {
      active: data.active === true,
      planId: typeof data.planId === "string" ? data.planId : null,
      benefits: Array.isArray(data.benefits)
        ? data.benefits.filter((b): b is string => typeof b === "string")
        : [],
      expiresAt: typeof data.expiresAt === "string" ? data.expiresAt : null,
    };
  } catch {
    return NO_ENTITLEMENT;
  } finally {
    clearTimeout(timeout);
  }
}
