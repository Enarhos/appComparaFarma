import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { SearchBar } from "@/components/SearchBar";
import { useHistoryStore } from "@/store/historyStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useSearchStore } from "@/store/searchStore";
import { formatCLP } from "@/lib/formatters";
import { PHARMACIES } from "@/constants/pharmacies";
import type { PharmacySlug } from "@/lib/types";

const QUICK_SEARCHES = ["Paracetamol", "Ibuprofeno", "Amoxicilina", "Metformina"];

export default function HomeScreen() {
  const router = useRouter();
  const { items: recentSearches, remove, clear } = useHistoryStore();
  const { keys: favKeys, cachedResults } = useFavoritesStore();
  const setResults = useSearchStore((s) => s.setResults);

  function handleRemove(term: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    remove(term);
  }

  function handleClear() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    clear();
  }

  function handleSearch(query: string) {
    if (query.trim().length < 2) return;
    router.push({ pathname: "/results", params: { q: query.trim() } });
  }

  function handleFavoritePress(matchKey: string) {
    const med = cachedResults[matchKey];
    if (!med) return;
    setResults([med]);
    router.push({ pathname: "/medication", params: { key: matchKey } });
  }

  const favMeds = favKeys.map((k) => cachedResults[k]).filter(Boolean);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-12 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold text-green-700">ComparaFarma</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Compara precios en Cruz Verde, Salcobrand, Ahumada y Dr. Simi
          </Text>
        </View>

        <SearchBar onSearch={handleSearch} autoFocus />

        {/* Favoritos */}
        {favMeds.length > 0 && (
          <View className="mt-6">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Favoritos
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
              {favMeds.map((med) => (
                <TouchableOpacity
                  key={med.matchKey}
                  onPress={() => handleFavoritePress(med.matchKey)}
                  className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-3 mx-1 w-44"
                  activeOpacity={0.7}
                >
                  <Text className="text-sm font-semibold text-gray-900 dark:text-white" numberOfLines={2}>
                    {med.canonicalName}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-1">desde</Text>
                  <Text className="text-base font-extrabold text-green-600">
                    {formatCLP(med.bestPrice)}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
                    {PHARMACIES[med.bestPharmacy as PharmacySlug]?.name ?? med.bestPharmacy}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text className="text-xs text-gray-300 dark:text-gray-600 mt-2">
              Precios al momento de guardar
            </Text>
          </View>
        )}

        {/* Búsquedas frecuentes */}
        <View className="mt-6">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Búsquedas frecuentes
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {QUICK_SEARCHES.map((term) => (
              <TouchableOpacity
                key={term}
                onPress={() => handleSearch(term)}
                className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-full px-4 py-2"
              >
                <Text className="text-green-700 dark:text-green-400 text-sm font-medium">{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Búsquedas recientes */}
        {recentSearches.length > 0 && (
          <View className="mt-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Búsquedas recientes
              </Text>
              <TouchableOpacity onPress={handleClear} hitSlop={8}>
                <Text className="text-xs text-red-400 font-medium">Borrar todo</Text>
              </TouchableOpacity>
            </View>
            {recentSearches.map((term) => (
              <View key={term} className="flex-row items-center border-b border-gray-100 dark:border-gray-800">
                <TouchableOpacity
                  onPress={() => handleSearch(term)}
                  className="flex-1 py-3 flex-row items-center"
                >
                  <Ionicons name="time-outline" size={16} color="#9ca3af" style={{ marginRight: 12 }} />
                  <Text className="text-gray-700 dark:text-gray-300">{term}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemove(term)} hitSlop={8} className="pl-3 py-3">
                  <Ionicons name="close" size={16} color="#d1d5db" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {/* Banner: Ayúdanos a mejorar */}
        <TouchableOpacity
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onPress={() => router.push("/about" as any)}
          activeOpacity={0.8}
          className="mt-8 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-2xl px-4 py-4 flex-row items-center"
        >
          <View className="bg-green-100 dark:bg-green-900 rounded-full p-2 mr-3">
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#16a34a" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-green-800 dark:text-green-300">
              Ayúdanos a mejorar
            </Text>
            <Text className="text-xs text-green-600 dark:text-green-500 mt-0.5">
              Envíanos tus sugerencias o comentarios
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#16a34a" />
        </TouchableOpacity>

        {/* Pie de página */}
        <View className="items-center mt-8 mb-2">
          <Text className="text-xs text-gray-300 dark:text-gray-600">
            Hecho con ❤️ para los chilenos 🇨🇱
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
