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
    // Sprint REL-003 — Privacy Logging Review: nunca registrar la dirección de
    // destino (dato personal). El subject describe el tipo de email (ej. "Confirma
    // tu alerta de precio — Paracetamol"), suficiente para depurar sin loguear PII.
    console.log("[email] sin RESEND_API_KEY, no se envía", { subject });
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
    // Sprint REL-003: no volcar el body de la respuesta — en un error de validación
    // Resend puede repetir el valor de "to" (dato personal) dentro del mensaje.
    console.log("[email] resend status:", res.status, "ok:", res.ok);
  } catch (err) {
    console.error("[email] resend error:", err instanceof Error ? err.message : err);
  }
}
