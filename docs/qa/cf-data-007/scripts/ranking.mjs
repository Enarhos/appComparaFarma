/**
 * CF-DATA-007 — VEREDICTO POR CANDIDATO (Pasos 3, 4 y 5) Y `before-after.json`.
 *
 *   node docs/qa/cf-data-007/scripts/ranking.mjs
 *
 * ---------------------------------------------------------------------------
 * LAS CUATRO FUENTES DE EVIDENCIA ADMITIDAS, Y SOLO ÉSTAS
 * ---------------------------------------------------------------------------
 *   (1) REGLA DE DERIVACIÓN DE CF-DATA-001 sobre el corpus congelado: el token
 *       acompaña a >= 2 CABECERAS DE MARCA distintas en >= 2 farmacias
 *       distintas, no aparece en el campo estructurado de fabricante, y antecede
 *       a una dosis en el segmento descriptivo. La calcula `candidates.mjs`.
 *
 *   (2) SEPARADOR EXPLÍCITO: `combinationKey()` (v1, sin modificar) devuelve el
 *       token como segundo principio activo en algún nombre del corpus. Es el
 *       criterio (E1) de `V2_MOLECULE_VOCABULARY`.
 *
 *   (3) VOCABULARIO FARMACOLÓGICO YA VALIDADO EN EL PROYECTO:
 *       `KNOWN_ACTIVE_INGREDIENTS` (commercialIdentity.ts, auditoría de
 *       producción FASE P1 del 2026-08-19) y `COMPOSITION_TOKENS`
 *       (productIdentity.ts, 9 búsquedas de producción del 2026-08-27). Los dos
 *       sostienen comportamiento de v1 hoy. Es el criterio (E2).
 *
 *   (4) REGISTRO SANITARIO ISP — **NO SE USA**. ADR-0005 la declara *en
 *       revisión* y el issue #157 sigue abierto; el ticket prohíbe usarla como
 *       autoridad única y ningún adaptador la captura todavía. Se deja
 *       enumerada para que su ausencia sea una decisión explícita, no un olvido.
 *
 * VEREDICTOS
 *   APPROVE — al menos una fuente ADMITIDA lo sostiene y ninguna clase de riesgo
 *             lo descarta.
 *   REJECT  — pertenece a una clase de riesgo (marca, laboratorio, descriptor,
 *             saborizante, régimen, sal, errata). Nunca entra al vocabulario.
 *   REVIEW  — es plausiblemente una molécula, pero NINGUNA fuente admitida la
 *             sostiene. No se implementa: `UNKNOWN` es mejor que inventar.
 *             Requiere dato externo → alimenta `MORE_DATA_REQUIRED`.
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../../../..");
const OUT_DIR = resolve(HERE, "..", "analysis");
const DOC_DIR = resolve(HERE, "..");

const DOMAIN_DIST = process.env.QA_DOMAIN_DIST ?? resolve(ROOT, "packages/domain/dist/index.js");
const DOMAIN_V2_DIST =
  process.env.QA_DOMAIN_V2_DIST ?? resolve(ROOT, "packages/domain/dist/searchV2/index.js");

const { COMPOSITION_VOCABULARY } = await import(pathToFileURL(DOMAIN_DIST).href);
const { V2_MOLECULE_VOCABULARY, ION_AND_SALT_TOKENS } = await import(
  pathToFileURL(DOMAIN_V2_DIST).href
);
// `KNOWN_ACTIVE_INGREDIENTS` no se re-exporta desde `index.ts`; se importa de su
// propio módulo para no ampliar la superficie pública del paquete solo para un
// script de medición.
const { KNOWN_ACTIVE_INGREDIENTS } = await import(
  pathToFileURL(resolve(ROOT, "packages/domain/dist/commercialIdentity.js")).href
);

/**
 * Fuente (3). `COMPOSITION_TOKENS` es privado de `productIdentity.ts`; se
 * reproduce acá su contenido EXACTO para poder auditarlo sin ampliar la
 * superficie pública de ese módulo. Si aquel cambia, este script deja de
 * reflejarlo — por eso el veredicto también se corrobora contra el corpus.
 */
