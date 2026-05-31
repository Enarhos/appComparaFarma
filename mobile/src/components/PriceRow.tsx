import { View, TouchableOpacity, Text, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { PharmacyPrice } from "@/lib/types";
import { PHARMACIES } from "@/constants/pharmacies";
import { PharmacyBadge } from "./PharmacyBadge";
import { PriceChannel } from "./PriceChannel";

interface PriceRowProps {
  pharmacyPrice: PharmacyPrice;
}

export function PriceRow({ pharmacyPrice }: PriceRowProps) {
  const { pharmacySlug, channels, onlineUrl, nearExpiry } = pharmacyPrice;
  const config = PHARMACIES[pharmacySlug];
  const effective = channels.effective;

  const storeBest  = effective === channels.store;
  const onlineBest = channels.online !== null && effective === channels.online;
  const cardBest   = channels.cmr   !== null && effective === channels.cmr;
  const sbpayBest  = channels.sbpay !== null && effective === channels.sbpay;

  return (
    <View className="py-3 border-b border-gray-50 last:border-b-0">
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <PharmacyBadge slug={pharmacySlug} />
          {nearExpiry && (
            <View className="flex-row items-center gap-0.5 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-full px-2 py-0.5">
              <Ionicons name="time-outline" size={10} color="#d97706" />
              <Text className="text-amber-700 dark:text-amber-400 text-xs font-medium ml-0.5">Próx. a vencer</Text>
            </View>
          )}
        </View>
        {onlineUrl && (
          <TouchableOpacity onPress={() => Linking.openURL(onlineUrl)} hitSlop={8}>
            <Text className="text-xs text-green-600 font-medium">Ver →</Text>
          </TouchableOpacity>
        )}
      </View>
      <View className="flex-row">
        <PriceChannel label="Presencial" price={channels.store} isBest={storeBest} />
        <PriceChannel label="Online" price={channels.online} isBest={onlineBest} />
        {config.cardLabel && (
          <PriceChannel label={config.cardLabel} price={channels.cmr} isBest={cardBest} />
        )}
        {config.sbpayLabel && (
          <PriceChannel label={config.sbpayLabel} price={channels.sbpay} isBest={sbpayBest} />
        )}
      </View>
    </View>
  );
}
