import { handleDonateRoute } from "../src/routes/donate.js";

export default async function handler(req: unknown, res: unknown) {
  await handleDonateRoute(req, res);
}
