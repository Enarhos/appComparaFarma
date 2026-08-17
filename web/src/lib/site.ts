export function getSiteUrl(): string {
  const raw = process.env.SITE_URL ?? "https://www.preciosfarma.cl";
  return raw.replace(/\/$/, "");
}
