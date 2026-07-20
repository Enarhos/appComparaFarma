import type { PharmacySlug } from "@comparafarma/domain";

interface PharmacyDisplay {
  name: string;
  color: string;
  /** Nombre del programa de fidelización que llena el canal "cmr" para esta farmacia, o null si no tiene. */
  cardLabel: string | null;
}

// Copia propia (no importada de mobile/src/constants/pharmacies.ts) — evita
// crear una dependencia hacia el workspace mobile, que hoy no se puede tocar
// (Prueba Cerrada de Google Play, ver CLAUDE.md). Mismos valores que usa
// mobile para cardLabel — ver también LOYALTY_LABELS en
// api/src/lib/clickTracking.ts (misma info, tercera copia por la misma razón).
export const PHARMACIES: Record<PharmacySlug, PharmacyDisplay> = {
  "cruz-verde": { name: "Cruz Verde", color: "#00963f", cardLabel: null },
  salcobrand: { name: "Salcobrand", color: "#003087", cardLabel: "T. Más" },
  ahumada: { name: "Farmacias Ahumada", color: "#e31837", cardLabel: "CMR" },
  "dr-simi": { name: "Dr. Simi", color: "#e2001a", cardLabel: null },
  araucomed: { name: "AraucoMed", color: "#1d6fa4", cardLabel: null },
  ecofarmacias: { name: "EcoFarmacias", color: "#0d9488", cardLabel: null },
  farmex: { name: "Farmex", color: "#7c3aed", cardLabel: "Fonasa" },
  sermecoop: { name: "Sermecoop", color: "#e67e22", cardLabel: null },
  easyfarma: { name: "EasyFarma", color: "#16a34a", cardLabel: "Plus" },
};

export const QUICK_SEARCHES = [
  "Paracetamol",
  "Ibuprofeno",
  "Amoxicilina",
  "Metformina",
  "Losartán",
  "Atorvastatina",
  "Omeprazol",
  "Sertralina",
];
