import type { PharmacySlug } from "@/lib/types";

interface PharmacyConfig {
  name: string;
  color: string;
  bgLight: string;
  cardLabel: string | null;
  sbpayLabel: string | null;
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
    channels: { store: true, online: false, card: false, sbpay: false },
  },
  salcobrand: {
    name: "Salcobrand",
    color: "#003087",
    bgLight: "#e6eaf5",
    cardLabel: "T. Más",
    sbpayLabel: "SBPay",
    channels: { store: true, online: true, card: true, sbpay: true },
  },
  ahumada: {
    name: "Farmacias Ahumada",
    color: "#e31837",
    bgLight: "#fde8eb",
    cardLabel: "CMR",
    sbpayLabel: null,
    channels: { store: true, online: false, card: true, sbpay: false },
  },
  "dr-simi": {
    name: "Dr. Simi",
    color: "#e2001a",
    bgLight: "#fff0f0",
    cardLabel: null,
    sbpayLabel: null,
    channels: { store: true, online: true, card: false, sbpay: false },
  },
};
