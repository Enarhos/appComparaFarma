#!/usr/bin/env node
// fetch-branches.js — descarga y ACUMULA datos de MINSAL
// Se puede ejecutar localmente o en GitHub Actions.
// Cada ejecución AGREGA nuevas comunas/farmacias sin borrar las existentes.
// Después de 7 días de ejecuciones tendremos cobertura completa.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = join(__dirname, "..");
const OUT_DIR    = join(REPO_ROOT, "api", "src", "data");
const JSON_FILE  = join(OUT_DIR, "branches.json");
const TS_FILE    = join(OUT_DIR, "branches-data.ts");

const CADENA_MAP = [
  { pattern: /cruz\s*verde/i,                          slug: "cruz-verde"   },
  { pattern: /salcobrand/i,                            slug: "salcobrand"   },
  { pattern: /ahumada/i,                               slug: "ahumada"      },
  { pattern: /dr\.?\s*simi|doctor\s*simi|del\s+dr/i,  slug: "dr-simi"      },
  { pattern: /araucomed/i,                             slug: "araucomed"    },
  { pattern: /ecofarmacias?/i,                         slug: "ecofarmacias" },
];

const REGION_NAMES = {
  "1":"Tarapacá","2":"Antofagasta","3":"Atacama","4":"Coquimbo",
  "5":"Valparaíso","6":"O'Higgins","7":"Maule","8":"Biobío",
  "9":"La Araucanía","10":"Los Lagos","11":"Aysén","12":"Magallanes",
  "13":"Metropolitana","14":"Los Ríos","15":"Arica y Parinacota","16":"Ñuble",
};

function toSlug(nombre) {
  if (!nombre) return null;
  for (const { pattern, slug } of CADENA_MAP) {
    if (pattern.test(nombre)) return slug;
  }
  return null;
}

function normalizeCommune(raw) {
  return raw
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().trim();
}

function titleCase(str) {
  return str.toLowerCase().split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Carga datos existentes para merge
function loadExisting() {
  if (!existsSync(JSON_FILE)) return { byCommune: {}, communes: {}, fetchedDays: [] };
  try {
    return JSON.parse(readFileSync(JSON_FILE, "utf-8"));
  } catch {
    return { byCommune: {}, communes: {}, fetchedDays: [] };
  }
}

async function main() {
  console.log("▶ Descargando datos desde MINSAL...");
  const res = await fetch("https://midas.minsal.cl/farmacia_v2/WS/getLocales.php", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Referer":    "https://midas.minsal.cl/",
      "Accept":     "application/json, text/plain, */*",
    },
  });

  if (!res.ok) throw new Error(`MINSAL HTTP ${res.status}`);
  const locals = await res.json();
  console.log(`  → ${locals.length} registros del día de hoy`);

  const todayDia = locals[0]?.funcionamiento_dia ?? "?";
  const todayFecha = locals[0]?.fecha ?? new Date().toISOString().slice(0,10);
  console.log(`  → Día: ${todayDia} (${todayFecha})`);

  // Cargar datos existentes (para merge acumulativo)
  const existing = loadExisting();
  const byCommune = existing.byCommune ?? {};
  const communes  = existing.communes  ?? {};
  const fetchedDays = existing.fetchedDays ?? [];

  let newCommunes = 0, newPharmacies = 0;

  for (const local of locals) {
    const slug = toSlug(local.local_nombre);
    if (!slug) continue;

    const key = normalizeCommune(local.comuna_nombre);
    if (!key) continue;

    // Agregar comuna si no existe
    if (!communes[key]) {
      communes[key] = {
        nombre: titleCase(local.comuna_nombre),
        region: REGION_NAMES[local.fk_region] ?? "Chile",
      };
      newCommunes++;
    }

    // Agregar slug si no está en esa comuna
    if (!byCommune[key]) byCommune[key] = [];
    if (!byCommune[key].includes(slug)) {
      byCommune[key].push(slug);
      newPharmacies++;
    }
  }

  // Registrar el día procesado (para saber cobertura)
  if (!fetchedDays.includes(todayDia)) fetchedDays.push(todayDia);

  const result = {
    byCommune,
    communes,
    fetchedDays,
    fetchedAt: new Date().toISOString(),
    coverage: `${fetchedDays.length}/7 días acumulados`,
  };

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  // Guardar JSON
  writeFileSync(JSON_FILE, JSON.stringify(result, null, 0), "utf-8");

  // Generar módulo TypeScript
  const tsContent = `// AUTO-GENERADO — no editar. Ejecutar scripts-temp/fetch-branches.js para actualizar.
// Cobertura: ${result.coverage} — días: ${fetchedDays.join(", ")}
import type { BranchIndex } from "../clients/minsal.js";
export const BRANCH_INDEX: BranchIndex = ${JSON.stringify(result, null, 0)} as unknown as BranchIndex;\n`;
  writeFileSync(TS_FILE, tsContent, "utf-8");

  const totalCommunes = Object.keys(communes).length;
  console.log(`\n✅ Merge completado:`);
  console.log(`   Comunas totales: ${totalCommunes} (+${newCommunes} nuevas hoy)`);
  console.log(`   Nuevas entradas farmacia-comuna: ${newPharmacies}`);
  console.log(`   Días acumulados: ${fetchedDays.join(", ")} (${fetchedDays.length}/7)`);
  console.log(`   Archivos: branches.json + branches-data.ts`);
}

main().catch(err => { console.error("Error:", err.message); process.exit(1); });
