import { handleAccountRoute } from "../src/routes/account.js";

export default async function handler(req: unknown, res: unknown) {
  await handleAccountRoute(req, res);
}
