import type { PharmacySlug } from "./types.js";

/**
 * CF-SEARCH-001 — registro único de dominios legítimos por farmacia.
 *
 * Antes vivía embebido en `clickTracking.ts` y solo se aplicaba en el momento
 * del redirect (`/api/go`). Se movió acá porque hay DOS consumidores con
 * responsabilidades distintas:
 *
 *   1. INGESTA (`searchService.ts`) — descartar en origen cualquier
 *      `onlineUrl` que no pertenezca a la farmacia que la entregó, para que
 *      una URL ajena no llegue nunca al pipeline de merge ni a la respuesta.
 *   2. REDIRECT (`routes/go.ts`) — última barrera contra open redirect antes
 *      de mandar al usuario fuera del sitio.
 *
 * Dominios verificados contra los 9 clientes y contra las URLs reales que
 * devuelve producción (`GET /api/search`, read-only, 2026-08-27):
 *
 * | slug         | host observado             | origen de la URL                    |
 * |--------------|----------------------------|-------------------------------------|
 * | cruz-verde   | www.cruzverde.cl           | construida por el cliente (BASE+id) |
 * | salcobrand   | salcobrand.cl              | construida por el cliente (BASE+slug)|
 * | ahumada      | www.farmaciasahumada.cl    | href del HTML (relativo o absoluto) |
 * | dr-simi      | www.drsimi.cl              | campo `link` de la API VTEX         |
 * | araucomed    | farmacia.araucomed.com     | campo `url` del JSON de PrestaShop  |
 * | ecofarmacias | www.ecofarmacias.cl        | `permalink` de la API WordPress     |
 * | farmex       | farmex.cl                  | construida por el cliente (BASE+url)|
 * | sermecoop    | www.farmaciasermecoop.cl   | href del HTML (BASE + href)         |
 * | easyfarma    | nuevo.easyfarma.cl         | href del HTML scrapeado             |
 *
 * Se guarda el dominio RAÍZ y se acepta cualquier subdominio suyo: los hosts
 * reales ya incluyen tres formas distintas (`www.`, `farmacia.`, `nuevo.`) y
 * las farmacias mueven sus tiendas de subdominio sin avisar — EasyFarma migró
 * a `nuevo.` durante la vida de este proyecto. Restringir al host exacto
 * habría roto la integración en cada una de esas migraciones.
 *
 * Los tres orígenes que NO controlamos (AraucoMed, EcoFarmacias, EasyFarma
 * entregan la URL completa desde su propia fuente) son exactamente los que
 * justifican validar en la ingesta y no solo en el redirect.
 */
export const PHARMACY_ALLOWED_DOMAINS: Record<PharmacySlug, string> = {
  "cruz-verde": "cruzverde.cl",
  salcobrand: "salcobrand.cl",
  ahumada: "farmaciasahumada.cl",
  "dr-simi": "drsimi.cl",
  araucomed: "araucomed.com",
  ecofarmacias: "ecofarmacias.cl",
  farmex: "farmex.cl",
  sermecoop: "farmaciasermecoop.cl",
  easyfarma: "easyfarma.cl",
};

/**
 * `true` si `rawUrl` es una URL https de un dominio propio de `slug`.
 *
 * Deliberadamente NO se acepta http: todas las farmacias sirven https, y una
 * URL http en un catálogo es señal de dato viejo o manipulado.
 */
export function isPharmacyOwnedUrl(slug: PharmacySlug, rawUrl: string): boolean {
  try {
    const { hostname, protocol } = new URL(rawUrl);
    if (protocol !== "https:") return false;
    const domain = PHARMACY_ALLOWED_DOMAINS[slug];
    return domain != null && (hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

/**
 * Devuelve la URL si pertenece a la farmacia, o `null` si no.
 *
 * `null` es un valor esperado y ya soportado en todo el pipeline
 * (`ScrapedProduct.onlineUrl`/`PharmacyPrice.onlineUrl` son nullable; Mobile y
 * Web simplemente no muestran el CTA). Preferimos una oferta sin link antes
 * que un link que lleve a otra farmacia: el usuario ve el precio, pero nunca
 * termina en un sitio distinto del que dice la tarjeta.
 */
export function sanitizePharmacyUrl(slug: PharmacySlug, rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  return isPharmacyOwnedUrl(slug, rawUrl) ? rawUrl : null;
}
