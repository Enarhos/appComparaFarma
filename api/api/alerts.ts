import { handleAlertsRoute } from "../src/routes/alerts.js";

export default async function handler(req: unknown, res: unknown) {
  await handleAlertsRoute(req, res);
}