const PROJECT_VALIDATED_INN = new Set([
  ...KNOWN_ACTIVE_INGREDIENTS,
  "acetilsalicilico", "salicilico", "clavulanico", "clavulanato",
  "metformina", "hidroclorotiazida", "pseudoefedrina", "clorfenamina",
  "salbutamol", "cafeina", "naproxeno", "ketoprofeno", "diclofenaco",
  "cetirizina", "loratadina", "enalapril", "atorvastatina", "sertralina",
]);

/**
 * Clases de riesgo medidas sobre el residual. Cada token está acá porque se
 * observó en el corpus junto a una dosis: si el veredicto se decidiera solo por
 * cercanía a una cifra, TODOS habrían entrado al vocabulario.
 */
const RISK_CLASSES = {
  brand: {
    label: "MARCA o variante comercial",
    tokens: ["actron", "gesidol", "ellipta", "advance", "maximox", "panadol", "tapsin", "zomel", "lomex"],
  },
  manufacturer: {
    label: "LABORATORIO o etiqueta comercial",
    tokens: ["opko", "cenabast", "curaspring", "maver", "chile", "descuento", "arrugada"],
  },
  descriptor: {
    label: "DESCRIPTOR de forma, envase, vía o fabricación",
    tokens: [
      "recubrimiento", "enterico", "pastillas", "disolucion", "bucal", "caps", "susp",
      "prolongadas", "blister", "dermico", "oftalmologica", "efervecente", "suspencion",
      "retard", "solvente", "displ", "nocturno", "insta", "instaflu", "caliente",
    ],
  },
  flavour: {
    label: "SABORIZANTE o excipiente",
    tokens: ["miel", "limon", "limonada", "jengibre", "frambuesa", "fresa", "sabor"],
  },
  regimen: {
    label: "RÉGIMEN posológico o indicación",
    tokens: ["triterapia", "compuesto", "antigripal", "migrana", "periodo", "mujer", "ninos", "analgesico", "puro", "rehidratacion"],
  },
  salt: {
    label: "SAL, ion o calificador químico",
    tokens: ["epolamina", "resinato", "bromuro", "potsico", "acido"],
  },
  typo: {
    label: "ERRATA de escritura de la farmacia",
    tokens: ["parcetamol", "clauvulancio", "potsico", "pseudofedrina", "lorsartan"],
  },
};

const RISK_OF = new Map();
for (const [klass, { tokens }] of Object.entries(RISK_CLASSES)) {
  for (const token of tokens) if (!RISK_OF.has(token)) RISK_OF.set(token, klass);
}

