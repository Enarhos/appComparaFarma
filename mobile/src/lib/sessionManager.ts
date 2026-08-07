// Session Manager — Épica 1 (Identity Foundation), TASK-001.
//
// Responsabilidad única: obtener la sesión persistida, cerrarla, y notificar
// cambios de estado de auth (login/logout/refresh de token). No expone
// `signIn`/`signUp` — esa lógica pertenece a las Tasks 006/007 (pantallas de
// Login/Registro), fuera del alcance de esta Task — ni ninguna pantalla/UI.
//
// Es la única capa que llama a `supabase.auth` directamente. Ningún
// store/componente debe importar `supabase.ts` para leer sesión — deben
// pasar por aquí, para que el resto de la app consuma exclusivamente
// Identity → Entitlements → Capabilities (nunca un proveedor/SDK directo).
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type { Session };

/**
 * Sesión persistida (si existe) al momento de llamarse. `null` si no hay
 * sesión activa o si Supabase no está configurado (ver `supabase.ts`) —
 * nunca lanza, para no bloquear el arranque anónimo de la app (Principio 1,
 * docs/domain/USER_DOMAIN_MODEL.md: la búsqueda de medicamentos funciona
 * siempre, con o sin identidad).
 */
export async function getCurrentSession(): Promise<Session | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session ?? null;
  } catch {
    return null;
  }
}

/**
 * Cierra la sesión activa, si existe. No lanza — degrada a no-op tanto si
 * no hay sesión como si la llamada a Supabase falla (ej. la sesión ya había
 * sido invalidada en el servidor, ver SPIKE-001 Paso 6).
 */
export async function signOut(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch {
    // No-op intencional — ver comentario arriba.
  }
}

/**
 * Se suscribe a cambios de sesión (`onAuthStateChange` de Supabase: login,
 * logout, refresh automático de token). Devuelve una función `unsubscribe`.
 * No-op (devuelve un unsubscribe vacío) si Supabase no está configurado.
 */
export function onSessionChange(callback: (session: Session | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data.subscription.unsubscribe();
}
