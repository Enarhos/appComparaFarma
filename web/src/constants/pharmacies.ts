import type { PharmacySlug } from "@comparafarma/domain";

interface PharmacyDisplay {
  name: string;
  color: string;
}

// Copia propia (no importada de mobile/src/constants/pharmacies.ts) — evita
// crear una dependencia hacia el workspace mobile, que hoy no se puede tocar
// (Prueba Cerrada de Google Play, ver CLAUDE.md).
export const PHARMACIES: Record<PharmacySlug, PharmacyDisplay> = {
  "cruz-verde": { name: "Cruz Verde", color: "#00963f" },
  salcobrand: { name: "Salcobrand", color: "#003087" },
  ahumada: { name: "Farmacias Ahumada", color: "#e31837" },
  "dr-simi": { name: "Dr. Simi", color: "#e2001a" },
  araucomed: { name: "AraucoMed", color: "#1d6fa4" },
  ecofarmacias: { name: "EcoFarmacias", color: "#0d9488" },
  farmex: { name: "Farmex", color: "#7c3aed" },
  sermecoop: { name: "Sermecoop", color: "#e67e22" },
  easyfarma: { name: "EasyFarma", color: "#16a34a" },
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
