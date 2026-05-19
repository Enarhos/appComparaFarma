import { ScrollView, View, Text, TouchableOpacity, Linking, SafeAreaView, Image } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useSearchStore } from "@/store/searchStore";
import { PHARMACIES } from "@/constants/pharmacies";
import { formatCLP, scrapedAgo } from "@/lib/formatters";
import type { PharmacyPrice } from "@/lib/types";

export default function MedicationScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const results = useSearchStore((s) => s.results);
  const medication = results.find((r) => r.matchKey === key);

  if (!medication) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-400">Medicamento no encontrado</Text>
      </SafeAreaView>
    );
  }

  const { canonicalName, laboratory, isBioequivalent, prices, bestPrice, bestPharmacy, imageUrl } = medication;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: canonicalName, headerTintColor: "#16a34a" }} />
      <ScrollView contentContainerClassName="px-4 py-4 gap-4">

        {/* Encabezado */}
        <View className="bg-white rounded-2xl border border-gray-100 p-4 gap-2">
          {imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: 120, height: 120, alignSelf: "center" }}
              className="bg-gray-50 rounded-xl mb-2"
              resizeMode="contain"
            />
          )}
          <Text className="text-xl font-bold text-gray-900">{canonicalName}</Text>
          {laboratory && (
            <Text className="text-sm text-gray-400">{laboratory}</Text>
          )}
          <View className="flex-row items-center gap-2 flex-wrap">
            {isBioequivalent && (
              <View className="bg-emerald-50 border border-emerald-200 rounded-full px-3 py-0.5">
                <Text className="text-emerald-700 text-xs font-medium">Bioequivalente</Text>
              </View>
            )}
            <View className="bg-green-50 border border-green-200 rounded-full px-3 py-0.5">
              <Text className="text-green-700 text-xs font-medium">
                Desde {formatCLP(bestPrice)} en {bestPharmacy}
              </Text>
            </View>
          </View>
        </View>

        {/* Una card por farmacia */}
        {prices.map((p) => (
          <PharmacyDetail key={p.pharmacySlug} pharmacyPrice={p} />
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

function PharmacyDetail({ pharmacyPrice }: { pharmacyPrice: PharmacyPrice }) {
  const { pharmacySlug, channels, hasStock, onlineUrl, fetchedAt, productName } = pharmacyPrice;
  const config = PHARMACIES[pharmacySlug];
  const effective = channels.effective;

  function openUrl() {
    if (onlineUrl) Linking.openURL(onlineUrl);
  }

  return (
    <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header farmacia */}
      <View style={{ backgroundColor: config.bgLight }} className="px-4 py-3 flex-row items-center justify-between">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-2">
            <View style={{ backgroundColor: config.color }} className="w-2.5 h-2.5 rounded-full" />
            <Text style={{ color: config.color }} className="font-bold text-base">{config.name}</Text>
          </View>
          <Text className="text-xs text-gray-500 mt-0.5 ml-4" numberOfLines={1}>{productName}</Text>
        </View>
        <View className={`rounded-full px-2 py-0.5 ${hasStock ? "bg-green-100" : "bg-gray-100"}`}>
          <Text className={`text-xs font-medium ${hasStock ? "text-green-700" : "text-gray-400"}`}>
            {hasStock ? "En stock" : "Sin stock"}
          </Text>
        </View>
      </View>

      {/* Canales de precio */}
      <View className="px-4 py-3">
        <View className="flex-row">
          <PriceCol label="Presencial" price={channels.store} isBest={effective === channels.store} />
          {channels.online !== null && (
            <PriceCol label="Online" price={channels.online} isBest={effective === channels.online} />
          )}
          {channels.cmr !== null && config.cardLabel && (
            <PriceCol label={config.cardLabel} price={channels.cmr} isBest={effective === channels.cmr} />
          )}
          {channels.sbpay !== null && config.sbpayLabel && (
            <PriceCol label={config.sbpayLabel} price={channels.sbpay} isBest={effective === channels.sbpay} />
          )}
        </View>
      </View>

      {/* Footer: link + timestamp */}
      <View className="px-4 pb-3 flex-row items-center justify-between">
        <Text className="text-xs text-gray-300">{scrapedAgo(fetchedAt)}</Text>
        {onlineUrl && (
          <TouchableOpacity onPress={openUrl} className="bg-green-600 rounded-xl px-4 py-1.5">
            <Text className="text-white text-xs font-semibold">Ver en farmacia →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function PriceCol({ label, price, isBest }: { label: string; price: number | null; isBest: boolean }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-xs text-gray-400 mb-1">{label}</Text>
      {price !== null ? (
        <>
          <Text className={`text-base font-bold ${isBest ? "text-green-600" : "text-gray-800"}`}>
            {formatCLP(price)}
          </Text>
          {isBest && (
            <View className="bg-green-100 rounded px-1 mt-0.5">
              <Text className="text-green-700 text-xs">✓ mejor</Text>
            </View>
          )}
        </>
      ) : (
        <Text className="text-base text-gray-300">—</Text>
      )}
    </View>
  );
}
