const API_URL = (process.env.API_URL ?? "https://comparafarma-api.vercel.app").replace(/\/$/, "");
const QUERIES = (process.env.HEALTHCHECK_QUERIES ?? "paracetamol,ibuprofeno")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

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

  console.log(JSON.stringify({
    ok: failures.length === 0,
    apiUrl: API_URL,
    queries: QUERIES,
    summaries,
    aggregate: Object.fromEntries(aggregate),
    failures,
  }, null, 2));

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "Accept": "application/json" },
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
