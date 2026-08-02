import { createClient } from "@/lib/supabase/server";

const API_URL = (process.env.API_URL ?? "https://comparafarma-api.vercel.app").replace(/\/$/, "");

export interface Profile {
  email: string;
  plan: "free" | "premium";
}

/**
 * Lee el perfil del usuario logueado. El email sigue viniendo de `profiles`
 * (identidad, no cambia con Subscription Platform). El plan YA NO se lee de
 * `profiles.plan` directo — Fase 1 del Motor de Suscripciones (RFC-003,
 * CF-116) lo reemplaza como fuente de verdad: se consulta
 * GET /api/subscriptions?action=me en api/, que llama a
 * subscriptionService.getEntitlement(). `profiles.plan` queda como cache
 * derivado (lo actualiza el motor), pero este helper ya no confía en él.
 *
 * Devuelve null si no hay sesión o si el perfil todavía no existe (no
 * debería pasar salvo que el trigger on_auth_user_created no haya corrido).
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profileRow } = await supabase.from("profiles").select("email").eq("id", user.id).maybeSingle();
  if (!profileRow) return null;

  const plan = await fetchEntitlementPlan();
  return { email: profileRow.email, plan };
}

async function fetchEntitlementPlan(): Promise<"free" | "premium"> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return "free";

    const res = await fetch(`${API_URL}/api/subscriptions?action=me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return "free";

    const entitlement = (await res.json()) as { active?: boolean };
    return entitlement.active ? "premium" : "free";
  } catch (err) {
    // Degradación elegante: si api/ no responde, el usuario se ve como
    // "free" en vez de romper la página — nunca se le niega acceso a algo
    // gratis por un fallo de red.
    console.warn("fetchEntitlementPlan failed", err);
    return "free";
  }
}
