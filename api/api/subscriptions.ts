import { handleSubscriptionsRoute } from "../src/routes/subscriptions.js";

// Subscription Platform Fase 2 (RFC-004): action=stripe-webhook necesita el
// body crudo exacto para verificar la firma de Stripe — se desactiva el
// parseo automático de Vercel para toda la función. El resto de acciones ya
// leían el body manualmente como respaldo (ver readRawBody/parseBody en
// src/routes/subscriptions.ts), así que esto no cambia su comportamiento.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: unknown, res: unknown) {
  await handleSubscriptionsRoute(req, res);
}
