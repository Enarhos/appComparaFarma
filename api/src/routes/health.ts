import { json, type RequestLike, type ResponseLike } from "../lib/http.js";

export async function handleHealthRoute(reqLike: unknown, resLike: unknown): Promise<void> {
  const req = reqLike as RequestLike;
  const res = resLike as ResponseLike;
  json(res, 200, {
    ok: true,
    service: "comparafarma-api",
    timestamp: new Date().toISOString(),
  }, req);
}
