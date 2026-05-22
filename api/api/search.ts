import { handleSearchRoute } from "../src/routes/search.js";

export default async function handler(req: unknown, res: unknown) {
  await handleSearchRoute(req, res);
}
