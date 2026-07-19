const API_URL = (process.env.API_URL ?? "https://comparafarma-api.vercel.app").replace(/\/$/, "");
const QUERIES = (process.env.HEALTHCHECK_QUERIES ?? "paracetamol,ibuprofeno")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const OUTPUT_FILE = process.env.HEALTHCHECK_OUTPUT_FILE ?? "";
const API_SECRET_KEY = (process.env.API_SECRET_KEY ?? "").trim();
const BASE_HEADERS = {
  "Accept": "application/json",
  ...(API_SECRET_KEY ? { "x-api-key": API_SECRET_KEY } : {}),
};

async function main() {
  const health = await fetchJson(`${API_URL}/api/health`);
  if (!health.ok) {
    throw new Error("Health endpoint did not return ok=true");
  }

  const aggregate = new Map([
    ["cruz-verde", { fulfilled: 0, withResults: 0, rejected: 0 }],
    ["salcobrand", { fulfilled: 0, withResults: 0, rejected: 0 }],
    ["ahumada", { fulfilled: 0, withResults: 0, rejected: 0 }],
    ["dr-simi", { fulfilled: 0, withResults: 0, rejected: 0 }],
    ["araucomed", { fulfilled: 0, withResults: 0, rejected: 0 }],
    ["ecofarmacias", { fulfilled: 0, withResults: 0, rejected: 0 }],
    ["farmex", { fulfilled: 0, withResults: 0, rejected: 0 }],
    ["sermecoop", { fulfilled: 0, withResults: 0, rejected: 0 }],
    ["easyfarma", { fulfilled: 0, withResults: 0, rejected: 0 }],
  ]);

  const summaries = [];

  for (const query of QUERIES) {
    const payload = await fetchJson(`${API_URL}/api/search?q=${encodeURIComponent(query)}&debug=1`);
    const diagnostics = payload.diagnostics;
    if (!diagnostics || !Array.isArray(diagnostics.pharmacies)) {
      throw new Error(`Missing diagnostics for query "${query}"`);
    }

    for (const pharmacy of diagnostics.pharmacies) {
      const slot = aggregate.get(pharmacy.pharmacySlug);
      if (!slot) continue;
      if (pharmacy.status === "fulfilled") slot.fulfilled += 1;
      if (pharmacy.status === "fulfilled" && pharmacy.resultCount > 0) slot.withResults += 1;
      if (pharmacy.status === "rejected") slot.rejected += 1;
    }

    summaries.push({
      query,
      mergedResults: diagnostics.mergedResults,
      durationMs: diagnostics.durationMs,
      pharmacies: diagnostics.pharmacies,
    });
  }

  const failures = [];

  for (const [slug, stats] of aggregate.entries()) {
    if (stats.fulfilled === 0) {
      failures.push(`${slug}: never fulfilled`);
      continue;
    }
    if (stats.withResults === 0) {
      failures.push(`${slug}: fulfilled but returned 0 results for all monitored queries`);
    }
  }

  const summary = {
    ok: failures.length === 0,
    apiUrl: API_URL,
    queries: QUERIES,
    summaries,
    aggregate: Object.fromEntries(aggregate),
    failures,
  };

  const json = JSON.stringify(summary, null, 2);
  console.log(json);

  if (OUTPUT_FILE) {
    await writeFile(OUTPUT_FILE, `${json}\n`, "utf8");
  }

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: BASE_HEADERS,
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${url} -> ${res.status}`);
  }
  return await res.json();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function writeFile(path, content, encoding) {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const { dirname } = await import("node:path");
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, encoding);
}
