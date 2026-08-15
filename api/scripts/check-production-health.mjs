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

/**
 * Error estructurado para el healthcheck — nunca lleva el valor de ningún
 * secreto ni headers completos, solo lo mínimo operacional (status HTTP y
 * el endpoint afectado) para que el reporte JSON sea útil sin exponer nada
 * sensible.
 */
class HealthcheckError extends Error {
  constructor(message, { status = null, endpoint = null } = {}) {
    super(message);
    this.status = status;
    this.endpoint = endpoint;
  }
}

async function main() {
  // Validación explícita: sin API_SECRET_KEY, /api/search?debug=1 responde
  // 403 (protegido por isDebugAuthorized()) — fallar de inmediato con un
  // mensaje claro en vez de disparar una llamada protegida que sabemos que
  // va a fallar. Nunca se imprime el valor de la variable (está vacía en
  // este caso; tampoco se imprimiría si tuviera valor).
  if (!API_SECRET_KEY) {
    throw new HealthcheckError("API_SECRET_KEY is not configured in GitHub Actions secrets", {
      endpoint: "/api/search?debug=1 (no solicitado — falta credencial)",
    });
  }

  const health = await fetchJson(`${API_URL}/api/health`);
  if (!health.ok) {
    throw new HealthcheckError("Health endpoint did not return ok=true", {
      endpoint: `${API_URL}/api/health`,
    });
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
    const endpoint = `${API_URL}/api/search?q=${encodeURIComponent(query)}&debug=1`;
    const payload = await fetchJson(endpoint);
    const diagnostics = payload.diagnostics;
    if (!diagnostics || !Array.isArray(diagnostics.pharmacies)) {
      throw new HealthcheckError(`Missing diagnostics for query "${query}"`, { endpoint });
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
  let res;
  try {
    res = await fetch(url, { headers: BASE_HEADERS });
  } catch (err) {
    // Error de red (DNS, timeout, conexión rechazada, etc.) — el mensaje de
    // `fetch` no incluye headers ni el valor de ningún secreto.
    const message = err instanceof Error ? err.message : String(err);
    throw new HealthcheckError(`Network error reaching ${url}: ${message}`, { endpoint: url });
  }
  if (!res.ok) {
    throw new HealthcheckError("Request failed", { status: res.status, endpoint: url });
  }
  return await res.json();
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);

  // Reporte mínimo también en caso de error — sin esto, el healthcheck
  // fallaba antes de escribir reports/api-healthcheck.json y el paso
  // `upload-artifact` (if-no-files-found: error) generaba un segundo error
  // confuso encima del real. Nunca incluye secrets, headers completos,
  // emails ni PII — solo ok/error/status/endpoint.
  const report = {
    ok: false,
    error: message,
    status: error?.status ?? null,
    endpoint: error?.endpoint ?? null,
  };
  const json = JSON.stringify(report, null, 2);
  console.log(json);

  if (OUTPUT_FILE) {
    try {
      await writeFile(OUTPUT_FILE, `${json}\n`, "utf8");
    } catch (writeErr) {
      console.error(
        "No se pudo escribir el reporte de error:",
        writeErr instanceof Error ? writeErr.message : String(writeErr)
      );
    }
  }

  process.exitCode = 1;
});

async function writeFile(path, content, encoding) {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const { dirname } = await import("node:path");
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, encoding);
}
