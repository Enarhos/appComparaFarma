import { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { MedicationResult, PharmacySlug } from "@/lib/types";
import { PriceRow } from "./PriceRow";
import { formatCLP } from "@/lib/formatters";
import { useFavoritesStore } from "@/store/favoritesStore";

interface MedicationCardProps {
  medication: MedicationResult;
  activePharmacies?: Set<PharmacySlug>;
}

export function MedicationCard({ medication, activePharmacies }: MedicationCardProps) {
  const { canonicalName, laboratory, isBioequivalent, prices, bestPrice, matchKey, imageUrl } = medication;

  const visiblePrices = activePharmacies
    ? prices.filter((p) => activePharmacies.has(p.pharmacySlug))
    : prices;

  const visibleBestPrice =
    visiblePrices.length > 0
      ? Math.min(...visiblePrices.map((p) => p.channels.effective))
      : bestPrice;
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const { toggle, isFavorite } = useFavoritesStore();
  const favorited = isFavorite(matchKey);

  function handleFavorite() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggle(medication);
  }

  function handlePress() {
    router.push({ pathname: "/medication", params: { key: matchKey } });
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
    <View className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-start justify-between gap-2">
          {imageUrl && !imgError && (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: 56, height: 56 }}
              className="rounded-lg bg-gray-50"
              resizeMode="contain"
              onError={() => setImgError(true)}
            />
          )}
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={2}>
              {canonicalName}
            </Text>
            {laboratory && (
              <Text className="text-xs text-gray-400 mt-0.5">{laboratory}</Text>
            )}
          </View>
          <View className="items-end gap-1">
            <TouchableOpacity onPress={handleFavorite} hitSlop={8}>
              <Ionicons
                name={favorited ? "heart" : "heart-outline"}
                size={20}
                color={favorited ? "#e11d48" : "#d1d5db"}
              />
            </TouchableOpacity>
            <Text className="text-xs text-gray-400">desde</Text>
            <Text className="text-lg font-extrabold text-green-600">
              {formatCLP(visibleBestPrice)}
            </Text>
          </View>
        </View>
        {isBioequivalent && (
          <View className="self-start bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 mt-2">
            <Text className="text-emerald-700 text-xs font-medium">Bioequivalente</Text>
          </View>
        )}
      </View>

      <View className="px-4 pb-3 border-t border-gray-50 dark:border-gray-700 mt-1">
        {visiblePrices.map((p) => (
          <PriceRow key={p.pharmacySlug} pharmacyPrice={p} />
        ))}
      </View>
    </View>
    </TouchableOpacity>
  );
}
