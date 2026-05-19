import { View, Text } from "react-native";
import { formatCLP } from "@/lib/formatters";

interface PriceChannelProps {
  label: string;
  price: number | null;
  isBest?: boolean;
}

export function PriceChannel({ label, price, isBest }: PriceChannelProps) {
  return (
    <View className="items-center flex-1">
      <Text className="text-xs text-gray-400 mb-1">{label}</Text>
      {price != null && Number.isFinite(price) ? (
        <Text
          className={`text-sm font-bold ${isBest ? "text-green-600" : "text-gray-800"}`}
        >
          {formatCLP(price)}
        </Text>
      ) : (
        <Text className="text-sm text-gray-300">—</Text>
      )}
      {isBest && (
        <View className="bg-green-100 rounded px-1 mt-0.5">
          <Text className="text-green-700 text-xs">✓ mejor</Text>
        </View>
      )}
    </View>
  );
}
