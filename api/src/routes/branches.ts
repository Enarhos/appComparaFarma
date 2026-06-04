import { json, type RequestLike, type ResponseLike } from "../lib/http.js";
import { fetchMinsalBranches, type BranchIndex } from "../clients/minsal.js";

const TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

let cache: { index: BranchIndex; expiresAt: number } | null = null;

async function getBranchIndex(): Promise<BranchIndex> {
  const now = Date.now();
  if (cache && now < cache.expiresAt) return cache.index;
  const index = await fetchMinsalBranches();
  cache = { index, expiresAt: now + TTL_MS };
  return index;
}

export async function handleBranchesRoute(reqLike: unknown, resLike: unknown): Promise<void> {
  const req = reqLike as RequestLike;
  const res = resLike as ResponseLike;

  if ((req.method ?? "GET").toUpperCase() !== "GET") {
    res.statusCode = 405;
    res.end();
    return;
  }

  try {
    const index = await getBranchIndex();
    json(res, 200, index);
  } catch (err) {
    console.error("[branches]", err instanceof Error ? err.message : err);
    json(res, 503, { error: "No se pudo obtener el índice de sucursales." });
  }
}
