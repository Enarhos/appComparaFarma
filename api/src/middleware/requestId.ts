import type { RequestLike, ResponseLike } from "../lib/http.js";
import type { SearchRequestContext } from "../lib/types.js";

function randomSegment(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function attachRequestId(req: RequestLike, res: ResponseLike): SearchRequestContext {
  const incoming = req.headers?.["x-request-id"];
  const requestId = Array.isArray(incoming)
    ? incoming[0] ?? `req_${Date.now()}_${randomSegment()}`
    : incoming ?? `req_${Date.now()}_${randomSegment()}`;
  res.setHeader("x-request-id", requestId);
  return { requestId };
}
