import { createAdminClient } from "@/lib/supabase/admin";

const TABLE = "profiles";

export interface ProfileRow {
  id: string;
  email: string;
  plan: "free" | "premium";
  created_at: string;
}

export type ProfilesResult = { ok: true; rows: ProfileRow[] } | { ok: false; error: string };

export async function getProfiles(): Promise<ProfilesResult> {
  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: "Faltan SUPABASE_URL / SUPABASE_SECRET_KEY en este proyecto de Vercel." };
  }

  const { data, error } = await admin
    .from(TABLE)
    .select("id, email, plan, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return { ok: false, error: error.message };
  return { ok: true, rows: (data ?? []) as ProfileRow[] };
}

// Único mecanismo de escritura sobre `plan` — profiles no tiene policy de
// update para el rol autenticado (ver docs/database/schema.sql, Sprint D),
// así que esto solo puede correr acá vía SUPABASE_SECRET_KEY.
export async function setProfilePlan(id: string, plan: "free" | "premium"): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from(TABLE).update({ plan, updated_at: new Date().toISOString() }).eq("id", id);
}
