/**
 * CF-WEB-002 — arnés de reproducción y QA A/B de la navegación
 * "resultado de búsqueda → ficha de medicamento".
 *
 * QUÉ MIDE
 * --------
 * Para cada `MedicationResult` que devuelve `/api/search` hoy:
 *   1. genera el enlace EXACTO que emite Web (`buildMedicationSlug`, código
 *      real de `web/src/lib/medicationSlug.ts`);
 *   2. lo resuelve con el mecanismo EXACTO de `/medicamento/[slug]`
 *      (`resolveMedicationBySlug`, código real de
 *      `web/src/lib/resolveMedication.ts`, que ejecuta su propia búsqueda en
 *      vivo contra el mismo API);
 *   3. clasifica el resultado y comprueba el invariante de navegación
 *      (§ INVARIANTE, más abajo) con `isSameProduct()` de @comparafarma/domain
 *      — la MISMA función que `deduplication.ts` usa para decidir
 *      SAME_PRODUCT, no un criterio inventado para el QA.
 *
 * INVARIANTE
 * ----------
 *   Para todo R emitido por una búsqueda Web:
 *     resolveMedicationBySlug(medicationSlug(R)) debe devolver R o una
 *     representación SAME_PRODUCT inequívocamente equivalente.
 *
 * Clasificación por enlace:
 *   RESOLVED_EXACT         — resuelve al mismo producto, sin redirect.
 *   REDIRECTED             — resuelve al mismo producto vía generación antigua
 *                            (`needsRedirect`) → 301 determinista al canónico.
 *   RESOLVED_WRONG_PRODUCT — resuelve, pero a OTRO producto. Cero tolerancia.
 *   AMBIGUOUS              — el hash del slug matchea 2+ productos → la ficha
 *                            responde 404 ("Medicamento no encontrado").
 *   NOT_FOUND              — ningún candidato → 404.
 *   ERROR                  — el API no respondió (no es un fallo de identidad).
 *
 * ANÁLISIS ESTÁTICO DE POBLACIÓN COMPLETA
 * ---------------------------------------
 * Además del muestreo en vivo, el arnés calcula sobre el 100 % de las tarjetas
 * de cada búsqueda cuántos enlaces son IRRESOLUBLES POR CONSTRUCCIÓN: dos
 * tarjetas distintas de la MISMA respuesta que generan el mismo hash de slug.
 * Eso no depende de la red ni del muestreo y es reproducible sobre `raw/`.
 *
 * USO
 *   node docs/qa/cf-web-002/scripts/nav-audit.mjs --label baseline
 *   node docs/qa/cf-web-002/scripts/nav-audit.mjs --label fixed
 *
 * Opciones: --label <nombre> · --sample <n por consulta> · --queries a,b,c
 *           --reuse-raw (no vuelve a pedir /api/search, usa raw/<label>/)
 *
 * Solo hace GET a `/api/search`. No envía secretos, no usa `?debug=1`, no
 * escribe en ninguna base de datos del proyecto.
 */
import { register } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const QA_DIR = join(HERE, "..");
const REPO = join(QA_DIR, "..", "..", "..");
const API_URL = (process.env.API_URL ?? "https://comparafarma-api.vercel.app").replace(/\/$/, "");

// El módulo real de Web lee `process.env.API_URL` al cargarse.
process.env.API_URL = API_URL;

/**
 * Raíz de `web/src` a auditar. Por defecto la del worktree; con `--web-src` se
 * apunta a una copia de OTRA revisión (ej. `origin/main`) para medir la línea
 * base con EXACTAMENTE el mismo arnés, el mismo corpus y la misma
 * clasificación. Es lo que hace comparable el A/B: la única variable es el
 * código del resolver.
 */
