export function getSiteUrl(): string {
  // FOLLOW_UP: switch SITE_URL/canonical to https://preciosfarma.cl immediately
  // after the custom domain is verified in Vercel.
  const raw = process.env.SITE_URL ?? "https://comparafarma.vercel.app";
  return raw.replace(/\/$/, "");
}