/** Controles positivos obligatorios del ticket. */
const POSITIVE_CONTROLS = [
  "omeprazol", "tramadol", "paracetamol", "ibuprofeno", "diclofenaco", "losartan",
  "hidroclorotiazida", "amoxicilina", "clavulanico", "ambroxol", "cetirizina",
];

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function main() {
  const candidates = JSON.parse(await readFile(resolve(OUT_DIR, "candidates.json"), "utf8"));
  const censusAfter = JSON.parse(await readFile(resolve(OUT_DIR, "census-full.json"), "utf8"));

  // Presencia en el corpus de CADA candidato, contada sobre el nombre completo
  // (no solo en la posición pre-dosis que mira `candidates.mjs`). Es lo que
  // revela el punto ciego de la fuente (1) con los genéricos.
  const corpus = new Map();
  for (const row of censusAfter) {
    for (const word of new Set(row.words)) {
      const entry = corpus.get(word) ?? { observations: 0, pharmacies: new Set() };
      entry.observations += 1;
      entry.pharmacies.add(row.pharmacy);
      corpus.set(word, entry);
    }
  }

  const verdicts = [];
  for (const candidate of candidates) {
    const token = candidate.token;
    const inCorpus = corpus.get(token) ?? { observations: 0, pharmacies: new Set() };

    const source1 = candidate.passesCfData001Rule;
    const source2 = V2_MOLECULE_VOCABULARY.has(token) || COMPOSITION_VOCABULARY.has(token);
    const source3 = PROJECT_VALIDATED_INN.has(token);
    const risk = RISK_OF.get(token) ?? (ION_AND_SALT_TOKENS.has(token) ? "salt" : null);

    let verdict;
    let rationale;
    if (risk !== null) {
      verdict = "REJECT";
      rationale = `clase de riesgo: ${RISK_CLASSES[risk]?.label ?? risk}`;
    } else if (source1 || source2 || source3) {
      verdict = "APPROVE";
      const sources = [];
      if (source1) sources.push("(1) regla CF-DATA-001");
      if (source2) sources.push("(2) separador explícito / ya en vocabulario");
      if (source3) sources.push("(3) vocabulario validado del proyecto");
      rationale = `sostenido por ${sources.join(" + ")}`;
    } else {
      verdict = "REVIEW";
      rationale = "ninguna fuente admitida lo sostiene: requiere dato externo";
    }

    verdicts.push({
      token,
      verdict,
      rationale,
      alreadyInVocabulary: COMPOSITION_VOCABULARY.has(token) || V2_MOLECULE_VOCABULARY.has(token),
      source1CfData001: source1,
      source2Separator: source2,
      source3ProjectVocabulary: source3,
      source4Isp: "not-used (ADR-0005 en revisión, issue #157)",
      riskClass: risk,
      distinctHeads: candidate.distinctHeads,
      distinctPharmaciesPreDose: candidate.distinctPharmacies,
      offersPreDose: candidate.offers,
      corpusObservations: inCorpus.observations,
      corpusPharmacies: inCorpus.pharmacies.size,
      sampleName: candidate.names[0] ?? "",
    });
  }

  // Tokens con forma de molécula del residual que NO llegan a `candidates.json`
  // (no anteceden a una dosis) pero que igual hay que dictaminar.
  const extra = ["esomeprazol", "flurbiprofeno", "tibolona", "dutasteride", "tamsulosina", "colecalciferol", "bromhexina"];
  for (const token of extra) {
    if (verdicts.some((v) => v.token === token)) continue;
    const inCorpus = corpus.get(token) ?? { observations: 0, pharmacies: new Set() };
    const source3 = PROJECT_VALIDATED_INN.has(token);
    const source2 = V2_MOLECULE_VOCABULARY.has(token) || COMPOSITION_VOCABULARY.has(token);
    verdicts.push({
      token,
      verdict: source2 || source3 ? "APPROVE" : "REVIEW",
      rationale: source3
        ? "sostenido por (3) vocabulario validado del proyecto"
        : source2
          ? "sostenido por (2) ya en vocabulario"
          : "ninguna fuente admitida lo sostiene: requiere dato externo",
      alreadyInVocabulary: source2,
      source1CfData001: false,
      source2Separator: source2,
      source3ProjectVocabulary: source3,
      source4Isp: "not-used (ADR-0005 en revisión, issue #157)",
      riskClass: null,
      distinctHeads: 0,
      distinctPharmaciesPreDose: 0,
      offersPreDose: 0,
      corpusObservations: inCorpus.observations,
      corpusPharmacies: inCorpus.pharmacies.size,
      sampleName: "",
    });
  }

  verdicts.sort(
    (a, b) =>
      a.verdict.localeCompare(b.verdict) ||
      b.corpusObservations - a.corpusObservations ||
      a.token.localeCompare(b.token)
  );

  const counts = { APPROVE: 0, REJECT: 0, REVIEW: 0 };
  for (const v of verdicts) counts[v.verdict] += 1;

  console.log(`CANDIDATOS DICTAMINADOS: ${verdicts.length}`);
  console.log(`  APPROVE=${counts.APPROVE}  REJECT=${counts.REJECT}  REVIEW=${counts.REVIEW}`);
  console.log("");
  console.log("token".padEnd(18) + "veredicto  s1 s2 s3  obs  farm  motivo");
  for (const v of verdicts) {
    console.log(
      v.token.padEnd(18) +
        v.verdict.padEnd(10) +
        ` ${v.source1CfData001 ? "Y" : "-"}  ${v.source2Separator ? "Y" : "-"}  ${v.source3ProjectVocabulary ? "Y" : "-"}` +
        ` ${String(v.corpusObservations).padStart(4)}  ${String(v.corpusPharmacies).padStart(4)}  ${v.rationale}`
    );
  }

  // --- PASO 4: ningún caso negativo obligatorio puede estar APPROVE ----------
  const MANDATORY_NEGATIVES = [
    "tapsin", "zomel", "sodico", "potasico", "diclorhidrato", "clorhidrato",
    "acido", "miel", "limon", "sabor", "triterapia", "comprimido", "capsula",
    "jarabe", "crema", "gel", "sobre", "frasco", "actron", "panadol", "lomex",
  ];
  const leaked = verdicts.filter(
    (v) => v.verdict === "APPROVE" && MANDATORY_NEGATIVES.includes(v.token)
  );
  console.log("");
  console.log(`PASO 4 — casos negativos obligatorios colados en APPROVE: ${leaked.length}`);
  if (leaked.length > 0) console.log("  " + leaked.map((v) => v.token).join(", "));

  // --- PASO 5: controles positivos ------------------------------------------
  const vocabulary = new Set([...COMPOSITION_VOCABULARY, ...V2_MOLECULE_VOCABULARY]);
  console.log("");
  console.log("PASO 5 — controles positivos obligatorios");
  const controls = POSITIVE_CONTROLS.map((token) => {
    const inCorpus = corpus.get(token) ?? { observations: 0, pharmacies: new Set() };
    const read = censusAfter.filter((r) => r.ingredients.includes(token)).length;
    const ok = vocabulary.has(token) && (inCorpus.observations === 0 || read > 0);
    console.log(
      `  ${token.padEnd(20)} vocab=${vocabulary.has(token) ? "Y" : "N"}  observaciones=${String(inCorpus.observations).padStart(3)}  leidoComoIng=${String(read).padStart(3)}  ${ok ? "PASS" : "FAIL"}`
    );
    return { token, inVocabulary: vocabulary.has(token), corpusObservations: inCorpus.observations, readAsIngredient: read, pass: ok };
  });

  // --- artefactos -----------------------------------------------------------
  const header = [
    "token", "verdict", "rationale", "riskClass", "source1CfData001",
    "source2Separator", "source3ProjectVocabulary", "source4Isp",
    "alreadyInVocabulary", "distinctHeads", "distinctPharmaciesPreDose",
    "offersPreDose", "corpusObservations", "corpusPharmacies", "sampleName",
  ];
  const csv = [header.join(",")];
  for (const v of verdicts) csv.push(header.map((h) => csvCell(v[h])).join(","));
  await writeFile(resolve(DOC_DIR, "candidate-ranking.csv"), csv.join("\n") + "\n", "utf8");

  await writeFile(
    resolve(OUT_DIR, "verdicts.json"),
    JSON.stringify({ counts, verdicts, positiveControls: controls, mandatoryNegativeLeaks: leaked.map((v) => v.token) }, null, 2),
    "utf8"
  );

  console.log("");
  console.log("escrito: docs/qa/cf-data-007/candidate-ranking.csv");
  console.log("escrito: docs/qa/cf-data-007/analysis/verdicts.json");
}

await main();
