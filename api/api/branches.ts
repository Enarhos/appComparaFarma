import { handleBranchesRoute } from "../src/routes/branches.js";

export default async function handler(req: unknown, res: unknown) {
  await handleBranchesRoute(req, res);
}
