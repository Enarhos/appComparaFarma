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
//
// Paleta de "color" rediseñada en Sprint Web 2 (UX/inteligencia de precios):
// los valores anteriores tenían colisiones de tono difíciles de distinguir en
// el gráfico de histórico con varias farmacias a la vez (ahumada/dr-simi eran
// dos rojos casi idénticos; cruz-verde/easyfarma dos verdes casi idénticos;
// salcobrand/araucomed dos azules casi idénticos). Estos 9 valores son un set
// categórico deliberadamente separado en el círculo de color — sigue siendo
// un solo color fijo por farmacia en toda la plataforma (tarjetas, ficha y
// gráfico reutilizan este mismo mapa), solo que ahora se pueden diferenciar
// de un vistazo con varias líneas superpuestas.
export const PHARMACIES: Record<PharmacySlug, PharmacyDisplay> = {
  "cruz-verde": { name: "Cruz Verde", color: "#16a34a", cardLabel: null },
  salcobrand: { name: "Salcobrand", color: "#2563eb", cardLabel: "T. Más" },
  ahumada: { name: "Farmacias Ahumada", color: "#dc2626", cardLabel: "CMR" },
  "dr-simi": { name: "Dr. Simi", color: "#db2777", cardLabel: null },
  araucomed: { name: "AraucoMed", color: "#0891b2", cardLabel: null },
  ecofarmacias: { name: "EcoFarmacias", color: "#65a30d", cardLabel: null },
  farmex: { name: "Farmex", color: "#7c3aed", cardLabel: "Fonasa" },
  sermecoop: { name: "Sermecoop", color: "#ea580c", cardLabel: null },
  easyfarma: { name: "EasyFarma", color: "#0d9488", cardLabel: "Plus" },
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
