import { handleConfigRoute } from "../src/routes/config.js";

export default async function handler(req: unknown, res: unknown) {
  await handleConfigRoute(req, res);
}
