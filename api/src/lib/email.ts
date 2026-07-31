// Envío de email vía Resend — API REST directa (sin SDK), mismo patrón que
// api/src/routes/feedback.ts, extraído acá para reusarlo también en
// api/src/routes/alerts.ts (Sprint C) sin duplicar la llamada a fetch.
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Dominio sandbox de Resend — decisión explícita del CEO (2026-07-31) para
// no bloquear Sprint C con verificación de dominio propio. Migrar cuando
// se decida verificar un dominio real en Resend.
const FROM = "ComparaFarma <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.log("[email] sin RESEND_API_KEY, no se envía", { to, subject });
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, text }),
    });
    const body = await res.json().catch(() => ({}));
    console.log("[email] resend status:", res.status, JSON.stringify(body));
  } catch (err) {
    console.error("[email] resend error:", err instanceof Error ? err.message : err);
  }
}
