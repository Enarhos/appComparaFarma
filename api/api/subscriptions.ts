import { handleSubscriptionsRoute } from "../src/routes/subscriptions.js";

export default async function handler(req: unknown, res: unknown) {
  await handleSubscriptionsRoute(req, res);
}
