import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SearchBar } from "@/components/SearchBar";
import { useHistoryStore } from "@/store/historyStore";

const QUICK_SEARCHES = ["Paracetamol", "Ibuprofeno", "Amoxicilina", "Metformina"];

export default function HomeScreen() {
  const router = useRouter();
  const { items: recentSearches, remove, clear } = useHistoryStore();

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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-12 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold text-green-700">ComparaFarma</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Compara precios en Cruz Verde, Salcobrand y Ahumada
          </Text>
        </View>

        <SearchBar onSearch={handleSearch} autoFocus />

        <View className="mt-6">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Búsquedas frecuentes
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {QUICK_SEARCHES.map((term) => (
              <TouchableOpacity
                key={term}
                onPress={() => handleSearch(term)}
                className="bg-green-50 border border-green-200 rounded-full px-4 py-2"
              >
                <Text className="text-green-700 text-sm font-medium">{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
              <View key={term} className="flex-row items-center border-b border-gray-100">
                <TouchableOpacity
                  onPress={() => handleSearch(term)}
                  className="flex-1 py-3 flex-row items-center"
                >
                  <Text className="text-gray-400 mr-3">↩</Text>
                  <Text className="text-gray-700">{term}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemove(term)} hitSlop={8} className="pl-3 py-3">
                  <Text className="text-gray-300 text-lg">✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
