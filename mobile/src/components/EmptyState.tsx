import { View, Text } from "react-native";

interface EmptyStateProps {
  query: string;
}

export function EmptyState({ query }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="text-4xl mb-4">💊</Text>
      <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 text-center mb-2">
        Sin resultados para "{query}"
      </Text>
      <Text className="text-sm text-gray-400 text-center">
        Intenta buscar por principio activo (ej: "paracetamol") o por nombre comercial sin dosis ni forma farmacéutica.
      </Text>
    </View>
  );
}
