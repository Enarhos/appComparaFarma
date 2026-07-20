import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Copia local del patrón de api/src/lib/supabaseClient.ts (no se importa entre
// workspaces). Usa la secret key: bypassea RLS a propósito, solo se llama desde
// código server-side ya protegido por middleware.ts (sesión de Supabase Auth).
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
