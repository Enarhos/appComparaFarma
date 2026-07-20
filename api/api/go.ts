import { handleGoRoute } from "../src/routes/go.js";

export default async function handler(req: unknown, res: unknown) {
  await handleGoRoute(req, res);
}
