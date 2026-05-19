import { useEffect } from "react";
import { View, Text, FlatList, RefreshControl, SafeAreaView } from "react-native";
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

  useEffect(() => {
    if (q) {
      search(q);
      addToHistory(q);
    }
  }, [q]);

  function handleRefresh() {
    if (q) search(q, true);
  }

  const isLoading = status === "loading";

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <Text className="text-base text-gray-600">
          Resultados para{" "}
          <Text className="font-semibold text-gray-900">"{q}"</Text>
        </Text>
        {status === "success" && (
          <Text className="text-xs text-gray-400 mt-0.5">
            {results.length} medicamento{results.length !== 1 ? "s" : ""} encontrado{results.length !== 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {status === "error" && (
        <View className="mx-4 mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
          <Text className="text-red-600 text-sm">{errorMessage ?? "Error al buscar medicamentos"}</Text>
        </View>
      )}

      <FlatList
        data={(isLoading ? SKELETON_KEYS : results) as (string | MedicationResult)[]}
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
        ListEmptyComponent={<EmptyState query={q ?? ""} />}
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
