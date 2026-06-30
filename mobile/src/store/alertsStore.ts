import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "price_alerts_v1";

export interface PriceAlert {
  matchKey: string;
  canonicalName: string;
  targetPrice: number;
  bestPharmacy: string;   // slug del momento en que se creó la alerta
  createdAt: string;      // ISO
  triggeredAt: string | null; // última vez que se disparó
}

interface AlertsState {
  alerts: PriceAlert[];
  loaded: boolean;
  load: () => Promise<void>;
  setAlert: (alert: Omit<PriceAlert, "createdAt" | "triggeredAt">) => void;
  removeAlert: (matchKey: string) => void;
  markTriggered: (matchKey: string) => void;
  getAlert: (matchKey: string) => PriceAlert | undefined;
}

async function persist(alerts: PriceAlert[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const alerts: PriceAlert[] = raw ? JSON.parse(raw) : [];
      set({ alerts, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  setAlert: (alert) => {
    const { alerts } = get();
    const existing = alerts.findIndex((a) => a.matchKey === alert.matchKey);
    const next: PriceAlert = {
      ...alert,
      createdAt: new Date().toISOString(),
      triggeredAt: null,
    };
    const updated = existing >= 0
      ? alerts.map((a, i) => (i === existing ? next : a))
      : [...alerts, next];
    set({ alerts: updated });
    persist(updated);
  },

  removeAlert: (matchKey) => {
    const updated = get().alerts.filter((a) => a.matchKey !== matchKey);
    set({ alerts: updated });
    persist(updated);
  },

  markTriggered: (matchKey) => {
    const updated = get().alerts.map((a) =>
      a.matchKey === matchKey ? { ...a, triggeredAt: new Date().toISOString() } : a
    );
    set({ alerts: updated });
    persist(updated);
  },

  getAlert: (matchKey) => get().alerts.find((a) => a.matchKey === matchKey),
}));
