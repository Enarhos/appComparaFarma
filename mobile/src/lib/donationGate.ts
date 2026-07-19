import AsyncStorage from "@react-native-async-storage/async-storage";

const COUNT_KEY = "donation_search_count_v1";
const DISMISSED_AT_KEY = "donation_dismissed_at_v1";
const MIN_SEARCHES = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function incrementSearchCount(): Promise<void> {
  const raw = await AsyncStorage.getItem(COUNT_KEY);
  const count = parseInt(raw ?? "0", 10);
  await AsyncStorage.setItem(COUNT_KEY, String(count + 1));
}

/** @param dismissDays cuántos días dura "No mostrar por ahora" (viene de /api/config, default 7) */
export async function shouldShowDonation(dismissDays: number): Promise<boolean> {
  const [dismissedAtRaw, countRaw] = await Promise.all([
    AsyncStorage.getItem(DISMISSED_AT_KEY),
    AsyncStorage.getItem(COUNT_KEY),
  ]);

  if (dismissedAtRaw) {
    const dismissedAt = parseInt(dismissedAtRaw, 10);
    if (Date.now() - dismissedAt < dismissDays * DAY_MS) return false;
  }

  const count = parseInt(countRaw ?? "0", 10);
  return count >= MIN_SEARCHES;
}

export async function dismissDonation(): Promise<void> {
  await AsyncStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
}
