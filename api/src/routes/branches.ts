import { json, type RequestLike, type ResponseLike } from "../lib/http.js";
import { BRANCH_INDEX } from "../data/branches-data.js";

export function handleBranchesRoute(reqLike: unknown, resLike: unknown): void {
  const req = reqLike as RequestLike;
  const res = resLike as ResponseLike;

  if ((req.method ?? "GET").toUpperCase() !== "GET") {
    res.statusCode = 405;
    res.end();
    return;
  }

  json(res, 200, BRANCH_INDEX, req);
}
