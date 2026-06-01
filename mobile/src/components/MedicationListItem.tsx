import { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { useConfigStore } from "@/store/configStore";
import type { MedicationResult, PharmacySlug } from "@/lib/types";
import { PHARMACIES } from "@/constants/pharmacies";
import { formatCLP } from "@/lib/formatters";

interface Props {
  medication: MedicationResult;
  activePharmacies?: Set<PharmacySlug>;
}

export function MedicationListItem({ medication, activePharmacies }: Props) {
  const { canonicalName, laboratory, isBioequivalent, prices, matchKey, imageUrl, bestPrice, bestPharmacy } = medication;
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const isActive = useConfigStore((s) => s.isActive);

  const visiblePrices = prices.filter(
    (p) => isActive(p.pharmacySlug) && (!activePharmacies || activePharmacies.has(p.pharmacySlug))
  );

  // Mejor precio entre las farmacias visibles
  const visibleBest = visiblePrices.reduce<typeof visiblePrices[0] | null>((acc, p) => {
    if (!acc || p.channels.effective < acc.channels.effective) return p;
    return acc;
  }, null);

  const displayPrice = visibleBest?.channels.effective ?? bestPrice;
  const displayPharmacy = visibleBest
    ? (PHARMACIES[visibleBest.pharmacySlug]?.name ?? visibleBest.pharmacySlug)
    : (PHARMACIES[bestPharmacy as PharmacySlug]?.name ?? bestPharmacy);

  function handlePress() {
    router.push({ pathname: "/medication", params: { matchKey } });
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-4 py-3 flex-row items-center gap-3"
    >
      {/* Imagen o ícono placeholder */}
      {imageUrl && !imgError ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: 52, height: 52 }}
          className="rounded-xl bg-gray-50 dark:bg-gray-700"
          resizeMode="contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <View className="w-[52px] h-[52px] rounded-xl bg-gray-100 dark:bg-gray-700 items-center justify-center">
          <Text className="text-2xl">💊</Text>
        </View>
      )}

      {/* Nombre + lab + dots + bio */}
      <View className="flex-1 gap-0.5">
        <Text
          className="text-sm font-bold text-gray-900 dark:text-white leading-snug"
          numberOfLines={2}
        >
          {canonicalName}
        </Text>
        {laboratory && (
          <Text className="text-xs text-gray-400" numberOfLines={1}>
            {laboratory}
          </Text>
        )}
        <View className="flex-row items-center gap-2 mt-1 flex-wrap">
          {/* Puntos de color por farmacia disponible */}
          {visiblePrices.length > 0 && (
            <View className="flex-row gap-1 items-center">
              {visiblePrices.map((p) => {
                const ph = PHARMACIES[p.pharmacySlug];
                if (!ph) return null;
                return (
                  <View
                    key={p.pharmacySlug}
                    style={{ backgroundColor: ph.color }}
                    className="w-2 h-2 rounded-full"
                  />
                );
              })}
            </View>
          )}
          {isBioequivalent && (
            <View className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-full px-2 py-0.5">
              <Text className="text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                Bio
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Precio + farmacia */}
      {visiblePrices.length > 0 && (
        <View className="items-end gap-0.5">
          <Text className="text-base font-extrabold text-green-600">
            {formatCLP(displayPrice)}
          </Text>
          <Text className="text-xs text-gray-400 text-right" numberOfLines={1} style={{ maxWidth: 90 }}>
            {displayPharmacy.replace("Farmacias ", "")}
          </Text>
        </View>
      )}

      <Text className="text-gray-300 dark:text-gray-600 text-base">›</Text>
    </TouchableOpacity>
  );
}
