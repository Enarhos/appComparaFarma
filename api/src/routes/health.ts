import { json, type ResponseLike } from "../lib/http.js";

export async function handleHealthRoute(_req: unknown, resLike: unknown): Promise<void> {
  const res = resLike as ResponseLike;
  json(res, 200, {
    ok: true,
    service: "comparafarma-api",
    timestamp: new Date().toISOString(),
  });
}
