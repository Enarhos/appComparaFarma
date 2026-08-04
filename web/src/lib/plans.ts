const API_URL = (process.env.API_URL ?? "https://comparafarma-api.vercel.app").replace(/\/$/, "");

// Subscription Platform — Fase 2 corregida (RFC-005, CF-125).
// docs/engineering/rfc/RFC-005_WEB_BILLING_FLOW.md
//
// Lista de planes vendibles hoy, resuelta 100% desde api/ (GET
// action=plans, público, sin auth) — nunca hardcodeada en web/. Si el
// catálogo está vacío (estado real mientras el CEO no defina precios) o si
// api/ no responde, devuelve [] y /cuenta simplemente no muestra ningún
// botón de upgrade — no es un error, es el estado correcto.

export interface AvailablePlan {
  id: string;
  name: string;
  referencePrice: number | null;
  currency: string;
  billingPeriod: string | null;
  benefits: string[];
}

export async function getAvailablePlans(): Promise<AvailablePlan[]> {
  try {
    const res = await fetch(`${API_URL}/api/subscriptions?action=plans`, { cache: "no-store" });
    if (!res.ok) return [];
    const plans = (await res.json()) as AvailablePlan[];
    return Array.isArray(plans) ? plans : [];
  } catch (err) {
    console.warn("getAvailablePlans failed", err);
    return [];
  }
}
