/**
 * CF-QA-001 — Test 6 (navegacion tarjeta -> ficha) contra Web de produccion.
 *
 * Uso:  node docs/qa/search-product-identity/analysis/nav-check.mjs
 *
 * Solo GET publicos y read-only. Ninguna accion transaccional: NO se sigue el
 * redirect de `/api/go` hasta la farmacia y NO se agrega nada a un carro.
 *
 * Para cada query: lee /buscar/<query>, toma las primeras N fichas enlazadas,
 * y de cada ficha lee el JSON-LD (`@type: Product`) que la propia pagina
 * publica. Compara el titulo de la ficha y sus ofertas contra la tarjeta
 * equivalente de /api/search.
 *
 * Salida: nav-check.json
 */
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB = "https://www.preciosfarma.cl";
const API = "https://comparafarma-api.vercel.app/api/search";

const QUERIES = ["diclofenaco", "tapsin", "ambroxol", "clotrimazol"];
const PER_QUERY = 4;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function jsonLdProduct(html) {
  const blocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) ?? [];
  for (const b of blocks) {
    const body = b.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    try {
      const o = JSON.parse(body);
      if (o["@type"] === "Product") return o;
    } catch { /* bloque no-JSON, se ignora */ }
  }
  return null;
}

async function main() {
  const report = [];
  for (const query of QUERIES) {
    const apiRes = await fetch(`${API}?q=${encodeURIComponent(query)}`);
    const cards = await apiRes.json();

    const searchHtml = await (await fetch(`${WEB}/buscar/${encodeURIComponent(query)}`)).text();
    const slugs = [...new Set((searchHtml.match(/\/medicamento\/[a-z0-9-]+/g) ?? []))].slice(0, PER_QUERY);

    for (const slug of slugs) {
      const url = `${WEB}${slug}`;
      const started = new Date().toISOString();
      const res = await fetch(url);
      const html = await res.text();
      const ld = jsonLdProduct(html);
      const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) ?? [])[1]?.replace(/<[^>]*>/g, "").trim() ?? null;

      const ldOffers = ld?.offers?.offers ?? [];
      const sellers = ldOffers.map((o) => ({
        seller: o.seller?.name ?? null,
        price: o.price ?? null,
        slug: (() => { try { return new URL(o.url).searchParams.get("slug"); } catch { return null; } })(),
        matchKey: (() => { try { return new URL(o.url).searchParams.get("matchKey"); } catch { return null; } })(),
      }));

      // Tarjeta del API cuyo canonicalName coincide con el titulo de la ficha.
      const apiCard = cards.find?.((c) => c.canonicalName === (ld?.name ?? h1)) ?? null;

      report.push({
        query,
        detailUrl: url,
        fetchedAt: started,
        httpStatus: res.status,
        h1,
        jsonLdName: ld?.name ?? null,
        titleMatchesH1: ld ? ld.name === h1 : null,
        detailOfferCount: ldOffers.length,
        detailOffers: sellers,
        // Todas las ofertas de la ficha declaran el MISMO matchKey?
        detailMatchKeys: [...new Set(sellers.map((s) => s.matchKey))],
        apiCardFound: Boolean(apiCard),
        apiCardMatchKey: apiCard?.matchKey ?? null,
        apiCardPresentationKey: apiCard?.presentationKey ?? null,
        apiCardOffers: apiCard?.prices.map((p) => ({ pharmacy: p.pharmacySlug, price: p.channels.effective, name: p.productName })) ?? null,
      });
      await sleep(800);
    }
  }
  await writeFile(join(HERE, "nav-check.json"), JSON.stringify(report, null, 1), "utf8");
  for (const r of report) {
    console.log(`${r.httpStatus} ${r.detailUrl}\n   h1=${JSON.stringify(r.h1)} offers=${r.detailOfferCount} matchKeys=${JSON.stringify(r.detailMatchKeys)} apiCard=${r.apiCardFound}`);
  }
}

main();
