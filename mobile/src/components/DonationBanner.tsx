import { View, Text, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DONATION_CONFIG } from "@/constants/donation";
import { formatCLP } from "@/lib/formatters";

interface Props {
  savings: number;
}

export function DonationBanner({ savings }: Props) {
  if (savings <= DONATION_CONFIG.threshold) return null;

  const { amounts, urls, otherAmountUrl } = DONATION_CONFIG;

  return (
    <View className="bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 gap-3">
      <View className="flex-row items-center gap-2">
        <Ionicons name="heart" size={16} color="#ef4444" />
        <Text className="text-sm font-bold text-rose-800 dark:text-rose-300 flex-1">
          ¿Te ayudamos a ahorrar {formatCLP(savings)}?
        </Text>
      </View>

      <Text className="text-xs text-rose-700 dark:text-rose-400 leading-4">
        ComparaFarma es gratuita y sin publicidad. Si te fue útil, apoya el proyecto con un aporte voluntario vía Khipu.
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {amounts.map((amount) => (
          <TouchableOpacity
            key={amount}
            onPress={() => Linking.openURL(urls[amount])}
            activeOpacity={0.7}
            className="rounded-xl px-4 py-2 border bg-white dark:bg-gray-800 border-rose-200 dark:border-rose-700"
          >
            <Text className="text-sm font-semibold text-rose-700 dark:text-rose-300">
              {formatCLP(amount)}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={() => Linking.openURL(otherAmountUrl)}
          activeOpacity={0.7}
          className="rounded-xl px-4 py-2 border bg-white dark:bg-gray-800 border-rose-200 dark:border-rose-700"
        >
          <Text className="text-sm font-semibold text-rose-700 dark:text-rose-300">
            Otro monto
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
