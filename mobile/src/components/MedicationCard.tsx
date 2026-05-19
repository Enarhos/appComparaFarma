import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import type { MedicationResult } from "@/lib/types";
import { PriceRow } from "./PriceRow";
import { formatCLP } from "@/lib/formatters";

interface MedicationCardProps {
  medication: MedicationResult;
}

export function MedicationCard({ medication }: MedicationCardProps) {
  const { canonicalName, laboratory, isBioequivalent, prices, bestPrice, matchKey, imageUrl } = medication;
  const router = useRouter();

  function handlePress() {
    router.push({ pathname: "/medication", params: { key: matchKey } });
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
    <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-start justify-between gap-2">
          {imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: 56, height: 56 }}
              className="rounded-lg bg-gray-50"
              resizeMode="contain"
            />
          )}
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900" numberOfLines={2}>
              {canonicalName}
            </Text>
            {laboratory && (
              <Text className="text-xs text-gray-400 mt-0.5">{laboratory}</Text>
            )}
          </View>
          <View className="items-end">
            <Text className="text-xs text-gray-400">desde</Text>
            <Text className="text-lg font-extrabold text-green-600">
              {formatCLP(bestPrice)}
            </Text>
          </View>
        </View>
        {isBioequivalent && (
          <View className="self-start bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 mt-2">
            <Text className="text-emerald-700 text-xs font-medium">Bioequivalente</Text>
          </View>
        )}
      </View>

      <View className="px-4 pb-3 border-t border-gray-50 mt-1">
        {prices.map((p) => (
          <PriceRow key={p.pharmacySlug} pharmacyPrice={p} />
        ))}
      </View>
    </View>
    </TouchableOpacity>
  );
}
