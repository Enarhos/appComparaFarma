/**
 * CF-SEARCH-010 — sonda read-only de la fuente regulatoria (ISP / datos.gob.cl).
 *
 *   node docs/qa/cf-search-010/scripts/probe-isp.mjs
 *
 * SOLO investiga viabilidad y cobertura. No integra nada, no persiste nada en
 * el producto, no toca ningun adaptador. Existe para que la conclusion del
 * documento sobre "fuente de verdad regulatoria" sea reproducible y no una
 * afirmacion de memoria.
 *
 * Salida: analysis/isp-source-probe.json
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, "..", "analysis");

const RESOURCE_ID = "93df17ca-b694-4697-96b2-3dae87d9761d"; // dataset 1303 del ISP
const DATASTORE = `https://datos.gob.cl/api/3/action/datastore_search?resource_id=${RESOURCE_ID}&limit=5`;
const CSV =
  "https://datos.gob.cl/dataset/7a6758f2-7c91-42c9-8fbe-cec006471a2c/resource/" +
  `${RESOURCE_ID}/download/listadocronologico2017.csv`;
const REGISTRY_UI = "https://registrosanitario.ispch.gob.cl/";

const INN_OF_INTEREST = [
  "AMBROXOL", "PARACETAMOL", "IBUPROFENO", "LOSARTAN", "OMEPRAZOL",
  "AMOXICILINA", "DICLOFENACO", "CETIRIZINA",
];

async function probeDatastore() {
  const res = await fetch(DATASTORE);
  const json = await res.json();
  return {
    url: DATASTORE,
    status: res.status,
    success: json.success ?? null,
    total: json.result?.total ?? null,
    recordsReturned: (json.result?.records ?? []).length,
    fields: (json.result?.fields ?? []).map((f) => f.id),
  };
}

async function probeCsv() {
  const res = await fetch(CSV, { redirect: "follow" });
  const buf = Buffer.from(await res.arrayBuffer());
  // El archivo es ISO-8859-1 con CRLF, no UTF-8.
  const text = buf.toString("latin1");
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const dataLines = lines.filter((l) => /^\d+;/.test(l));

  const inn = new Set();
  const registrations = new Set();
  const holders = new Set();
  for (const line of dataLines) {
    const cols = line.split(";");
    if (cols[1]) inn.add(cols[1].trim().toUpperCase());
    if (cols[3]) registrations.add(cols[3].trim());
    if (cols[4]) holders.add(cols[4].trim());
  }

  const coverage = {};
  for (const term of INN_OF_INTEREST) {
    coverage[term] = dataLines.filter((l) => l.toUpperCase().includes(term)).length;
  }

  return {
    url: CSV,
    status: res.status,
    bytes: buf.length,
    encoding: "ISO-8859-1",
    headerBanner: lines.slice(0, 2).map((l) => l.replace(/;+/g, " ").trim()),
    dataRows: dataLines.length,
    distinctActiveIngredients: inn.size,
    distinctIspRegistrations: registrations.size,
    distinctHolders: holders.size,
    columns: (lines.find((l) => /Principio Activo/i.test(l)) ?? "").split(";").map((c) => c.trim()),
    coverageOfAuditCorpus: coverage,
    sampleRow: dataLines[0] ?? null,
  };
}

async function probeRegistryUi() {
  try {
    const res = await fetch(REGISTRY_UI, { redirect: "follow" });
    return { url: REGISTRY_UI, status: res.status, contentType: res.headers.get("content-type") };
  } catch (e) {
    return { url: REGISTRY_UI, status: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const out = {
    probedAt: new Date().toISOString(),
    note:
      "Sonda de viabilidad, no integracion. Lectura publica sin credenciales.",
    ckanDatastoreApi: await probeDatastore(),
    csvSnapshot: await probeCsv(),
    officialRegistrySearchUi: await probeRegistryUi(),
  };
  await writeFile(resolve(OUT_DIR, "isp-source-probe.json"), JSON.stringify(out, null, 2), "utf8");
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
