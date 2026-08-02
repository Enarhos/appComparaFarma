import { createClient } from "@/lib/supabase/server";

export interface Profile {
  email: string;
  plan: "free" | "premium";
}

/**
 * Lee el perfil del usuario logueado, vía el cliente con sesión (respeta
 * RLS — un usuario solo puede leer su propia fila, ver
 * docs/database/schema.sql sección Sprint D). Devuelve null si no hay
 * sesión o si el perfil todavía no existe (no debería pasar salvo que el
 * trigger on_auth_user_created no haya corrido, ej. cuenta creada antes
 * de este sprint).
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("email, plan").eq("id", user.id).maybeSingle();
  if (!data) return null;

  return { email: data.email, plan: data.plan === "premium" ? "premium" : "free" };
}
