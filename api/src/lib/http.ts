export interface RequestLike {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  socket?: {
    remoteAddress?: string;
  };
}

export interface ResponseLike {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
}

export function getHeader(req: RequestLike, name: string): string | null {
  const headers = req.headers ?? {};
  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

const DEFAULT_ALLOWED_ORIGINS = [
  "https://app-compara-farma-web.vercel.app",
  "http://localhost:3000",
];

function getAllowedOrigins(): string[] {
  const fromEnv = process.env.ALLOWED_ORIGINS;
  if (!fromEnv) return DEFAULT_ALLOWED_ORIGINS;
  return fromEnv.split(",").map((origin) => origin.trim()).filter(Boolean);
}

// Requests without an Origin header (mobile app, server-to-server, curl) aren't subject
// to browser CORS enforcement, so they're let through unrestricted. Only a request that
// sends an Origin not on the allowlist is denied the Access-Control-Allow-Origin header.
export function applyCorsHeaders(res: ResponseLike, req?: RequestLike): void {
  if (!req) return;
  const origin = getHeader(req, "origin");
  if (!origin) return;
  res.setHeader("Vary", "Origin");
  if (getAllowedOrigins().includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
}

export function setJsonHeaders(res: ResponseLike, req?: RequestLike): void {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
  applyCorsHeaders(res, req);
}

export function json(res: ResponseLike, statusCode: number, body: unknown, req?: RequestLike): void {
  res.statusCode = statusCode;
  setJsonHeaders(res, req);
  if (statusCode >= 400) {
    res.setHeader("Cache-Control", "no-store");
  }
  res.end(JSON.stringify(body));
}

export function getSearchParam(req: RequestLike, name: string): string | null {
  if (!req.url) return null;
  const url = new URL(req.url, "http://localhost");
  return url.searchParams.get(name);
}

export function getClientIp(req: RequestLike): string {
  const forwarded = getHeader(req, "x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.socket?.remoteAddress ?? "unknown";
}
