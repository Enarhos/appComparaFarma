import { handlePriceHistoryRoute } from "../src/routes/priceHistory.js";

export default async function handler(req: unknown, res: unknown) {
  await handlePriceHistoryRoute(req, res);
}
