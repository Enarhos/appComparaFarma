import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_PREFIX = "price_history_v1_";
const MAX_SNAPSHOTS = 60;

export interface PriceSnapshot {
  date: string;      // YYYY-MM-DD
  price: number;     // mejor precio efectivo ese día
  pharmacy: string;  // slug de la farmacia más barata
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export async function recordPriceSnapshot(
  matchKey: string,
  price: number,
  pharmacy: string
): Promise<void> {
  const key = HISTORY_PREFIX + matchKey;
  try {
    const raw = await AsyncStorage.getItem(key);
    const history: PriceSnapshot[] = raw ? JSON.parse(raw) : [];
    const todayStr = today();
    const last = history[history.length - 1];

    if (last?.date === todayStr) {
      // Actualizar la entrada de hoy solo si el precio cambió
      if (last.price === price && last.pharmacy === pharmacy) return;
      history[history.length - 1] = { date: todayStr, price, pharmacy };
    } else {
      history.push({ date: todayStr, price, pharmacy });
    }

    await AsyncStorage.setItem(key, JSON.stringify(history.slice(-MAX_SNAPSHOTS)));
  } catch {
    // non-critical
  }
}

export async function getPriceHistory(matchKey: string): Promise<PriceSnapshot[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_PREFIX + matchKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
