// Auth Store — Épica 1 (Identity Foundation), TASK-001.
//
// Representa exclusivamente identidad, sesión, estado de carga y estado de
// autenticación — sin lógica Premium, sin preferencias, sin Perfil (eso es
// Task 010, Feature 2.1 de la Épica 2). Sigue el patrón de carga manual de
// `alertsStore.ts` (`load()` invocado explícitamente desde `_layout.tsx`),
// no el de `persist`/`createJSONStorage(AsyncStorage)` automático que usan
// `cartStore`/`favoritesStore`/`historyStore` — la sesión ya la persiste el
// propio SDK de Supabase (vía `LargeSecureStore`, ver `lib/supabase.ts`), así
// que este store nunca debe convertirse en una segunda fuente de verdad que
// pueda desincronizarse de la real (riesgo #3 de
// docs/execution/EPIC-01-IDENTITY_FOUNDATION.md).
import { create } from "zustand";
import { getCurrentSession, onSessionChange, signOut as signOutSession, type Session } from "@/lib/sessionManager";
import { fetchEntitlement, type EntitlementSnapshot } from "@/lib/entitlements";

export interface AuthIdentity {
  id: string;
  email: string | null;
}

interface AuthState {
  /** true una vez que `init()` resolvió la sesión existente por primera vez. */
  initialized: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  identity: AuthIdentity | null;
  /** Snapshot de solo lectura de `lib/entitlements.ts`. `null` mientras no hay
   * sesión — no confundir con "sin beneficios": significa "no aplica". */
  entitlement: EntitlementSnapshot | null;
  /**
   * Resuelve la sesión existente al arrancar la app. Idempotente (como
   * `alertsStore.load()`) — llamarlo más de una vez no repite el trabajo.
   * No lanza y no bloquea: si Supabase no responde o no está configurado,
   * el resultado es simplemente "sin sesión", nunca un error que impida
   * seguir usando la app de forma anónima (Principio 1,
   * docs/domain/USER_DOMAIN_MODEL.md).
   */
  init: () => Promise<void>;
  /** Cierra la sesión activa y vuelve al estado anónimo. La UI que la
   * invoque (Task 008 en adelante) no necesita actualizar el store a mano —
   * la suscripción a `onSessionChange` ya lo hace. */
  signOut: () => Promise<void>;
}

function toIdentity(session: Session | null): AuthIdentity | null {
  if (!session?.user) return null;
  return { id: session.user.id, email: session.user.email ?? null };
}

async function resolveEntitlement(session: Session | null): Promise<EntitlementSnapshot | null> {
  if (!session) return null;
  return fetchEntitlement(session.access_token);
}

// Suscripción a `onSessionChange` — a nivel de módulo, no de instancia del
// store, para garantizar que solo exista una sola vez durante la vida de la
// app sin importar cuántas veces se llame `init()` (mismo motivo que el
// guard `initialized` de abajo).
let unsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  initialized: false,
  loading: false,
  isAuthenticated: false,
  identity: null,
  entitlement: null,

  init: async () => {
    if (get().initialized) return;
    set({ loading: true });

    const session = await getCurrentSession();
    const entitlement = await resolveEntitlement(session);
    set({
      identity: toIdentity(session),
      entitlement,
      isAuthenticated: session !== null,
      loading: false,
      initialized: true,
    });

    if (!unsubscribe) {
      unsubscribe = onSessionChange(async (nextSession) => {
        const nextEntitlement = await resolveEntitlement(nextSession);
        set({
          identity: toIdentity(nextSession),
          entitlement: nextEntitlement,
          isAuthenticated: nextSession !== null,
        });
      });
    }
  },

  signOut: async () => {
    await signOutSession();
    // No se actualiza el estado acá a mano — `onSessionChange` ya recibe el
    // evento `SIGNED_OUT` de Supabase y sincroniza el store (ver `init()`).
  },
}));
