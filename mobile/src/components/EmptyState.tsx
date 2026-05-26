import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  query: string;
  onRetry?: () => void;
}

const TIPS = [
  'Busca por principio activo: "paracetamol" en vez de "Tafirol".',
  'Omite la dosis: "ibuprofeno" en vez de "ibuprofeno 400mg x20".',
  "Revisa la ortografía del medicamento.",
];

export function EmptyState({ query, onRetry }: EmptyStateProps) {
  return (
    <View className="items-center px-8 py-14">
      <Text className="text-5xl mb-4">🔍</Text>
      <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 text-center mb-2">
        Sin resultados para "{query}"
      </Text>
      <Text className="text-sm text-gray-400 text-center mb-5">
        Ninguna farmacia encontró este medicamento. Prueba estas sugerencias:
      </Text>

      <View className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-5 gap-2">
        {TIPS.map((tip, i) => (
          <View key={i} className="flex-row gap-2">
            <Ionicons name="bulb-outline" size={14} color="#16a34a" style={{ marginTop: 2 }} />
            <Text className="flex-1 text-xs text-gray-600 dark:text-gray-400 leading-4">
              {tip}
            </Text>
          </View>
        ))}
      </View>

      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className="flex-row items-center gap-2 border border-green-600 rounded-xl px-5 py-2.5"
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={16} color="#16a34a" />
          <Text className="text-green-700 dark:text-green-400 font-semibold text-sm">
            Reintentar búsqueda
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
