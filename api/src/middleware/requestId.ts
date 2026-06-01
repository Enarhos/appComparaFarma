import type { RequestLike, ResponseLike } from "../lib/http.js";
import type { SearchRequestContext } from "../lib/types.js";

function randomSegment(): string {
  return Math.random().toString(36).slice(2, 8);
}

const SAFE_ID = /^[a-zA-Z0-9_\-]{1,64}$/;

export function attachRequestId(req: RequestLike, res: ResponseLike): SearchRequestContext {
  const incoming = Array.isArray(req.headers?.["x-request-id"])
    ? req.headers?.["x-request-id"][0]
    : req.headers?.["x-request-id"];
  const sanitized = incoming && SAFE_ID.test(incoming) ? incoming : null;
  const requestId = sanitized ?? `req_${Date.now()}_${randomSegment()}`;
  res.setHeader("x-request-id", requestId);
  return { requestId };
}
