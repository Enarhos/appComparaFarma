import { createAdminClient } from "@/lib/supabase/admin";

const TABLE = "profiles";
const API_URL = (process.env.API_URL ?? "https://comparafarma-api.vercel.app").replace(/\/$/, "");

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

// Fase 1 del Motor de Suscripciones (RFC-003, CF-116): esto YA NO escribe
// `profiles.plan` directo — llama a api/ (subscriptionService.grantManual /
// revokeManual vía /api/subscriptions), que crea/cancela una suscripción
// real (provider: 'manual', plan 'cortesia') y actualiza `profiles.plan`
// como cache derivado desde el lado del motor. El comportamiento visible en
// /admin/usuarios no cambia — el toggle sigue funcionando igual.
export async function setProfilePlan(id: string, plan: "free" | "premium"): Promise<void> {
  const action = plan === "premium" ? "grant-manual" : "revoke-manual";
  try {
    await fetch(`${API_URL}/api/subscriptions?action=${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.API_SECRET_KEY ? { "x-api-key": process.env.API_SECRET_KEY } : {}),
      },
      body: JSON.stringify({ userId: id, planId: "cortesia" }),
      cache: "no-store",
    });
  } catch (err) {
    console.warn("setProfilePlan (subscription engine) failed", err);
  }
}
