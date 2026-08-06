import type { RequestLike } from "../lib/http.js";
import { getHeader } from "../lib/http.js";

export function isAuthorized(req: RequestLike): boolean {
  const expected = process.env.API_SECRET_KEY?.trim();
  if (!expected) return true;
  const provided = getHeader(req, "x-api-key")?.trim();
  return provided === expected;
}

/**
 * Autorización estricta para superficies de diagnóstico (ej. ?debug=1 en /api/search).
 *
 * A diferencia de isAuthorized(), NO tiene fallback abierto: si API_SECRET_KEY no está
 * configurado, esta función siempre devuelve false. El modo debug expone diagnósticos
 * internos por farmacia (estado, tiempos, mensajes de error) que no deben quedar
 * accesibles a cualquier persona solo porque el operador no configuró una API key.
 */
export function isDebugAuthorized(req: RequestLike): boolean {
  const expected = process.env.API_SECRET_KEY?.trim();
  if (!expected) return false;
  const provided = getHeader(req, "x-api-key")?.trim();
  return provided === expected;
}
