import { createClient } from "@supabase/supabase-js";

// AUTH-DELETE-01 (Backend) — reautenticación email/password antes de un
// borrado de cuenta. La contraseña llega en el body de la request, se usa
// UNA SOLA VEZ para esta verificación y nunca se registra en logs, nunca se
// persiste, nunca se devuelve en la respuesta (ver docs de la tarea:
// "no enviar ni registrar la contraseña en logs; no persistirla; no
// devolverla").
//
// `supabaseClient.ts` solo expone un cliente con SUPABASE_SECRET_KEY
// (service role) — `signInWithPassword` es una operación de cliente público
// (anon key), así que necesita su propio cliente, creado bajo demanda (no
// como singleton) para minimizar el tiempo de vida de cualquier referencia
// con la contraseña en memoria.
//
// Requiere SUPABASE_URL + SUPABASE_ANON_KEY. Si SUPABASE_ANON_KEY no está
// configurado, `reauthenticateWithPassword` devuelve `"not_configured"` —
// mismo patrón de degradación explícita que `getFlowConfig()`/
// `supabaseClient.ts` (nunca lanza, nunca asume disponible).

export type ReauthResult = "ok" | "invalid_credentials" | "not_configured";

export async function reauthenticateWithPassword(email: string, password: string): Promise<ReauthResult> {
  const url = process.env.SUPABASE_URL?.trim();
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return "not_configured";

  try {
    const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.session) return "invalid_credentials";
    return "ok";
  } catch (err) {
    console.warn("reauthenticateWithPassword threw", err);
    return "invalid_credentials";
  }
}

/**
 * Decodifica (sin re-verificar firma — ya la verificó `supabase.auth.getUser`
 * al resolver la identidad) el payload de un JWT para leer `iat`. Se usa
 * solo para la reautenticación de cuentas OAuth (hoy: Google, exclusivo de
 * `/admin`), donde no existe un equivalente a `signInWithPassword` — la
 * señal disponible es "¿la sesión es reciente?".
 */
export function decodeJwtIssuedAt(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadJson = Buffer.from(parts[1]!.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;
    return typeof payload.iat === "number" ? payload.iat : null;
  } catch {
    return null;
  }
}
