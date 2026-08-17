import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { computeAllInOneTotals } from "@comparafarma/domain";
import { useCartStore } from "@/store/cartStore";
import { useConfigStore } from "@/store/configStore";
import { PHARMACIES } from "@/constants/pharmacies";
import { BRAND_COLORS } from "@/constants/brand";
import { formatCLP } from "@/lib/formatters";

export default function CartScreen() {
  const { items, remove, clear } = useCartStore();
  const activePharmacySlugs = useConfigStore((s) => s.activePharmacySlugs);

  const totals = computeAllInOneTotals(items, activePharmacySlugs());
  const completeTotals = totals.filter((t) => t.missing === 0);
  const best = completeTotals[0];
  const second = completeTotals[1];
  const savings = best && second ? second.total - best.total : 0;
  const hasPartial = totals.some((t) => t.missing > 0);

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center px-8">
        <Stack.Screen options={{ title: "Lista de compras", headerTintColor: BRAND_COLORS.indigo }} />
        <Ionicons name="cart-outline" size={64} color="#d1d5db" />
        <Text className="text-lg font-semibold text-gray-500 dark:text-gray-400 mt-4 text-center">
          Tu lista está vacía
        </Text>
        <Text className="text-sm text-gray-400 dark:text-gray-600 mt-2 text-center leading-5">
          Entra al detalle de un medicamento y toca el ícono 🛒 para agregarlo aquí
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <Stack.Screen
        options={{ title: `Lista (${items.length})`, headerTintColor: BRAND_COLORS.indigo }}
      />
      <ScrollView contentContainerClassName="px-4 py-4 gap-4">

        {/* Medicamentos en la lista */}
        <View>
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Medicamentos ({items.length})
          </Text>
          <View className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {items.map((med, index) => (
              <View
                key={med.matchKey}
                className={`flex-row items-center px-4 py-3 gap-3 ${
                  index < items.length - 1
                    ? "border-b border-gray-50 dark:border-gray-700"
                    : ""
                }`}
              >
                <View className="w-2 h-2 rounded-full bg-green-400" />
                <View className="flex-1">
                  <Text
                    className="text-sm font-semibold text-gray-900 dark:text-white"
                    numberOfLines={1}
                  >
                    {med.canonicalName}
                  </Text>
                  {med.laboratory && (
                    <Text className="text-xs text-gray-400">{med.laboratory}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => remove(med.matchKey)} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color="#d1d5db" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Tabla comparativa por farmacia */}
        <View>
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            ¿Dónde sale más barato el total?
          </Text>
          <View className="gap-2">
            {totals.map((t, index) => {
              const ph = PHARMACIES[t.pharmacySlug];
              if (!ph) return null;
              const isWinner = index === 0 && t.missing === 0;
              return (
                <View
                  key={t.pharmacySlug}
                  style={
                    isWinner
                      ? { borderColor: ph.color, backgroundColor: ph.bgLight }
                      : undefined
                  }
                  className={`rounded-2xl border px-4 py-3 flex-row items-center gap-3 ${
                    isWinner
                      ? "border-2"
                      : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                  }`}
                >
                  <View className="w-8 items-center">
                    {isWinner ? (
                      <Text className="text-lg">🥇</Text>
                    ) : (
                      <Text className="text-sm font-bold text-gray-400">
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  <View
                    style={{ backgroundColor: ph.color }}
                    className="w-2.5 h-2.5 rounded-full"
                  />
                  <View className="flex-1">
                    <Text
                      style={isWinner ? { color: ph.color } : undefined}
                      className="text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      {ph.name.replace("Farmacias ", "")}
                    </Text>
                    {t.missing > 0 && (
                      <Text className="text-xs text-amber-500">
                        Solo tiene {t.found} de {items.length}
                      </Text>
                    )}
                  </View>
                  <View className="items-end">
                    <Text
                      className={`text-base font-extrabold ${
                        isWinner
                          ? "text-green-600"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {formatCLP(t.total)}
                      {t.missing > 0 && (
                        <Text className="text-xs font-normal text-gray-400"> *</Text>
                      )}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {hasPartial && (
            <Text className="text-xs text-gray-400 dark:text-gray-600 mt-2 ml-1">
              * precio parcial — no incluye todos los medicamentos de la lista
            </Text>
          )}
        </View>

        {/* Banner ahorro */}
        {savings > 0 && best && second && (
          <View className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-2xl px-4 py-4 flex-row items-center gap-3">
            <View className="bg-green-100 dark:bg-green-900 rounded-full p-2">
              <Ionicons name="sparkles-outline" size={18} color="#16a34a" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-green-800 dark:text-green-300">
                Ahorras {formatCLP(savings)} comprando todo en{" "}
                {(PHARMACIES[best.pharmacySlug]?.name ?? best.pharmacySlug).replace("Farmacias ", "")}
              </Text>
              <Text className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                vs {(PHARMACIES[second.pharmacySlug]?.name ?? second.pharmacySlug).replace("Farmacias ", "")} (
                {formatCLP(second.total)})
              </Text>
            </View>
          </View>
        )}

        {/* Limpiar */}
        <TouchableOpacity onPress={clear} className="items-center py-2 mb-2">
          <Text className="text-sm text-red-400 font-medium">Limpiar lista</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
