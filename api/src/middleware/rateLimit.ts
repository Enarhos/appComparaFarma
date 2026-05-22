const hits = new Map<string, { count: number; resetAt: number }>();

const DEFAULT_MAX = Number(process.env.RATE_LIMIT_MAX ?? 60);
const DEFAULT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);

export function consumeRateLimit(key: string, max = DEFAULT_MAX, windowMs = DEFAULT_WINDOW_MS): boolean {
  const now = Date.now();
  const existing = hits.get(key);

  if (!existing || now >= existing.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= max) return false;

  existing.count += 1;
  return true;
}
