import AsyncStorage from "@react-native-async-storage/async-storage";

const COUNT_KEY = "donation_search_count_v1";
const DISMISSED_KEY = "donation_dismissed_v1";
const MIN_SEARCHES = 5;

export async function incrementSearchCount(): Promise<void> {
  const raw = await AsyncStorage.getItem(COUNT_KEY);
  const count = parseInt(raw ?? "0", 10);
  await AsyncStorage.setItem(COUNT_KEY, String(count + 1));
}

export async function shouldShowDonation(): Promise<boolean> {
  const [dismissed, raw] = await Promise.all([
    AsyncStorage.getItem(DISMISSED_KEY),
    AsyncStorage.getItem(COUNT_KEY),
  ]);
  if (dismissed) return false;
  const count = parseInt(raw ?? "0", 10);
  return count >= MIN_SEARCHES;
}

export async function dismissDonation(): Promise<void> {
  await AsyncStorage.setItem(DISMISSED_KEY, "1");
}
