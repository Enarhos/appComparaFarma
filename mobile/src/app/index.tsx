import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ONBOARDING_KEY } from "./onboarding";
import { SearchBar } from "@/components/SearchBar";
import { FilterSheet } from "@/components/FilterSheet";
import { useHistoryStore } from "@/store/historyStore";
import { useLocationStore } from "@/store/locationStore";
import { useFilterStore } from "@/store/filterStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useSearchStore } from "@/store/searchStore";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { goToLogin } from "@/lib/authNavigation";
import { formatCLP } from "@/lib/formatters";
import { PHARMACIES } from "@/constants/pharmacies";
import type { PharmacySlug } from "@/lib/types";

const QUICK_SEARCHES = ["Paracetamol", "Ibuprofeno", "Amoxicilina", "Metformina", "Losartán", "Atorvastatina", "Omeprazol", "Sertralina"];

const _pharmNames = Object.values(PHARMACIES).map((p) => p.name.replace("Farmacias ", ""));
const PHARMACY_SUBTITLE =
  _pharmNames.slice(0, -1).join(", ") + " y " + _pharmNames[_pharmNames.length - 1];

export default function HomeScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      if (!val) {
        router.replace("/onboarding" as any);
      } else {
        setReady(true);
      }
    });
  }, []);

  const { items: recentSearches, remove, clear } = useHistoryStore();
  const { selectedCommuneName, selectedRegion } = useLocationStore();
  const { isPharmacyVisible } = useFilterStore();
  const { keys: favKeys, cachedResults } = useFavoritesStore();
  const setResults = useSearchStore((s) => s.setResults);
  const cartCount = useCartStore((s) => s.items.length);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const filteredOutCount = (Object.keys(PHARMACIES) as PharmacySlug[]).filter(
    (s) => !isPharmacyVisible(s)
  ).length;
  const totalFilterCount = filteredOutCount + (selectedCommuneName ? 1 : 0);

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
    router.push({ pathname: "/medication", params: { matchKey } });
  }

  const favMeds = favKeys.map((k) => cachedResults[k]).filter(Boolean);

  if (!ready) return null;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-12 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header: logo + acciones ── */}
        <View className="flex-row items-center mb-6">
          {/* Logo */}
          <View className="flex-row items-center gap-2 flex-1">
            <View className="bg-green-600 rounded-2xl w-10 h-10 items-center justify-center">
              <Ionicons name="search" size={20} color="#fff" />
            </View>
            <View>
              <Text className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight">ComparaFarma</Text>
              <Text className="text-xs text-gray-400 leading-tight">9 farmacias en Chile</Text>
            </View>
          </View>
          {/* Acciones */}
          <View className="flex-row gap-3 items-center">
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/onboarding" as any, params: { mode: "help" } })}
              hitSlop={12}
              accessibilityLabel="Ayuda"
              accessibilityRole="button"
            >
              <Ionicons name="help-circle-outline" size={26} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/cart" as any)}
              hitSlop={12}
              className="relative"
              accessibilityLabel={cartCount > 0 ? `Carrito, ${cartCount} medicamento${cartCount > 1 ? "s" : ""}` : "Carrito vacío"}
              accessibilityRole="button"
            >
              <Ionicons name="cart-outline" size={26} color="#16a34a" />
              {cartCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-green-600 rounded-full w-4 h-4 items-center justify-center">
                  <Text className="text-white text-xs font-bold leading-none">{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            {/* Identity Foundation (Épica 1, TASK-003): login/registro/logout
                son opcionales — no bloquean ningún flujo de búsqueda o
                comparación de precios (Principio 1, USER_DOMAIN_MODEL.md). */}
            <TouchableOpacity
              onPress={goToLogin}
              hitSlop={12}
              accessibilityLabel={isAuthenticated ? "Mi cuenta" : "Iniciar sesión"}
              accessibilityRole="button"
            >
              <Ionicons
                name="person-circle-outline"
                size={26}
                color={isAuthenticated ? "#16a34a" : "#9ca3af"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Hero ── */}
        <View className="bg-green-600 rounded-3xl px-5 py-5 mb-6 overflow-hidden">
          <Text className="text-2xl font-extrabold text-white leading-tight mb-1">
            Buscar{"\n"}medicamento
          </Text>
          <Text className="text-green-100 text-sm leading-snug">
            Encuentra el mejor precio entre{"\n"}
            <Text className="text-white font-semibold">múltiples farmacias</Text>
          </Text>
          {/* Decoración */}
          <View className="absolute right-4 top-3 opacity-20">
            <Ionicons name="medkit" size={90} color="#fff" />
          </View>
        </View>

        {/* Botón de filtros unificado */}
        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          activeOpacity={0.7}
          accessibilityLabel={totalFilterCount > 0 ? `Filtros activos: ${totalFilterCount}` : "Abrir filtros"}
          accessibilityRole="button"
          className={`mb-3 flex-row items-center gap-2 rounded-2xl px-4 py-3 border ${
            totalFilterCount > 0
              ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
              : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          }`}
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={totalFilterCount > 0 ? "#16a34a" : "#9ca3af"}
          />
          <View className="flex-1">
            {selectedCommuneName ? (
              <>
                <Text className="text-sm font-semibold text-green-700 dark:text-green-400">
                  📍 {selectedCommuneName}
                </Text>
                {selectedRegion && (
                  <Text className="text-xs text-gray-400" numberOfLines={1}>
                    {selectedRegion}
                  </Text>
                )}
              </>
            ) : (
              <Text className="text-sm text-gray-400">Sin filtros activos</Text>
            )}
          </View>
          {totalFilterCount > 0 ? (
            <View className="bg-green-600 rounded-full px-2 py-0.5">
              <Text className="text-white text-xs font-bold">{totalFilterCount}</Text>
            </View>
          ) : null}
          <Ionicons name="chevron-down" size={14} color="#9ca3af" />
        </TouchableOpacity>

        <SearchBar
          onSearch={handleSearch}
          suggestions={[...recentSearches, ...QUICK_SEARCHES]}
        />

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
                  accessibilityLabel={`${med.canonicalName}, desde ${formatCLP(med.bestPrice)}`}
                  accessibilityRole="button"
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
                accessibilityLabel={`Buscar ${term}`}
                accessibilityRole="button"
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
              <TouchableOpacity onPress={handleClear} hitSlop={12} accessibilityLabel="Borrar todo el historial" accessibilityRole="button">
                <Text className="text-xs text-red-400 font-medium">Borrar todo</Text>
              </TouchableOpacity>
            </View>
            {recentSearches.map((term) => (
              <View key={term} className="flex-row items-center border-b border-gray-100 dark:border-gray-800">
                <TouchableOpacity
                  onPress={() => handleSearch(term)}
                  className="flex-1 py-3 flex-row items-center"
                  accessibilityLabel={`Buscar ${term}`}
                  accessibilityRole="button"
                >
                  <Ionicons name="time-outline" size={16} color="#9ca3af" style={{ marginRight: 12 }} />
                  <Text className="text-gray-700 dark:text-gray-300">{term}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemove(term)} hitSlop={16} className="pl-3 py-3" accessibilityLabel={`Eliminar ${term}`} accessibilityRole="button">
                  <Ionicons name="close" size={16} color="#d1d5db" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {/* Categorías populares */}
        <View className="mt-6">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Categorías populares
          </Text>
          <View className="flex-row gap-2 flex-wrap">
            {[
              { label: "Analgésicos", icon: "fitness-outline", query: "Paracetamol" },
              { label: "Digestivos", icon: "nutrition-outline", query: "Omeprazol" },
              { label: "Alergias", icon: "flower-outline", query: "Loratadina" },
              { label: "Cardiovascular", icon: "heart-outline", query: "Losartán" },
              { label: "Vitaminas", icon: "sunny-outline", query: "Vitamina" },
            ].map(({ label, icon, query }) => (
              <TouchableOpacity
                key={label}
                onPress={() => handleSearch(query)}
                className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-3 py-2.5 flex-row items-center gap-2"
                style={{ shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 }}
                accessibilityLabel={`Buscar ${label}`}
                accessibilityRole="button"
              >
                <View className="bg-green-50 dark:bg-green-950 rounded-xl w-8 h-8 items-center justify-center">
                  <Ionicons name={icon as any} size={16} color="#16a34a" />
                </View>
                <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Banner: Ayúdanos a mejorar */}
        <TouchableOpacity
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onPress={() => router.push("/about" as any)}
          activeOpacity={0.8}
          accessibilityLabel="Ayúdanos a mejorar — enviar sugerencias"
          accessibilityRole="button"
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

      </ScrollView>

      {/* Footer fijo */}
      <View className="border-t border-gray-100 dark:border-gray-800 py-3 items-center bg-white dark:bg-gray-900">
        <Text className="text-xs text-gray-300 dark:text-gray-600">
          Hecho con ❤️ para los chilenos 🇨🇱
        </Text>
      </View>

      <FilterSheet visible={showFilters} onClose={() => setShowFilters(false)} />
    </SafeAreaView>
  );
}
