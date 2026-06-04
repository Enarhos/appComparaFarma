import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import { json, type RequestLike, type ResponseLike } from "../lib/http.js";
import type { BranchIndex } from "../clients/minsal.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// Cargado una vez al inicio — JSON estático generado por scripts-temp/fetch-branches.ps1
let branchIndex: BranchIndex | null = null;

function loadIndex(): BranchIndex | null {
  if (branchIndex) return branchIndex;
  try {
    const dataPath = join(__dirname, "../data/branches.json");
    const raw = readFileSync(dataPath, "utf-8");
    branchIndex = JSON.parse(raw) as BranchIndex;
    return branchIndex;
  } catch {
    return null;
  }
}

export function handleBranchesRoute(reqLike: unknown, resLike: unknown): void {
  const req = reqLike as RequestLike;
  const res = resLike as ResponseLike;

  if ((req.method ?? "GET").toUpperCase() !== "GET") {
    res.statusCode = 405;
    res.end();
    return;
  }

  const index = loadIndex();
  if (!index) {
    json(res, 503, { error: "Índice de sucursales no disponible." });
    return;
  }

  json(res, 200, index);
}
