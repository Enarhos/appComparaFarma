/**
 * CF-DATA-001 — Captura de muestras REALES por farmacia (Fase 1).
 *
 * Llama a los MISMOS endpoints upstream que usan los adaptadores de
 * api/src/clients/, y guarda por cada oferta el nombre crudo y el valor crudo
 * del campo que hoy se mapea a `ScrapedProduct.laboratory` (o el que sería el
 * candidato natural cuando el adaptador mapea `null` a secas).
 *
 * No requiere credenciales. Salcobrand (Algolia, requiere ALGOLIA_APP_ID /
 * ALGOLIA_API_KEY) se omite a propósito: no se inventan keys. Su evidencia se
 * obtiene aparte, desde la respuesta pública de /api/search en producción.
 */
import { writeFileSync, mkdirSync } from "node:fs";

const QUERIES = [
  "ambroxol", "paracetamol", "tapsin", "ibuprofeno", "losartan",
  "omeprazol", "amoxicilina", "diclofenaco", "cetirizina",
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function get(url, options = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30000);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// --- Cruz Verde (Demandware product_search) ------------------------------
async function cruzverde(q) {
  const params = new URLSearchParams({
    q, count: "24", expand: "prices,availability,images",
    client_id: "c19ce24d-1677-4754-b9f7-c193997c5a92",
  });
  const res = await get(`https://beta.cruzverde.cl/s/Chile/dw/shop/v19_1/product_search?${params}`, {
    headers: { "User-Agent": UA, "x-dw-client-id": "c19ce24d-1677-4754-b9f7-c193997c5a92", Referer: "https://www.cruzverde.cl/" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.hits ?? []).map((h) => ({
    name: String(h.product_name ?? ""),
    field: "hit.brand",
    raw: h.brand ?? null,
    keys: Object.keys(h).join(" "),
  }));
}

// --- Dr. Simi (VTEX catalog) ---------------------------------------------
async function drsimi(q) {
  const res = await get(`https://www.drsimi.cl/api/catalog_system/pub/products/search/${encodeURIComponent(q)}?_from=0&_to=23`, {
    headers: { "User-Agent": UA, Accept: "application/json", Referer: "https://www.drsimi.cl/" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const products = await res.json();
  return (products ?? []).map((p) => ({
    name: String(p.productName ?? ""),
    field: "product.brand",
    raw: p.brand ?? null,
    keys: Object.keys(p).join(" "),
  }));
}

// --- AraucoMed (PrestaShop ajax search) ----------------------------------
async function araucomed(q) {
  const params = new URLSearchParams({ controller: "search", s: q, ajax: "1" });
  const res = await get(`https://farmacia.araucomed.com/?${params}`, {
    headers: { "User-Agent": UA, "X-Requested-With": "XMLHttpRequest", Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.products ?? []).map((p) => ({
    name: String(p.name ?? ""),
    field: "product.manufacturer_name",
    raw: p.manufacturer_name ?? null,
    keys: Object.keys(p).join(" "),
  }));
}

// --- Farmex (Shopify suggest) --------------------------------------------
async function farmex(q) {
  const params = new URLSearchParams({ q, "resources[type]": "product", "resources[limit]": "50" });
  const res = await get(`https://farmex.cl/search/suggest.json?${params}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data?.resources?.results?.products ?? []).map((p) => ({
    name: String(p.title ?? ""),
    field: "product.vendor",
    raw: p.vendor ?? null,
    keys: Object.keys(p).join(" "),
  }));
}

// --- EcoFarmacias (WooCommerce Store API) --------------------------------
async function ecofarmacias(q) {
  const params = new URLSearchParams({ search: q, per_page: "20" });
  const res = await get(`https://www.ecofarmacias.cl/wp-json/wc/store/v1/products?${params}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw = await res.json();
  const products = Array.isArray(raw) ? raw : [];
  return products.map((p) => ({
    name: String(p.name ?? ""),
    // El adaptador mapea `laboratory: null`. Se captura el candidato natural
    // que sí existe en Woo (atributo/brand) para verificar si hay dato latente.
    field: "(none mapped) brands/attributes",
    raw: (Array.isArray(p.brands) && p.brands.length ? p.brands.map((b) => b?.name).join("/") : null)
      ?? (Array.isArray(p.attributes) ? p.attributes.map((a) => `${a?.name}=${(a?.terms ?? []).map((t) => t?.name).join(",")}`).join(" | ") || null : null),
    keys: Object.keys(p).join(" "),
  }));
}

// --- Ahumada (Demandware HTML) -------------------------------------------
async function ahumada(q) {
  const params = new URLSearchParams({ q, start: "0", sz: "24" });
  const res = await get(`https://www.farmaciasahumada.cl/on/demandware.store/Sites-ahumada-cl-Site/es_CL/Search-Show?${params}`, {
    headers: { "User-Agent": UA, Referer: "https://www.farmaciasahumada.cl/", Accept: "text/html" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const out = [];
  const tileRe = /class="product product-tile-wrapper[^"]*"[^>]*data-pid="(\d+)"([\s\S]+?)(?=class="product product-tile-wrapper|<div class="col-12 grid-footer|<\/body>)/g;
  let tile;
  const seen = new Set();
  while ((tile = tileRe.exec(html)) !== null) {
    const [, pid, block] = tile;
    if (seen.has(pid)) continue;
    seen.add(pid);
    const linkMatch = block.match(/class="pdp-link"[\s\S]*?href="([^"]+)"[^>]*>\s*([^<]+)</);
    if (!linkMatch) continue;
    // Candidatos latentes de marca en el tile de Demandware.
    const brandDiv = block.match(/class="[^"]*product-brand[^"]*"[^>]*>\s*([^<]+)</);
    const dataBrand = block.match(/data-brand="([^"]*)"/);
    const gtmBrand = block.match(/"brand"\s*:\s*"([^"]*)"/);
    out.push({
      name: linkMatch[2].trim(),
      field: "(none mapped) product-brand/data-brand/gtm",
      raw: (brandDiv?.[1] ?? dataBrand?.[1] ?? gtmBrand?.[1] ?? null)?.trim() || null,
      keys: "",
    });
  }
  return out;
}

// --- EasyFarma (PrestaShop leoproductsearch HTML) ------------------------
async function easyfarma(q) {
  const params = new URLSearchParams({
    fc: "module", module: "leoproductsearch", controller: "productsearch", search_query: q,
  });
  const res = await get(`https://nuevo.easyfarma.cl/?${params}`, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const out = [];
  for (const block of html.split(/(?=<article[^>]+class="[^"]*product-miniature)/)) {
    if (!block.includes("product-title")) continue;
    const nameM = block.match(/class="[^"]*product-title[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>\s*([^<]+?)\s*<\/a>/);
    if (!nameM) continue;
    const manu = block.match(/class="[^"]*manufacturer[^"]*"[^>]*>\s*([^<]+)</);
    out.push({
      name: nameM[2].trim(),
      field: "(none mapped) manufacturer/url-tail",
      raw: manu?.[1]?.trim() || null,
      url: nameM[1],
      keys: "",
    });
  }
  return out;
}

// --- Sermecoop (PHP + CSRF) ----------------------------------------------
async function sermecoop(q) {
  const HOME = "https://www.farmaciasermecoop.cl/index.php/web/index";
  const homeRes = await get(HOME, { headers: { "User-Agent": UA, Accept: "text/html" } });
  const setCookie = homeRes.headers.get("set-cookie") ?? "";
  const sessionCookie = setCookie.match(/PHPSESSID=[^;,\s]+/)?.[0] ?? "";
  const homeHtml = await homeRes.text();
  const token = (homeHtml.match(/name="fscoopTK_"[^>]*value="([^"]+)"/) ?? homeHtml.match(/value="([^"]+)"[^>]*name="fscoopTK_"/))?.[1] ?? "";
  if (!token) throw new Error("CSRF token not found");
  const res = await get("https://www.farmaciasermecoop.cl/index.php/web/productos?temp=2", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA, Referer: HOME,
      ...(sessionCookie ? { Cookie: sessionCookie } : {}),
    },
    body: new URLSearchParams({ fscoopTK_: token, search_: q, search2_: "" }).toString(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const out = [];
  const verMasRe = /href="(\/index\.php\/online\/detalleproducto\?p_=(\d+)[^"]*)"[^>]*>\s*Ver m.s/g;
  const anchors = [];
  let m;
  while ((m = verMasRe.exec(html)) !== null) {
    if (!anchors.some((a) => a.pid === m[2])) anchors.push({ pid: m[2], index: m.index });
  }
  for (let i = 0; i < anchors.length; i++) {
    const start = i === 0 ? 0 : anchors[i - 1].index + 200;
    const block = html.slice(start, anchors[i].index + 200);
    const h5 = block.match(/<h5[^>]*>([\s\S]+?)<\/h5>/i);
    if (!h5) continue;
    out.push({
      name: h5[1].replace(/<[^>]+>/g, "").trim(),
      field: "(none mapped)",
      raw: null,
      keys: "",
    });
  }
  return out;
}

const SOURCES = {
  "cruz-verde": cruzverde,
  "dr-simi": drsimi,
  araucomed,
  farmex,
  ecofarmacias,
  ahumada,
  easyfarma,
  sermecoop,
};

const out = {};
for (const [slug, fn] of Object.entries(SOURCES)) {
  out[slug] = [];
  for (const q of QUERIES) {
    try {
      const rows = await fn(q);
      for (const r of rows) out[slug].push({ query: q, ...r });
      process.stderr.write(`${slug} ${q}: ${rows.length}\n`);
    } catch (e) {
      process.stderr.write(`${slug} ${q}: ERROR ${e.message}\n`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
}

mkdirSync(new URL("./out/", import.meta.url), { recursive: true });
writeFileSync(new URL("./out/sources.json", import.meta.url), JSON.stringify(out, null, 2));
process.stderr.write("done\n");
