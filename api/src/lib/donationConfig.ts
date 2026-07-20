import { getConfigValue } from "./appConfigDb.js";

export interface DonationBannerConfig {
  enabled: boolean;
  dismissDays: number;
}

const DEFAULT_DISMISS_DAYS = 7;
const CONFIG_KEY = "donation_banner";

function fromEnv(): DonationBannerConfig {
  const enabled = process.env.DONATION_BANNER_ENABLED !== "false";
  const parsedDays = Number(process.env.DONATION_BANNER_DISMISS_DAYS);
  const dismissDays = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : DEFAULT_DISMISS_DAYS;
  return { enabled, dismissDays };
}

/**
 * Fuente de verdad: tabla app_config en Supabase (editable desde /admin, sin
 * redeploy). Cae a las env vars DONATION_BANNER_ENABLED/_DISMISS_DAYS si la
 * fila no existe todavía o Supabase no responde.
 */
export async function getDonationBannerConfig(): Promise<DonationBannerConfig> {
  const fromDb = await getConfigValue<DonationBannerConfig>(CONFIG_KEY);
  if (fromDb && typeof fromDb.enabled === "boolean" && Number.isFinite(fromDb.dismissDays)) {
    return fromDb;
  }
  return fromEnv();
}
