import { handleSubscriptionsRoute } from "../src/routes/subscriptions.js";

// Subscription Platform Fase 2 corregida (RFC-005, CF-124): action=flow-webhook
// y action=flow-register-return reciben `application/x-www-form-urlencoded`
// de Flow (nunca JSON) — se desactiva el parseo automático de Vercel para
// toda la función y se lee el body a mano (readRawBody/parseBody/parseFormBody
// en src/routes/subscriptions.ts). El resto de acciones ya leían el body
// manualmente como respaldo, así que esto no cambia su comportamiento.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: unknown, res: unknown) {
  await handleSubscriptionsRoute(req, res);
}