function argValue(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const WEB_SRC = argValue("web-src", join(REPO, "web", "src"));
process.env.CF_WEB_SRC = WEB_SRC;
register(pathToFileURL(join(HERE, "alias-hook.mjs")));

const { buildMedicationSlug } = await import(pathToFileURL(join(WEB_SRC, "lib/medicationSlug.ts")).href);
const { resolveMedicationBySlug } = await import(pathToFileURL(join(WEB_SRC, "lib/resolveMedication.ts")).href);
const {
  bioequivalenceKey,
  combinationKey,
  commercialVariantKey,
  concentrationKey,
  dosageFormClass,
  isSameProduct,
  liquidConcentration,
  matchKey,
  unitCountKey,
  // `packages/domain/dist` — el JS compilado por `postinstall`, el mismo
  // artefacto que consumen `web`/`api` (ver CLAUDE.md §11). El script vive en
  // `docs/`, fuera de cualquier paquete, así que se importa por ruta.
} = await import(pathToFileURL(join(REPO, "packages/domain/dist/index.js")).href);

// Bloque A del ticket + las consultas que cubren los 7 casos de CF-QA-001
// (diclofenaco, tapsin, clotrimazol, glicerina) + los líquidos de CF-SEARCH-003.
const DEFAULT_QUERIES = [
  "tapsin", "ambroxol", "ibuprofeno", "betametasona", "diclofenaco",
  "amoxicilina", "paracetamol", "losartan", "omeprazol", "metformina",
  "clorfenamina", "cetirizina", "naproxeno", "loratadina",
  "clotrimazol", "glicerina",
];

// Los 7 enlaces muertos de CF-QA-001 (QA-SEARCH-002), tal cual quedaron
// registrados. Se reintentan como slugs históricos.
const CF_QA_001_DEAD_SLUGS = [
  "diclofenaco-retard-100-mg-x-8-capsulas-opko-1l4aourepmu3b",
  "tapsin-x-6-comprimidos-noche-maver-3a14ey6g56zgt",
  "tapsin-x-6-comprimidos-maver-jfz5p0p85x6n",
  "tapsin-forte-x-6-comprimidos-recubiertos-2tz36rk5hze2s",
  "clotrimazol-crema-topica-al-1-x-20-g-surfarma-23poitc26mv6o",
  "clotrimazol-crema-topica-1-20g-ethon-cenabast-11k1hgfzyyees",
  "ballerina-jabon-de-glicerina-750-ml-1gno4wnnjz0xe",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const LABEL = arg("label", "baseline");
const SAMPLE = Number(arg("sample", "8"));
const REUSE_RAW = process.argv.includes("--reuse-raw");
// El corpus FUENTE del A/B debe ser idéntico antes y después: la corrida
// "fixed" reutiliza el `raw/` capturado por la corrida "baseline", así que los
// enlaces generados son exactamente los mismos y la única variable es el
// resolver. (Las búsquedas que hace el resolver sí son en vivo — no se pueden
// congelar sin dejar de medir el mecanismo real.)
const RAW_LABEL = arg("raw-label", LABEL);
const QUERIES = arg("queries", "").length > 0 ? arg("queries", "").split(",") : DEFAULT_QUERIES;

/**
 * `ProductIdentity` reconstruida desde una tarjeta ya fusionada. Los ejes
 * derivados del nombre se recalculan con las MISMAS funciones del dominio; la
 * marca se lee del segmento `|brand:` de `presentationKey` (ya resuelta por el
 * API con la evidencia de la oferta, que la tarjeta no reexpone).
 */
function identityOf(card) {
  const name = card.canonicalName;
  const brand = /\|brand:([^|]*)/.exec(card.presentationKey ?? "")?.[1] ?? "unknown";
  return {
    pharmacologicalKey: matchKey(name),
    bioequivalence: bioequivalenceKey(card.isBioequivalent),
    commercialIdentity: brand,
    combination: combinationKey(name),
    commercialVariant: commercialVariantKey(name),
    dosageForm: dosageFormClass(name),
    unitCount: unitCountKey(name),
    concentration: liquidConcentration(name),
  };
}

/** SAME_PRODUCT: misma `presentationKey` Y ningún eje de identidad contradicho. */
function sameProduct(a, b) {
  if (a.presentationKey !== b.presentationKey) return false;
  return isSameProduct(identityOf(a), identityOf(b));
}

function describe(card) {
  const id = identityOf(card);
  return {
    canonicalName: card.canonicalName,
    matchKey: card.matchKey,
    presentationKey: card.presentationKey,
    cfmId: card.cfmId ?? null,
    laboratory: card.laboratory,
    isBioequivalent: card.isBioequivalent,
    commercialVariantKey: id.commercialVariant,
    dosageFormClass: id.dosageForm,
    unitCountKey: id.unitCount,
    concentration: id.concentration ? concentrationKey(id.concentration) : null,
    combinationKey: id.combination,
    pharmacies: card.prices?.map((p) => p.pharmacySlug) ?? [],
  };
}

async function fetchSearch(query) {
  const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`/api/search?q=${query} → HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const rawDir = join(QA_DIR, "raw", RAW_LABEL);
  const analysisDir = join(QA_DIR, "analysis");
  await mkdir(rawDir, { recursive: true });
  await mkdir(analysisDir, { recursive: true });

  const startedAt = new Date().toISOString();
  const rows = [];
  const staticFindings = [];
  let totalSearchResults = 0;

  for (const query of QUERIES) {
    let results;
    const rawPath = join(rawDir, `${query.replace(/\s+/g, "-")}.json`);
    if (REUSE_RAW) {
      results = JSON.parse(await readFile(rawPath, "utf8")).results;
    } else {
      results = await fetchSearch(query);
      await writeFile(rawPath, JSON.stringify({ query, apiUrl: API_URL, fetchedAt: new Date().toISOString(), results }, null, 1), "utf8");
      await sleep(1200);
    }
    totalSearchResults += results.length;

    // --- Análisis estático sobre la población COMPLETA de la respuesta ---
    const byHash = new Map();
    for (const card of results) {
      const slug = buildMedicationSlug(card);
      const hash = slug.slice(slug.lastIndexOf("-") + 1);
      if (!byHash.has(hash)) byHash.set(hash, []);
      byHash.get(hash).push(card);
    }
    for (const [hash, cards] of byHash) {
      if (cards.length > 1) {
        staticFindings.push({
          query,
          hash,
          count: cards.length,
          allSamePresentationKey: new Set(cards.map((c) => c.presentationKey)).size === 1,
          allSameProduct: cards.every((c) => sameProduct(cards[0], c)),
          cards: cards.map(describe),
        });
      }
    }

    // --- Muestreo determinista para resolución en vivo ---
    // Se prioriza que la muestra contenga las tarjetas involucradas en una
    // colisión estática (son las candidatas a fallar) y luego se completa con
    // las primeras tarjetas del orden que Web muestra al usuario.
    const colliding = [...byHash.values()].filter((c) => c.length > 1).flat();
    const sample = [...new Set([...colliding, ...results])].slice(0, SAMPLE);

    for (const card of sample) {
      const slug = buildMedicationSlug(card);
      const row = {
        query,
        source: describe(card),
        generatedSlug: slug,
        generatedURL: `/medicamento/${slug}`,
        resolverSearchQuery: slug.slice(0, slug.lastIndexOf("-")).replace(/-/g, " "),
      };
      try {
        const resolution = await resolveMedicationBySlug(slug);
        row.resolverStatus = resolution.status;
        if (resolution.status === "ok") {
          row.resolved = describe(resolution.medication);
          row.needsRedirect = resolution.needsRedirect;
          row.canonicalSlug = resolution.canonicalSlug;
          const same = sameProduct(card, resolution.medication);
          row.classification = same
            ? resolution.needsRedirect ? "REDIRECTED" : "RESOLVED_EXACT"
            : "RESOLVED_WRONG_PRODUCT";
        } else if (resolution.status === "ambiguous") {
          row.resolverCandidates = resolution.matches.map(describe);
          row.classification = "AMBIGUOUS";
        } else {
          row.classification = "NOT_FOUND";
        }
      } catch (err) {
        row.classification = "ERROR";
        row.error = String(err?.message ?? err);
      }
      console.log(`${row.classification.padEnd(22)} ${query.padEnd(14)} ${slug}`);
      rows.push(row);
      await sleep(1200);
    }
  }

  // --- Slugs históricos de CF-QA-001 ---
  const legacy = [];
  for (const slug of CF_QA_001_DEAD_SLUGS) {
    const row = { slug, url: `/medicamento/${slug}` };
    try {
      const resolution = await resolveMedicationBySlug(slug);
      row.resolverStatus = resolution.status;
      if (resolution.status === "ok") {
        row.resolved = describe(resolution.medication);
        row.needsRedirect = resolution.needsRedirect;
        row.canonicalSlug = resolution.canonicalSlug;
        row.classification = resolution.needsRedirect ? "REDIRECTED" : "RESOLVED_EXACT";
      } else {
        row.classification = resolution.status === "ambiguous" ? "AMBIGUOUS" : "NOT_FOUND";
      }
    } catch (err) {
      row.classification = "ERROR";
      row.error = String(err?.message ?? err);
    }
    console.log(`[legacy] ${row.classification.padEnd(22)} ${slug}`);
    legacy.push(row);
    await sleep(1200);
  }

  const count = (label) => rows.filter((r) => r.classification === label).length;
  const generated = rows.length;
  const summary = {
    label: LABEL,
    apiUrl: API_URL,
    startedAt,
    finishedAt: new Date().toISOString(),
    queries: QUERIES.length,
    totalSearchResults,
    generatedDetailURLs: generated,
    resolvedExact: count("RESOLVED_EXACT"),
    redirected: count("REDIRECTED"),
    resolvedWrongProduct: count("RESOLVED_WRONG_PRODUCT"),
    ambiguous: count("AMBIGUOUS"),
    notFound: count("NOT_FOUND"),
    error: count("ERROR"),
    resolutionRate: +(((count("RESOLVED_EXACT") + count("REDIRECTED")) / generated) * 100).toFixed(1),
    wrongProductRate: +((count("RESOLVED_WRONG_PRODUCT") / generated) * 100).toFixed(1),
    notFoundRate: +(((count("NOT_FOUND") + count("AMBIGUOUS")) / generated) * 100).toFixed(1),
    staticCollisions: staticFindings.length,
    staticCollidingCards: staticFindings.reduce((a, f) => a + f.count, 0),
    legacyResolved: legacy.filter((r) => r.classification === "REDIRECTED" || r.classification === "RESOLVED_EXACT").length,
    legacyTotal: legacy.length,
  };

  await writeFile(join(analysisDir, `${LABEL}.json`), JSON.stringify({ summary, staticFindings, rows, legacy }, null, 1), "utf8");
  const csv = ["classification,query,generatedURL,sourcePresentationKey,resolvedPresentationKey,resolverSearchQuery"];
  for (const r of rows) {
    csv.push([r.classification, r.query, r.generatedURL, r.source.presentationKey, r.resolved?.presentationKey ?? "", `"${r.resolverSearchQuery}"`].join(","));
  }
  await writeFile(join(analysisDir, `urls-${LABEL}.csv`), csv.join("\n"), "utf8");
  console.log(JSON.stringify(summary, null, 2));
}

await main();
