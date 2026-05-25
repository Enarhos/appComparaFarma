import { handleFeedbackRoute } from "../src/routes/feedback.js";

export default async function handler(req: unknown, res: unknown) {
  await handleFeedbackRoute(req, res);
}
