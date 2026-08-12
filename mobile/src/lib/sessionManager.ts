// Session Manager — Épica 1 (Identity Foundation), TASK-001 + TASK-003.
//
// Responsabilidad única: obtener la sesión persistida, iniciarla/crearla/
// cerrarla, completarla desde un deep link, y notificar cambios de estado de
// auth (login/logout/refresh de token). Ninguna pantalla/UI vive aquí — eso
// es responsabilidad de `app/login.tsx`/`app/registro.tsx` (TASK-003).
//
// Es la única capa que llama a `supabase.auth` directamente. Ningún
// store/componente debe importar `supabase.ts` para leer sesión — deben
// pasar por aquí, para que el resto de la app consuma exclusivamente
// Identity → Entitlements → Capabilities (nunca un proveedor/SDK directo).
import * as Linking from "expo-linking";
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

/**
 * Inicia sesión con email/contraseña (TASK-003, Task 006 de EPIC-01).
 * Devuelve únicamente `true`/`false` — nunca reenvía el `error` crudo de
 * Supabase hacia quien llama, porque el criterio de la app (igual que
 * `web/src/components/LoginForm.tsx`) es mostrar siempre un mensaje
 * genérico, sin importar la causa real (credenciales inválidas, red, etc.).
 * No actualiza ningún store: `onSessionChange` ya recibe el evento
 * `SIGNED_IN` y sincroniza `authStore` (ver cabecera del archivo).
 */
export async function signInWithPassword(email: string, password: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  } catch {
    return false;
  }
}

export type SignUpOutcome = "signed-in" | "check-email" | "error";

/**
 * Crea una cuenta con email/contraseña (TASK-003, Task 007 de EPIC-01).
 * Replica el mismo doble caso que `web/src/app/cuenta/registro/page.tsx`:
 * - Si el proyecto de Supabase tiene "Confirm email" desactivado, `signUp`
 *   devuelve sesión de inmediato → `"signed-in"` (equivalente a login
 *   exitoso; `onSessionChange` ya sincroniza `authStore`).
 * - Si lo tiene activado, no hay sesión todavía → `"check-email"`: la
 *   Persona debe abrir el link de confirmación que le llega por correo (ver
 *   `completeSessionFromUrl()` más abajo).
 *
 * `emailRedirectTo` usa el esquema de deep link ya declarado en
 * `mobile/app.json` (`comparafarma://login`), nunca una URL http — a
 * diferencia de Web (`${window.location.origin}/auth/callback?next=/cuenta`),
 * que no aplica a React Native (no existe `window.location`).
 *
 * Igual que `signInWithPassword`, nunca reenvía el mensaje real de error de
 * Supabase — solo el resultado categorizado.
 */
export async function signUpWithPassword(email: string, password: string): Promise<SignUpOutcome> {
  if (!supabase) return "error";
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: Linking.createURL("login") },
    });
    if (error) return "error";
    return data.session ? "signed-in" : "check-email";
  } catch {
    return "error";
  }
}

/**
 * Envía el email de recuperación de contraseña (Product Completion Sprint
 * 01). Usa exclusivamente la capacidad nativa de Supabase Auth
 * (`resetPasswordForEmail`) — no hay backend ni API propios involucrados.
 *
 * `redirectTo` usa el mismo esquema de deep link ya declarado en
 * `mobile/app.json` que usa `signUpWithPassword`, apuntando a la nueva
 * pantalla `actualizar-clave` en vez de a `login` — para que la Persona
 * llegue directo al formulario de contraseña nueva, no a la pantalla de
 * cuenta. La sesión de recuperación se completa igual que la de
 * confirmación de registro: `subscribeToAuthDeepLinks()` ya extrae los
 * tokens del deep link sin importar a qué pantalla apunten (ver
 * `parseAuthTokensFromUrl`), así que no requiere ningún cambio ahí.
 *
 * Igual que el resto de las funciones de este archivo, nunca reenvía el
 * mensaje real de error de Supabase — solo `true`/`false`. Un `false` puede
 * significar tanto "el email no existe" como "falló el envío": esa
 * ambigüedad es intencional, mismo criterio que
 * `web/src/app/cuenta/recuperar/page.tsx`, para no revelar si un correo
 * tiene o no una cuenta creada.
 */
