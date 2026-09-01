/**
 * CF-SEARCH-010 — traza detallada del caso que dispara el ticket.
 *
 *   node docs/qa/cf-search-010/scripts/case-ambroxol.mjs [queryId]
 *
 * Imprime, para la consulta indicada (por defecto `ambroxol-30mg`), el listado
 * completo de tarjetas en el ORDEN en que produccion las devuelve, con todos
 * los ejes de identidad recomputados y el slug de ficha que Web emitiria.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOMAIN_DIST =
  process.env.QA_DOMAIN_DIST ?? resolve(HERE, "../../../../packages/domain/dist/index.js");
const {
  matchKey, combinationKey, commercialVariantKey, dosageFormClass,
  unitCountKey, liquidConcentration, concentrationKey, parseQueryIntent,
} = await import(pathToFileURL(DOMAIN_DIST).href);

// Reimplementacion literal de `web/src/lib/medicationSlug.ts` (FNV-1a 64) para
// poder mostrar el slug sin arrastrar el build de Next a este script.
const OFF = 0xcbf29ce484222325n, PRIME = 0x100000001b3n, MASK = 0xffffffffffffffffn;
function shortHash(s) {
  let h = OFF;
  for (let i = 0; i < s.length; i++) { h ^= BigInt(s.charCodeAt(i)); h = (h * PRIME) & MASK; }
  return h.toString(36);
}
const slugify = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const conc = (c) => (c ? concentrationKey(c) : null);

const queryId = process.argv[2] ?? "ambroxol-30mg";
const env = JSON.parse(await readFile(resolve(HERE, "..", "raw", `${queryId}.json`), "utf8"));
const intent = parseQueryIntent(env.query);
const cards = env.body ?? [];

const lines = [];
const push = (s) => { lines.push(s); console.log(s); };

push(`QUERY            : ${JSON.stringify(env.query)}`);
push(`retrievalQuery   : ${JSON.stringify(intent.retrievalQuery)}`);
push(`intent.concentration: ${conc(intent.concentration)}`);
push(`intent.quantity  : ${intent.quantity}`);
push(`intent.dosageForm: ${intent.dosageForm}`);
push(`tarjetas         : ${cards.length}`);
push("");

const rows = [];
cards.forEach((card, i) => {
  const slugHash = shortHash(card.presentationKey);
  const slug = `${slugify(card.canonicalName) || "medicamento"}-${slugHash}`;
  rows.push({
    rank: i + 1,
    canonicalName: card.canonicalName,
    matchKey: card.matchKey,
    presentationKey: card.presentationKey,
    slug,
    slugHash,
    lexicalMatch: card.lexicalMatch ?? null,
    concentrationMatch: card.concentrationMatch ?? null,
    bestPrice: card.bestPrice,
    pharmacies: (card.prices ?? []).map((p) => p.pharmacySlug).join("+"),
    offers: (card.prices ?? []).map((p) => ({
      pharmacy: p.pharmacySlug,
      name: p.productName,
      effective: p.channels?.effective,
      matchKey: matchKey(p.productName),
      combo: combinationKey(p.productName),
      variant: commercialVariantKey(p.productName),
      form: dosageFormClass(p.productName),
      unitCount: unitCountKey(p.productName),
      concentration: conc(liquidConcentration(p.productName)),
    })),
  });
});

for (const r of rows) {
  push(`#${String(r.rank).padStart(3)} [${r.concentrationMatch ?? "-"}/${r.lexicalMatch}] $${r.bestPrice}  ${r.pharmacies}`);
  push(`      name : ${r.canonicalName}`);
  push(`      mk   : ${r.matchKey}`);
  push(`      pk   : ${r.presentationKey}`);
  push(`      slug : ${r.slug}`);
  for (const o of r.offers) {
    push(`      · ${o.pharmacy.padEnd(13)} conc=${String(o.concentration).padEnd(12)} form=${String(o.form).padEnd(11)} qty=${String(o.unitCount).padEnd(5)} var=${String(o.variant).padEnd(12)} | ${o.name}`);
  }
}

// Colisiones de slug dentro de esta consulta.
const byHash = new Map();
for (const r of rows) {
  if (!byHash.has(r.slugHash)) byHash.set(r.slugHash, []);
  byHash.get(r.slugHash).push(r);
}
const collisions = [...byHash.entries()].filter(([, v]) => v.length > 1);
push("");
push(`COLISIONES DE HASH DE SLUG: ${collisions.length}`);
for (const [h, v] of collisions) {
  push(`  hash ${h}:`);
  for (const r of v) push(`    - ${r.canonicalName}  (pk ${r.presentationKey})`);
}

await mkdir(resolve(HERE, "..", "analysis"), { recursive: true });
await writeFile(resolve(HERE, "..", "analysis", `case-${queryId}.json`),
  JSON.stringify({ query: env.query, intent: { retrievalQuery: intent.retrievalQuery, concentration: conc(intent.concentration), quantity: intent.quantity, dosageForm: intent.dosageForm }, cards: rows, slugCollisions: collisions.map(([h, v]) => ({ hash: h, cards: v.map((r) => ({ canonicalName: r.canonicalName, presentationKey: r.presentationKey })) })) }, null, 2), "utf8");
await writeFile(resolve(HERE, "..", "analysis", `case-${queryId}.txt`), lines.join("\n"), "utf8");
