import type { RequestLike } from "../lib/http.js";
import { getHeader } from "../lib/http.js";

export function isAuthorized(req: RequestLike): boolean {
  const expected = process.env.API_SECRET_KEY?.trim();
  if (!expected) return true;
  const provided = getHeader(req, "x-api-key")?.trim();
  return provided === expected;
}
