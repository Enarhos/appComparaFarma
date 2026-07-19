export interface DonationBannerConfig {
  enabled: boolean;
  dismissDays: number;
}

const DEFAULT_DISMISS_DAYS = 7;

/**
 * Lee las variables de entorno DONATION_BANNER_ENABLED y DONATION_BANNER_DISMISS_DAYS.
 *
 * Ejemplos:
 *   DONATION_BANNER_ENABLED=false      ← apaga el banner para todos los usuarios
 *   DONATION_BANNER_DISMISS_DAYS=14    ← "No mostrar por ahora" dura 14 días en vez de 7
 *
 * Para cambiar: Vercel Dashboard → Settings → Environment Variables → redeploy (~30s).
 */
export function getDonationBannerConfig(): DonationBannerConfig {
  const enabled = process.env.DONATION_BANNER_ENABLED !== "false";
  const parsedDays = Number(process.env.DONATION_BANNER_DISMISS_DAYS);
  const dismissDays = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : DEFAULT_DISMISS_DAYS;
  return { enabled, dismissDays };
}
