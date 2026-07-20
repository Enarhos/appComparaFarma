import { recordClick, isAllowedRedirectUrl } from "../lib/clickTracking.js";
import { PHARMACY_NAMES } from "../lib/pharmacies.js";
import { getSearchParam, type RequestLike, type ResponseLike } from "../lib/http.js";
import type { PharmacySlug } from "../lib/types.js";

const VALID_SLUGS = new Set(Object.keys(PHARMACY_NAMES));

export async function handleGoRoute(reqLike: unknown, resLike: unknown): Promise<void> {
  const req = reqLike as RequestLike;
  const res = resLike as ResponseLike;

  const slugParam = getSearchParam(req, "slug");
  const matchKey = getSearchParam(req, "matchKey");
  const url = getSearchParam(req, "url");

  const validSlug = slugParam && VALID_SLUGS.has(slugParam) ? (slugParam as PharmacySlug) : null;

  if (!validSlug || !matchKey || !url || !isAllowedRedirectUrl(validSlug, url)) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Solicitud inválida.");
    return;
  }

  await recordClick(matchKey, validSlug).catch(() => {});

  res.statusCode = 302;
  res.setHeader("Location", url);
  res.setHeader("Cache-Control", "no-store");
  res.end();
}
