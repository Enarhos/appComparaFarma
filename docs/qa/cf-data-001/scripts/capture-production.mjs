/**
 * CF-DATA-001 — corpus BASE de producción (Fase 1 cross-check + Fase 4 A/B).
 *
 * Guarda la respuesta real de `GET /api/search` (origin/main desplegado) para
 * el corpus de consultas del ticket. Sirve para dos cosas:
 *   1. Atribuir `laboratory` a UNA farmacia concreta en las tarjetas de una
 *      sola oferta (única forma de auditar Salcobrand sin credenciales Algolia).
 *   2. Ser el lado BASE de la comparación A/B.
 */
import { writeFileSync, mkdirSync } from "node:fs";

const QUERIES = [
  "ambroxol", "paracetamol", "tapsin", "ibuprofeno", "losartan",
  "omeprazol", "amoxicilina", "diclofenaco", "cetirizina",
];

const API = "https://comparafarma-api.vercel.app";
const out = {};

for (const q of QUERIES) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 120000);
  try {
    const res = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    out[q] = await res.json();
    process.stderr.write(`${q}: ${out[q].length} tarjetas\n`);
  } catch (e) {
    process.stderr.write(`${q}: ERROR ${e.message}\n`);
    out[q] = [];
  } finally {
    clearTimeout(t);
  }
}

mkdirSync(new URL("./out/", import.meta.url), { recursive: true });
writeFileSync(new URL("./out/production.json", import.meta.url), JSON.stringify(out, null, 2));
process.stderr.write("done\n");
