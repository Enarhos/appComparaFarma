import { json, type RequestLike, type ResponseLike } from "../lib/http.js";
import { getPharmacyConfig } from "../lib/pharmacyFlags.js";
import { getDonationBannerConfig } from "../lib/donationConfig.js";

export async function handleConfigRoute(reqLike: unknown, resLike: unknown): Promise<void> {
  const req = reqLike as RequestLike;
  const res = resLike as ResponseLike;

  if ((req.method ?? "GET").toUpperCase() !== "GET") {
    res.statusCode = 405;
    res.end();
    return;
  }

  json(res, 200, {
    pharmacies: getPharmacyConfig(),
    donationBanner: getDonationBannerConfig(),
  });
}
