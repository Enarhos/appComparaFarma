import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { MedicationResult } from "@/lib/types";
import type { PharmacySlug } from "@/lib/types";
import { useLocalSearchParams } from "expo-router";
import { MedicationCard } from "@/components/MedicationCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import { useSearchStore } from "@/store/searchStore";
import { useHistoryStore } from "@/store/historyStore";
import { useSearch } from "@/hooks/useSearch";
import { PHARMACIES } from "@/constants/pharmacies";

const SKELETON_KEYS = ["sk-0", "sk-1", "sk-2"];
const ALL_PHARMACIES = Object.keys(PHARMACIES) as PharmacySlug[];

type SortOption = "price" | "name";

export default function ResultsScreen() {
  const { q } = useLocalSearchParams<{ q: string }>();
  const { results, status, errorMessage } = useSearchStore();
  const { add: addToHistory } = useHistoryStore();
  const { search } = useSearch();
  const [bioOnly, setBioOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("price");
  const [activePharmacies, setActivePharmacies] = useState<Set<PharmacySlug>>(
    new Set(ALL_PHARMACIES)
  );

  useEffect(() => {
    if (q) {
      search(q);
      addToHistory(q);
    }
  }, [q, search, addToHistory]);

  function handleRefresh() {
    if (q) search(q, true);
  }

  function togglePharmacy(slug: PharmacySlug) {
    setActivePharmacies((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        if (next.size === 1) return prev; // al menos una siempre activa
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  const isLoading = status === "loading";
  const bioCount = results.filter((r) => r.isBioequivalent).length;

  // Filtrar + ordenar
  let displayResults = bioOnly ? results.filter((r) => r.isBioequivalent) : results;
  displayResults = displayResults.filter((med) =>
    med.prices.some((p) => activePharmacies.has(p.pharmacySlug))
  );
  displayResults = [...displayResults].sort((a, b) =>
    sortBy === "name"
      ? a.canonicalName.localeCompare(b.canonicalName, "es")
      : a.bestPrice - b.bestPrice
  );

  const showBioBanner =
    !bioOnly && bioCount > 0 && results.length > bioCount && status === "success";

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <Text className="text-base text-gray-600 dark:text-gray-300">
          Resultados para{" "}
          <Text className="font-semibold text-gray-900 dark:text-white">"{q}"</Text>
        </Text>
        {status === "success" && (
          <Text className="text-xs text-gray-400 mt-0.5">
            {results.length} medicamento{results.length !== 1 ? "s" : ""} encontrado
            {results.length !== 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {/* Filtros + Orden */}
      {status === "success" && results.length > 0 && (
        <View className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          {/* Fila 1: Bioequivalente + Ordenar */}
          <View className="flex-row items-center gap-2 px-4 pt-2 pb-1">
            <TouchableOpacity
              onPress={() => setBioOnly((v) => !v)}
              className={`rounded-full px-3 py-1.5 border ${
                bioOnly
                  ? "bg-emerald-50 border-emerald-500 dark:bg-emerald-950"
                  : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  bioOnly
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-gray-500 dark:text-gray-300"
                }`}
              >
                🌿 Bio ({bioCount})
              </Text>
            </TouchableOpacity>

            <View className="flex-1" />

            <Text className="text-xs text-gray-400">Ordenar:</Text>
            {(["price", "name"] as SortOption[]).map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => setSortBy(opt)}
                className={`rounded-full px-3 py-1.5 border ${
                  sortBy === opt
                    ? "bg-green-50 border-green-500 dark:bg-green-950"
                    : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    sortBy === opt
                      ? "text-green-700 dark:text-green-400"
                      : "text-gray-500 dark:text-gray-300"
                  }`}
                >
                  {opt === "price" ? "Precio ↑" : "Nombre"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fila 2: Chips de farmacia */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4 pb-2"
          >
            <View className="flex-row gap-2">
              {ALL_PHARMACIES.map((slug) => {
                const ph = PHARMACIES[slug];
                const active = activePharmacies.has(slug);
                return (
                  <TouchableOpacity
                    key={slug}
                    onPress={() => togglePharmacy(slug)}
                    style={{
                      borderColor: active ? ph.color : "#d1d5db",
                      backgroundColor: active ? ph.bgLight : "transparent",
                    }}
                    className="rounded-full px-3 py-1.5 border flex-row items-center gap-1.5"
                  >
                    <View
                      style={{ backgroundColor: active ? ph.color : "#d1d5db" }}
                      className="w-2 h-2 rounded-full"
                    />
                    <Text
                      style={{ color: active ? ph.color : "#9ca3af" }}
                      className="text-xs font-medium"
                    >
                      {ph.name.replace("Farmacias ", "")}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Banner bioequivalente */}
      {showBioBanner && (
        <TouchableOpacity
          onPress={() => setBioOnly(true)}
          className="mx-4 mt-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2.5 flex-row items-center gap-2"
          activeOpacity={0.8}
        >
          <Ionicons name="leaf-outline" size={15} color="#059669" />
          <Text className="flex-1 text-xs text-emerald-800 dark:text-emerald-300">
            Hay{" "}
            <Text className="font-bold">{bioCount}</Text>{" "}
            bioequivalente{bioCount !== 1 ? "s" : ""} disponible
            {bioCount !== 1 ? "s" : ""} — generalmente más económicos
          </Text>
          <Text className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            Ver →
          </Text>
        </TouchableOpacity>
      )}

      {/* Error mejorado */}
      {status === "error" && (
        <View className="mx-4 mt-4 bg-red-50 dark:bg-red-950 rounded-xl border border-red-200 dark:border-red-900 p-4">
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons name="warning-outline" size={16} color="#dc2626" />
            <Text className="text-red-700 dark:text-red-400 font-semibold text-sm">
              No se pudo completar la búsqueda
            </Text>
          </View>
          <Text className="text-red-600 dark:text-red-500 text-xs mb-3">
            {errorMessage ?? "Verifica tu conexión e intenta de nuevo."}
          </Text>
          <TouchableOpacity
            onPress={handleRefresh}
            className="self-start flex-row items-center gap-1.5 bg-red-600 rounded-lg px-4 py-2"
          >
            <Ionicons name="refresh-outline" size={14} color="#fff" />
            <Text className="text-white text-xs font-semibold">Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={(isLoading ? SKELETON_KEYS : displayResults) as (string | MedicationResult)[]}
        keyExtractor={(item) => (typeof item === "string" ? item : item.matchKey)}
        renderItem={({ item }) =>
          typeof item === "string" ? <SkeletonCard /> : <MedicationCard medication={item} />
        }
        ListEmptyComponent={
          !isLoading ? (
            bioOnly && results.length > 0 ? (
              <View className="items-center px-8 py-16">
                <Text className="text-5xl mb-4">🌿</Text>
                <Text className="text-base font-semibold text-gray-600 dark:text-gray-300 text-center">
                  Ningún bioequivalente para "{q}"
                </Text>
                <TouchableOpacity
                  onPress={() => setBioOnly(false)}
                  className="mt-4 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2"
                >
                  <Text className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                    Ver todos los resultados
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <EmptyState query={q ?? ""} onRetry={handleRefresh} />
            )
          ) : null
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
