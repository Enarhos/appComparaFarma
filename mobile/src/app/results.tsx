import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MedicationResult, PharmacySlug } from "@/lib/types";
import { useLocalSearchParams } from "expo-router";
import { MedicationListItem } from "@/components/MedicationListItem";
import { SkeletonCard } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import { FilterSheet } from "@/components/FilterSheet";
import { useSearchStore } from "@/store/searchStore";
import { useHistoryStore } from "@/store/historyStore";
import { useConfigStore } from "@/store/configStore";
import { useSearch } from "@/hooks/useSearch";
import { PHARMACIES } from "@/constants/pharmacies";

const TOOLTIP_KEY = "results_tooltip_v1_seen";

const SKELETON_KEYS = ["sk-0", "sk-1", "sk-2"];

type SortOption = "price" | "name";

export default function ResultsScreen() {
  const { q } = useLocalSearchParams<{ q: string }>();
  const { results, status, errorMessage } = useSearchStore();
  const { add: addToHistory } = useHistoryStore();
  const { search } = useSearch();
  const activePharmacySlugs = useConfigStore((s) => s.activePharmacySlugs);
  const configLoaded = useConfigStore((s) => s.loaded);

  const [bioOnly, setBioOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("price");
  const [activePharmacies, setActivePharmacies] = useState<Set<PharmacySlug>>(
    () => new Set(activePharmacySlugs())
  );
  const [showFilters, setShowFilters] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Sincronizar chips cuando configStore termina de cargar desde el backend
  useEffect(() => {
    setActivePharmacies(new Set(activePharmacySlugs()));
  }, [configLoaded]);

  useEffect(() => {
    if (q) {
      search(q);
      addToHistory(q);
    }
  }, [q, search, addToHistory]);

  // Mostrar tooltip la primera vez que hay resultados
  useEffect(() => {
    if (status !== "success" || results.length === 0) return;
    AsyncStorage.getItem(TOOLTIP_KEY).then((seen) => {
      if (!seen) setShowTooltip(true);
    });
  }, [status, results.length]);

  function handleRefresh() {
    if (q) search(q, true);
  }

  function togglePharmacy(slug: PharmacySlug) {
    setActivePharmacies((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        if (next.size === 1) return prev;
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  function selectAllPharmacies() {
    const all = new Set(activePharmacySlugs() as PharmacySlug[]);
    const allActive = availableSlugs.every((s) => activePharmacies.has(s));
    if (allActive) {
      // Dejar solo la primera activa (no puede quedar ninguna desactivada)
      setActivePharmacies(new Set([availableSlugs[0]]));
    } else {
      setActivePharmacies(all);
    }
  }

  const availableSlugs = (Object.keys(PHARMACIES) as PharmacySlug[]).filter((slug) =>
    activePharmacySlugs().includes(slug)
  );
  const filteredOutCount = availableSlugs.filter((s) => !activePharmacies.has(s)).length;

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
        <View className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-2 flex-row items-center gap-2">
          {/* Bio */}
          <TouchableOpacity
            onPress={() => setBioOnly((v) => !v)}
            className={`rounded-full px-3 py-1.5 border ${
              bioOnly
                ? "bg-emerald-50 border-emerald-500 dark:bg-emerald-950"
                : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
            }`}
          >
            <Text className={`text-xs font-medium ${
              bioOnly ? "text-emerald-700 dark:text-emerald-400" : "text-gray-500 dark:text-gray-300"
            }`}>
              🌿 Bio ({bioCount})
            </Text>
          </TouchableOpacity>

          <View className="flex-1" />

          {/* Dots de farmacias activas */}
          <View className="flex-row gap-1 items-center">
            {availableSlugs.map((slug) => {
              const ph = PHARMACIES[slug];
              if (!ph) return null;
              return (
                <View
                  key={slug}
                  style={{ backgroundColor: activePharmacies.has(slug) ? ph.color : "#e5e7eb" }}
                  className="w-2 h-2 rounded-full"
                />
              );
            })}
          </View>

          {/* Botón Filtrar con badge */}
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 border ${
              filteredOutCount > 0
                ? "bg-green-50 border-green-500 dark:bg-green-950"
                : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
            }`}
          >
            <Ionicons
              name="options-outline"
              size={13}
              color={filteredOutCount > 0 ? "#16a34a" : "#9ca3af"}
            />
            <Text className={`text-xs font-medium ${
              filteredOutCount > 0 ? "text-green-700 dark:text-green-400" : "text-gray-500 dark:text-gray-300"
            }`}>
              {filteredOutCount > 0 ? `Filtros (${filteredOutCount})` : "Filtrar"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Sheet de filtros */}
      <FilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        activePharmacies={activePharmacies}
        onTogglePharmacy={togglePharmacy}
        onSelectAll={selectAllPharmacies}
        sortBy={sortBy}
        onSortChange={setSortBy}
        availableSlugs={availableSlugs}
      />

      {/* Estado de carga descriptivo */}
      {isLoading && (
        <View className="flex-row items-center gap-2 px-4 py-3">
          <ActivityIndicator size="small" color="#16a34a" />
          <Text className="text-sm text-gray-400 dark:text-gray-500">
            Consultando {Object.values(PHARMACIES).map(p => p.name.replace("Farmacias ", "")).join(", ")}...
          </Text>
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

      {/* Tooltip primera vez */}
      {showTooltip && (
        <TouchableOpacity
          onPress={() => {
            setShowTooltip(false);
            AsyncStorage.setItem(TOOLTIP_KEY, "1");
          }}
          activeOpacity={0.9}
          className="mx-4 mt-3 bg-gray-900 dark:bg-gray-700 rounded-2xl px-4 py-3 flex-row items-center gap-3"
        >
          <Text className="text-xl">👆</Text>
          <View className="flex-1">
            <Text className="text-white text-sm font-semibold">
              Toca un medicamento para ver los precios
            </Text>
            <Text className="text-gray-400 text-xs mt-0.5">
              Compara por farmacia y canal de compra
            </Text>
          </View>
          <Ionicons name="close" size={16} color="#6b7280" />
        </TouchableOpacity>
      )}

      <FlatList
        data={(isLoading ? SKELETON_KEYS : displayResults) as (string | MedicationResult)[]}
        keyExtractor={(item) => (typeof item === "string" ? item : item.matchKey)}
        renderItem={({ item }) =>
          typeof item === "string" ? <SkeletonCard /> : <MedicationListItem medication={item} activePharmacies={activePharmacies} />
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
            refreshing={isLoading}
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
