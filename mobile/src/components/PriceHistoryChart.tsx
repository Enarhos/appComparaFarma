import { View, Text } from "react-native";
import type { PriceSnapshot } from "@/lib/priceHistory";
import { formatCLP } from "@/lib/formatters";

interface Props {
  history: PriceSnapshot[];
  currentPrice: number;
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function PriceHistoryChart({ history, currentPrice }: Props) {
  // Mostrar últimos 14 puntos máximo
  const data = history.slice(-14);

  if (data.length < 2) {
    return (
      <View
        className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-4 flex-row items-center gap-3"
        accessibilityLabel="Historial de precio disponible en tu próxima visita"
      >
        <Text className="text-xl">📈</Text>
        <Text className="flex-1 text-xs text-gray-400 dark:text-gray-500">
          Empezamos a registrar el historial de este precio. Vuelve en tu próxima visita para ver si bajó.
        </Text>
      </View>
    );
  }

  const prices = data.map((s) => s.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const range = maxPrice - minPrice || 1;

  const firstPrice = data[0].price;
  const priceDiff = currentPrice - firstPrice;
  const priceDiffPct = Math.round((priceDiff / firstPrice) * 100);
  const isBetter = priceDiff < 0;

  return (
    <View className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Historial de precio
          </Text>
          <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Últimos {data.length} registros
          </Text>
        </View>
        {priceDiffPct !== 0 && (
          <View className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 ${
            isBetter
              ? "bg-green-50 dark:bg-green-950"
              : "bg-red-50 dark:bg-red-950"
          }`}>
            <Text className={`text-xs font-bold ${
              isBetter ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
            }`}>
              {isBetter ? "▼" : "▲"} {Math.abs(priceDiffPct)}% vs hace {data.length - 1}d
            </Text>
          </View>
        )}
      </View>

      {/* Gráfico de barras */}
      <View className="px-4 pb-1">
        <View style={{ height: 72, flexDirection: "row", alignItems: "flex-end", gap: 3 }}>
          {data.map((snap, i) => {
            const isLast = i === data.length - 1;
            const normalized = (snap.price - minPrice) / range;
            const barHeight = Math.max(normalized * 52 + 10, 10);
            const isMin = snap.price === minPrice;

            return (
              <View
                key={`${snap.date}-${i}`}
                style={{
                  flex: 1,
                  height: barHeight,
                  borderRadius: 3,
                  backgroundColor: isLast
                    ? "#16a34a"
                    : isMin
                    ? "#86efac"   // verde claro para mínimo histórico
                    : "#e5e7eb",  // gris para el resto
                }}
              />
            );
          })}
        </View>

        {/* Eje X: primera y última fecha */}
        <View className="flex-row justify-between mt-1.5 mb-2">
          <Text className="text-xs text-gray-300 dark:text-gray-600">
            {formatDate(data[0].date)}
          </Text>
          <Text className="text-xs font-semibold text-green-600 dark:text-green-400">
            {formatCLP(currentPrice)} hoy
          </Text>
          <Text className="text-xs text-gray-300 dark:text-gray-600">
            {formatDate(data[data.length - 1].date)}
          </Text>
        </View>
      </View>

      {/* Rango */}
      {minPrice !== maxPrice && (
        <View className="px-4 pb-3 flex-row justify-between">
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-green-300" />
            <Text className="text-xs text-gray-400">
              Mín: <Text className="font-semibold text-gray-700 dark:text-gray-300">{formatCLP(minPrice)}</Text>
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-gray-300" />
            <Text className="text-xs text-gray-400">
              Máx: <Text className="font-semibold text-gray-700 dark:text-gray-300">{formatCLP(maxPrice)}</Text>
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
