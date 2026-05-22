import { handleHealthRoute } from "../src/routes/health.js";

export default async function handler(req: unknown, res: unknown) {
  await handleHealthRoute(req, res);
}
