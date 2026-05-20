import { useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl, SafeAreaView, TouchableOpacity } from "react-native";
import type { MedicationResult } from "@/lib/types";
import { useLocalSearchParams } from "expo-router";
import { MedicationCard } from "@/components/MedicationCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import { useSearchStore } from "@/store/searchStore";
import { useHistoryStore } from "@/store/historyStore";
import { useSearch } from "@/hooks/useSearch";

const SKELETON_KEYS = ["sk-0", "sk-1", "sk-2"];

export default function ResultsScreen() {
  const { q } = useLocalSearchParams<{ q: string }>();
  const { results, status, errorMessage } = useSearchStore();
  const { add: addToHistory } = useHistoryStore();
  const { search } = useSearch();
  const [bioOnly, setBioOnly] = useState(false);

  useEffect(() => {
    if (q) {
      search(q);
      addToHistory(q);
    }
  }, [q, search, addToHistory]);

  function handleRefresh() {
    if (q) search(q, true);
  }

  const isLoading = status === "loading";
  const bioCount = results.filter((r) => r.isBioequivalent).length;
  const displayResults = bioOnly ? results.filter((r) => r.isBioequivalent) : results;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <Text className="text-base text-gray-600 dark:text-gray-300">
          Resultados para{" "}
          <Text className="font-semibold text-gray-900 dark:text-white">"{q}"</Text>
        </Text>
        {status === "success" && (
          <Text className="text-xs text-gray-400 mt-0.5">
            {results.length} medicamento{results.length !== 1 ? "s" : ""} encontrado{results.length !== 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {status === "success" && results.length > 0 && (
        <View className="px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <TouchableOpacity
            onPress={() => setBioOnly((v) => !v)}
            className={`self-start rounded-full px-4 py-1.5 border ${
              bioOnly
                ? "bg-emerald-50 border-emerald-500"
                : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
            }`}
          >
            <Text className={`text-sm font-medium ${bioOnly ? "text-emerald-700" : "text-gray-500 dark:text-gray-300"}`}>
              Bioequivalentes ({bioCount})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {status === "error" && (
        <View className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-100 dark:border-red-900">
          <Text className="text-red-600 text-sm">{errorMessage ?? "Error al buscar medicamentos"}</Text>
        </View>
      )}

      <FlatList
        data={(isLoading ? SKELETON_KEYS : displayResults) as (string | MedicationResult)[]}
        keyExtractor={(item) =>
          typeof item === "string" ? item : item.matchKey
        }
        renderItem={({ item }) =>
          typeof item === "string" ? (
            <SkeletonCard />
          ) : (
            <MedicationCard medication={item} />
          )
        }
        ListEmptyComponent={
          bioOnly && results.length > 0 ? (
            <View className="items-center px-8 py-16">
              <Text className="text-base font-semibold text-gray-600 dark:text-gray-300 text-center">
                Ningún resultado bioequivalente para "{q}"
              </Text>
            </View>
          ) : (
            <EmptyState query={q ?? ""} />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            tintColor="#16a34a"
            colors={["#16a34a"]}
          />
        }
        contentContainerClassName="px-4 py-4 gap-3"
      />
    </SafeAreaView>
  );
}
