export function getSiteUrl(): string {
  const raw = process.env.SITE_URL ?? "https://comparafarma.vercel.app";
  return raw.replace(/\/$/, "");
}
