import type { PharmacySlug } from "@/lib/types";

interface PharmacyConfig {
  name: string;
  color: string;
  bgLight: string;
  cardLabel: string | null;
  sbpayLabel: string | null;
  onlineOnly: boolean; // true = sin sucursal física (solo despacho online)
  channels: {
    store: boolean;
    online: boolean;
    card: boolean;
    sbpay: boolean;
  };
}

export const PHARMACIES: Record<PharmacySlug, PharmacyConfig> = {
  "cruz-verde": {
    name: "Cruz Verde",
    color: "#00963f",
    bgLight: "#e6f5ec",
    cardLabel: null,
    sbpayLabel: null,
    onlineOnly: false,
    channels: { store: true, online: false, card: false, sbpay: false },
  },
  salcobrand: {
    name: "Salcobrand",
    color: "#003087",
    bgLight: "#e6eaf5",
    cardLabel: "T. Más",
    sbpayLabel: "SBPay",
    onlineOnly: false,
    channels: { store: true, online: true, card: true, sbpay: true },
  },
  ahumada: {
    name: "Farmacias Ahumada",
    color: "#e31837",
    bgLight: "#fde8eb",
    cardLabel: "CMR",
    sbpayLabel: null,
    onlineOnly: false,
    channels: { store: true, online: false, card: true, sbpay: false },
  },
  "dr-simi": {
    name: "Dr. Simi",
    color: "#e2001a",
    bgLight: "#fff0f0",
    cardLabel: null,
    sbpayLabel: null,
    onlineOnly: false,
    channels: { store: true, online: true, card: false, sbpay: false },
  },
  araucomed: {
    name: "AraucoMed",
    color: "#1d6fa4",
    bgLight: "#e8f3fb",
    cardLabel: null,
    sbpayLabel: null,
    onlineOnly: true,
    channels: { store: true, online: false, card: false, sbpay: false },
  },
  ecofarmacias: {
    name: "EcoFarmacias",
    color: "#0d9488",
    bgLight: "#e6f7f6",
    cardLabel: null,
    sbpayLabel: null,
    onlineOnly: true,
    channels: { store: true, online: false, card: false, sbpay: false },
  },
  farmex: {
    name: "Farmex",
    color: "#7c3aed",
    bgLight: "#f3effe",
    cardLabel: "Fonasa",
    sbpayLabel: null,
    onlineOnly: true,
    channels: { store: true, online: false, card: true, sbpay: false },
  },
  sermecoop: {
    name: "Sermecoop",
    color: "#e67e22",
    bgLight: "#fef3e2",
    cardLabel: null,
    sbpayLabel: null,
    onlineOnly: false,
    channels: { store: true, online: false, card: false, sbpay: false },
  },
};
