import { useState } from "react";
import { View, Text, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DONATION_CONFIG } from "@/constants/donation";
import { formatCLP } from "@/lib/formatters";

interface Props {
  savings: number;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

export function DonationBanner({ savings }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (savings <= DONATION_CONFIG.threshold) return null;

  const { amounts } = DONATION_CONFIG;

  async function handleDonate(amount: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json() as { payment_url?: string; error?: string };
      if (!res.ok || !data.payment_url) {
        throw new Error(data.error ?? "Error al crear el pago");
      }
      await Linking.openURL(data.payment_url);
    } catch {
      setError("No se pudo abrir el pago. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 gap-3">
      {/* Header */}
      <View className="flex-row items-center gap-2">
        <Ionicons name="heart" size={16} color="#ef4444" />
        <Text className="text-sm font-bold text-rose-800 dark:text-rose-300 flex-1">
          ¿Te ayudamos a ahorrar {formatCLP(savings)}?
        </Text>
      </View>

      <Text className="text-xs text-rose-700 dark:text-rose-400 leading-4">
        ComparaFarma es gratuita y sin publicidad. Si te fue útil, apoya el proyecto con un aporte voluntario vía Khipu.
      </Text>

      {/* Botones de monto */}
      {loading ? (
        <View className="items-center py-2">
          <ActivityIndicator color="#ef4444" />
          <Text className="text-xs text-rose-400 mt-2">Abriendo Khipu...</Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {amounts.map((amount) => (
            <TouchableOpacity
              key={amount}
              onPress={() => handleDonate(amount)}
              activeOpacity={0.7}
              className="rounded-xl px-4 py-2 border bg-white dark:bg-gray-800 border-rose-200 dark:border-rose-700"
            >
              <Text className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                {formatCLP(amount)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error && (
        <Text className="text-xs text-red-500">{error}</Text>
      )}
    </View>
  );
}
