import { json, getClientIp } from "../lib/http.js";
import type { RequestLike, ResponseLike } from "../lib/http.js";
import { consumeRateLimit } from "../middleware/rateLimit.js";

const FEEDBACK_EMAIL = process.env.FEEDBACK_EMAIL ?? "mario.lillo.alfaro@gmail.com";
const RESEND_API_KEY = process.env.RESEND_API_KEY;

interface FeedbackBody {
  message?: string;
  email?: string;
}

async function parseBody(req: RequestLike): Promise<FeedbackBody> {
  // Vercel auto-parses JSON bodies — available on (req as any).body
  const raw = (req as Record<string, unknown>).body;
  if (raw && typeof raw === "object") return raw as FeedbackBody;

  // Fallback: stream parsing
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const stream = req as unknown as NodeJS.ReadableStream;
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  const text = Buffer.concat(chunks).toString();
  if (!text) return {};
  return JSON.parse(text) as FeedbackBody;
}

export async function handleFeedbackRoute(req: unknown, res: unknown): Promise<void> {
  const request = req as RequestLike;
  const response = res as ResponseLike;

  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method !== "POST") {
    return json(response, 405, { error: "Método no permitido" });
  }

  // Rate limit: 5 feedbacks por IP por hora
  const ip = getClientIp(request);
  if (!consumeRateLimit(`feedback:${ip}`, 5, 60 * 60 * 1000)) {
    return json(response, 429, { error: "Demasiados intentos. Intenta más tarde." });
  }

  let body: FeedbackBody;
  try {
    body = await parseBody(request);
  } catch {
    return json(response, 400, { error: "JSON inválido" });
  }

  const message = body.message?.trim() ?? "";
  if (message.length < 5) {
    return json(response, 400, { error: "El mensaje debe tener al menos 5 caracteres." });
  }
  if (message.length > 2000) {
    return json(response, 400, { error: "El mensaje no puede superar los 2000 caracteres." });
  }

  const rawEmail = body.email?.trim() ?? "";
  // Solo aceptar emails con formato básico válido; eliminar cualquier carácter de control
  const userEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)
    ? rawEmail.replace(/[\r\n]/g, "")
    : "";

  if (RESEND_API_KEY) {
    const lines = [
      "Nueva sugerencia recibida desde ComparaFarma:",
      "",
      `Mensaje:\n${message}`,
      "",
      `Email del usuario: ${userEmail || "(no proporcionado)"}`,
    ];

    try {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "ComparaFarma <onboarding@resend.dev>",
          to: [FEEDBACK_EMAIL],
          subject: "[ComparaFarma] Nueva sugerencia",
          text: lines.join("\n"),
        }),
      });
      const resendBody = await resendRes.json().catch(() => ({}));
      console.log("[feedback] resend status:", resendRes.status, JSON.stringify(resendBody));
    } catch (err) {
      console.error("[feedback] resend error:", err instanceof Error ? err.message : err);
    }
  } else {
    console.log("[feedback] sin RESEND_API_KEY", { message, email: userEmail, ip });
  }

  return json(response, 200, { ok: true });
}
