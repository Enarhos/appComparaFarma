/**
 * CF-SEARCH-011 S0 — inspector de un nombre suelto contra el pipeline v2.
 *
 *   node docs/qa/cf-search-011/scripts/debug-case.mjs "Ambroxol 30mg/5ml Jarabe 100ml" [...]
 *
 * Imprime los atributos canonicos y las tres firmas de identidad de cada nombre,
 * y la comparacion de concentracion entre todos los pares. Es la herramienta que
 * responde "por que estas dos ofertas terminaron en el mismo productId".
 */
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../../../..");
const V2 = await import(
  pathToFileURL(process.env.QA_DOMAIN_V2_DIST ?? resolve(ROOT, "packages/domain/dist/searchV2/index.js")).href
);

const names = process.argv.slice(2);
if (names.length === 0) {
  console.error("uso: debug-case.mjs \"<nombre>\" [\"<nombre>\" ...]");
  process.exit(1);
}

const inputs = names.map((rawName, i) => ({
  pharmacy: `p${i}`,
  rawName,
  price: { store: 0, online: null, cmr: null, sbpay: null, effective: 0 },
  stock: null,
  url: null,
  capturedAt: new Date(0).toISOString(),
}));

const graph = V2.canonicalize(inputs);

for (const offer of graph.offers) {
  const attributes = V2.canonicalizeOffer(
    inputs.find((i) => i.rawName === offer.rawName)
  );
  console.log("-".repeat(78));
  console.log(offer.rawName);
  console.log("  ingredients :", attributes.activeIngredients.map((x) => `${x.token}(${x.evidence})`).join(", ") || "-");
  console.log("  concentration:", attributes.concentration.kind, V2.concentrationSignature(attributes.concentration));
  console.log("  form/route  :", attributes.dosageForm, "/", attributes.route);
  console.log("  qty / volume:", attributes.packageQuantity, "/", attributes.packageVolume ? `${attributes.packageVolume.value}${attributes.packageVolume.unit}` : "-");
  console.log("  brand/var/mfr:", attributes.brand, "/", attributes.commercialVariant, "/", attributes.manufacturer);
  console.log("  conceptId   :", offer.conceptId, "|", offer.provenance.resolution.concept.kind);
  console.log("    signature :", offer.provenance.resolution.concept.signature);
  console.log("    raw       :", offer.provenance.resolution.concept.rawSignature);
  console.log("  presentation:", offer.presentationId, "|", offer.provenance.resolution.presentation.kind);
  console.log("    signature :", offer.provenance.resolution.presentation.signature);
  console.log("  productId   :", offer.productId, "|", offer.provenance.resolution.product.kind);
  console.log("    signature :", offer.provenance.resolution.product.signature);
}

console.log("-".repeat(78));
for (let i = 0; i < inputs.length; i++) {
  for (let j = i + 1; j < inputs.length; j++) {
    const a = V2.canonicalizeOffer(inputs[i]);
    const b = V2.canonicalizeOffer(inputs[j]);
    console.log(
      `conc[${i}] vs conc[${j}] =`,
      V2.compareConcentration(a.concentration, b.concentration)
    );
  }
}
