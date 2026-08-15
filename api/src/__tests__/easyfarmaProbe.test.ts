import { describe, expect, it, vi, afterEach } from "vitest";

import { probeEasyFarma } from "../clients/easyfarma.js";

// Diagnóstico temporal (docs: investigación "Diagnóstico producción EasyFarma
// — respuesta desde Vercel"). Estos tests verifican las garantías de
// seguridad de probeEasyFarma(): nunca debe filtrar el valor de una cookie,
// y su salida debe quedar reducida a los campos esperados (sin HTML
// completo).

function fakeHeaders(map: Record<string, string>, setCookies: string[] = []) {
  return {
    get: (name: string) => map[name.toLowerCase()] ?? null,
    getSetCookie: () => setCookies,
  };
}

function fakeResponse(opts: {
  url: string;
  status?: number;
  redirected?: boolean;
  html: string;
  contentType?: string;
  setCookies?: string[];
}) {
  const status = opts.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    redirected: opts.redirected ?? false,
    url: opts.url,
    headers: fakeHeaders(
      { "content-type": opts.contentType ?? "text/html; charset=utf-8" },
      opts.setCookies ?? []
    ),
    text: () => Promise.resolve(opts.html),
  };
}

const REAL_HTML_WITH_PRODUCTS = `<!DOCTYPE html><html><head><title>EasyFarma - Nuevo Sitio Web</title></head>
<body>Hay 3 productos.
<article class="product-miniature" data-id-product="1"><h3 class="product-title"><a href="https://nuevo.easyfarma.cl/1-x.html">X</a></h3><span class="price">$ 690</span></article>
</body></html>`;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("probeEasyFarma", () => {
  it("nunca incluye el valor de la cookie en su salida, aunque la use internamente", async () => {
    const secretCookieValue = "PrestaShop-abc123=super-secreto-de-sesion-que-no-debe-salir";

    const fetchMock = vi.fn(async (url: string) => {
      if (url === "https://nuevo.easyfarma.cl") {
        return fakeResponse({
          url,
          html: "<html><head><title>Home</title></head><body>ok</body></html>",
          setCookies: [`${secretCookieValue}; Path=/; HttpOnly`],
        });
      }
      return fakeResponse({ url, html: REAL_HTML_WITH_PRODUCTS });
    });
    vi.stubGlobal("fetch", fetchMock);

    const results = await probeEasyFarma("paracetamol");
    const serialized = JSON.stringify(results);

    expect(serialized).not.toContain("super-secreto-de-sesion-que-no-debe-salir");
    expect(serialized).not.toContain("PrestaShop-abc123");

    const warmup = results.find((r) => r.variant === "warmup_cookie");
    expect(warmup?.usedCookieFromHome).toBe(true);
  });

  it("nunca incluye el HTML completo de la respuesta", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      fakeResponse({ url, html: REAL_HTML_WITH_PRODUCTS })
    );
    vi.stubGlobal("fetch", fetchMock);

    const results = await probeEasyFarma("paracetamol");
    const serialized = JSON.stringify(results);

    // El HTML de fixture tiene una etiqueta <article> completa; no debe
    // aparecer tal cual en la salida serializada.
    expect(serialized).not.toContain("<article");
    expect(serialized).not.toContain("data-id-product");
  });

  it("detecta correctamente el conteo de product-miniature y el texto 'Hay N productos'", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      fakeResponse({ url, html: REAL_HTML_WITH_PRODUCTS })
    );
    vi.stubGlobal("fetch", fetchMock);

    const results = await probeEasyFarma("paracetamol");
    const direct = results.find((r) => r.variant === "direct");

    expect(direct?.status).toBe(200);
    expect(direct?.productMiniatureCount).toBe(1);
    expect(direct?.containsHay).toBe(true);
    expect(direct?.containsProductMiniature).toBe(true);
    expect(direct?.containsCaptcha).toBe(false);
    expect(direct?.titleSanitized).toBe("EasyFarma - Nuevo Sitio Web");
  });

  it("detecta señales de bloqueo (captcha/cloudflare/forbidden) cuando están presentes", async () => {
    const blockedHtml = `<html><head><title>Access denied - Cloudflare</title></head><body>Please complete the captcha. Access Denied. Forbidden.</body></html>`;
    const fetchMock = vi.fn(async (url: string) => fakeResponse({ url, html: blockedHtml, status: 403 }));
    vi.stubGlobal("fetch", fetchMock);

    const results = await probeEasyFarma("paracetamol");
    const direct = results.find((r) => r.variant === "direct");

    expect(direct?.status).toBe(403);
    expect(direct?.containsCaptcha).toBe(true);
    expect(direct?.containsCloudflare).toBe(true);
    expect(direct?.containsAccessDenied).toBe(true);
    expect(direct?.containsForbidden).toBe(true);
  });

  it("registra redirected/finalUrl cuando la respuesta viene de una redirección", async () => {
    const fetchMock = vi.fn(async () =>
      fakeResponse({
        url: "https://nuevo.easyfarma.cl/",
        redirected: true,
        html: "<html><head><title>Home</title></head><body>redirigido</body></html>",
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const results = await probeEasyFarma("paracetamol");
    const direct = results.find((r) => r.variant === "direct");

    expect(direct?.redirected).toBe(true);
    expect(direct?.finalUrl).toBe("https://nuevo.easyfarma.cl/");
  });

  it("no revienta si fetch lanza (timeout/red) — registra error sin exponer detalles sensibles", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("network timeout after 8000ms");
    });
    vi.stubGlobal("fetch", fetchMock);

    const results = await probeEasyFarma("paracetamol");

    expect(results).toHaveLength(3);
    expect(results.every((r) => r.status === null && typeof r.error === "string")).toBe(true);
  });

  it("siempre devuelve exactamente 3 variantes: direct, warmup_cookie, browser_headers", async () => {
    const fetchMock = vi.fn(async (url: string) => fakeResponse({ url, html: REAL_HTML_WITH_PRODUCTS }));
    vi.stubGlobal("fetch", fetchMock);

    const results = await probeEasyFarma("paracetamol");

    expect(results.map((r) => r.variant)).toEqual(["direct", "warmup_cookie", "browser_headers"]);
  });
});
