import { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useConfigStore } from "@/store/configStore";
import type { MedicationResult, PharmacySlug } from "@/lib/types";

interface Props {
  medication: MedicationResult;
  activePharmacies?: Set<PharmacySlug>;
}

export function MedicationListItem({ medication, activePharmacies }: Props) {
  const { canonicalName, laboratory, isBioequivalent, prices, matchKey, imageUrl } = medication;
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const isActive = useConfigStore((s) => s.isActive);

  const visiblePrices = prices.filter(
    (p) => isActive(p.pharmacySlug) && (!activePharmacies || activePharmacies.has(p.pharmacySlug))
  );

  const pharmacyCount = visiblePrices.length;

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
          <Ionicons name="medkit-outline" size={24} color="#9ca3af" />
        </View>
      )}

      {/* Nombre + lab + badges */}
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
        <View className="flex-row flex-wrap gap-1.5 mt-1">
          {isBioequivalent && (
            <View className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-full px-2 py-0.5">
              <Text className="text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                Bioequivalente
              </Text>
            </View>
          )}
          {pharmacyCount > 0 && (
            <View className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full px-2 py-0.5">
              <Text className="text-gray-500 dark:text-gray-400 text-xs">
                {pharmacyCount} farmacia{pharmacyCount !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
    </TouchableOpacity>
  );
}
