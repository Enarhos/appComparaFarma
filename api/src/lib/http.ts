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

export function setJsonHeaders(res: ResponseLike): void {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
  res.setHeader("Access-Control-Allow-Origin", "*");
}

export function json(res: ResponseLike, statusCode: number, body: unknown): void {
  res.statusCode = statusCode;
  setJsonHeaders(res);
  if (statusCode >= 400) {
    res.setHeader("Cache-Control", "no-store");
  }
  res.end(JSON.stringify(body));
}

export function getHeader(req: RequestLike, name: string): string | null {
  const headers = req.headers ?? {};
  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
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