export async function sendPasswordReset(email: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Linking.createURL("actualizar-clave"),
    });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Actualiza la contraseña de la sesión activa (Product Completion Sprint
 * 01). Solo tiene sentido llamarla con una sesión de recuperación ya
 * establecida (ver `sendPasswordReset` y `app/actualizar-clave.tsx`) —
 * `supabase.auth.updateUser` opera siempre sobre la sesión actual, nunca
 * requiere la contraseña anterior.
 */
export async function updatePassword(newPassword: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Extrae `access_token`/`refresh_token` del fragmento (`#...`) o, si no hay
 * fragmento, del query string (`?...`) de una URL de deep link. Sigue el
 * formato del flujo implícito documentado en la guía oficial vigente de
 * Supabase "Native Mobile Deep Linking" (supabase.com/docs/guides/auth/
 * native-mobile-deep-linking, consultada 2026-08-07): los tokens llegan como
 * parámetros de la URL de redirección, completados vía
 * `supabase.auth.setSession()` — no es un flujo PKCE (`code` +
 * `exchangeCodeForSession`), que es específico de integraciones server-side
 * con cookies (`@supabase/ssr`, usado por Web, no aplica a React Native).
 *
 * Implementación propia (sin la dependencia `expo-auth-session` que usa el
 * ejemplo oficial solo para este parseo) para no agregar una dependencia
 * nueva al monorepo por una utilidad de una sola función — ver Decisiones
 * técnicas del PR de esta Task.
 */
function parseAuthTokensFromUrl(url: string): { accessToken: string; refreshToken: string } | null {
  const hashIndex = url.indexOf("#");
  const queryIndex = url.indexOf("?");
  const raw = hashIndex >= 0 ? url.slice(hashIndex + 1) : queryIndex >= 0 ? url.slice(queryIndex + 1) : "";
  if (!raw) return null;

  const params = new URLSearchParams(raw);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

/**
 * Completa la sesión a partir de la URL de deep link recibida al abrir el
 * link de confirmación de email (TASK-003, Task 007 de EPIC-01). Devuelve
 * `false` sin lanzar si la URL no contiene tokens válidos, si Supabase no
 * está configurado, o si `setSession` falla — seguro de llamar con
 * cualquier URL de apertura de la app (ver el listener en `_layout.tsx`).
 * No navega ni actualiza ningún store directamente: `setSession()` dispara
 * internamente el evento `SIGNED_IN`, que `onSessionChange` ya escucha (ver
 * `authStore.init()`), evitando duplicar la sincronización.
 */
export async function completeSessionFromUrl(url: string): Promise<boolean> {
  if (!supabase) return false;
  const tokens = parseAuthTokensFromUrl(url);
  if (!tokens) return false;
  try {
    const { error } = await supabase.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Se suscribe a los deep links de auth (TASK-003, Task 007 de EPIC-01):
 * completa la sesión cuando la Persona abre el link de confirmación de
 * email enviado por Supabase (`comparafarma://login#access_token=...`).
 * Encapsula tanto el caso de la app ya abierta (`Linking.addEventListener`)
 * como el de abrirla recién desde el link (`Linking.getInitialURL`) — antes
 * vivía directamente en `_layout.tsx`, que no debe contener lógica de
 * autenticación/deep-linking (ver comentario de `RootLayout`).
 *
 * No navega ni sincroniza el Auth Store a mano — `setSession()` (dentro de
 * `completeSessionFromUrl`) dispara el evento `SIGNED_IN`, que
 * `authStore.init()` ya escucha vía `onSessionChange`.
 *
 * Devuelve una función `unsubscribe` para el cleanup del `useEffect` que la
 * invoque.
 */
export function subscribeToAuthDeepLinks(): () => void {
  const subscription = Linking.addEventListener("url", ({ url }) => {
    completeSessionFromUrl(url);
  });
  Linking.getInitialURL().then((url) => {
    if (url) completeSessionFromUrl(url);
  });

  return () => subscription.remove();
}
