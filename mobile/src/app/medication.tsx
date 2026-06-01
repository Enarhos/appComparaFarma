import { useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, Linking, Image, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSearchStore } from "@/store/searchStore";
import { useCartStore } from "@/store/cartStore";
import { useConfigStore } from "@/store/configStore";
import { PHARMACIES } from "@/constants/pharmacies";
import { formatCLP, scrapedAgo } from "@/lib/formatters";
import type { PharmacyPrice, PharmacySlug } from "@/lib/types";

function getBestChannelLabel(prices: PharmacyPrice[], bestPharmacy: PharmacySlug, bestPrice: number): string | null {
  const p = prices.find((p) => p.pharmacySlug === bestPharmacy);
  if (!p) return null;
  const config = PHARMACIES[bestPharmacy];
  if (!config) return null;
  if (p.channels.sbpay === bestPrice && config.sbpayLabel) return config.sbpayLabel;
  if (p.channels.cmr === bestPrice && config.cardLabel) return config.cardLabel;
  if (p.channels.online === bestPrice) return "Online";
  return null;
}

function parseUnitQty(matchKey: string): { qty: number; perUnitLabel: string } | null {
  const parts = matchKey.split("|");
  // format: activo|dosis[|turno][|cantidad] — cantidad es siempre el último segmento numérico
  const last = parts[parts.length - 1] ?? "";
  const qty = parseInt(last, 10);
  if (isNaN(qty) || qty <= 1) return null;
  const dose = parts[1] ?? "";
  const perUnitLabel = dose.endsWith("ml") ? "c/ml" : "c/u";
  return { qty, perUnitLabel };
}

export default function MedicationScreen() {
  const { matchKey: key } = useLocalSearchParams<{ matchKey: string }>();
  const results = useSearchStore((s) => s.results);
  const [imgError, setImgError] = useState(false);
  const { add, remove, isInCart } = useCartStore();
  const isActive = useConfigStore((s) => s.isActive);
  const router = useRouter();

  const medication = results.find((r) => r.matchKey === key);
  const inCart = medication ? isInCart(medication.matchKey) : false;

  if (!medication) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <Text className="text-gray-400">Medicamento no encontrado</Text>
      </SafeAreaView>
    );
  }

  const med = medication;
  const { canonicalName, laboratory, isBioequivalent, prices, bestPrice, bestPharmacy, imageUrl, matchKey: medMatchKey } = med;
  const activePrices = prices.filter((p) => isActive(p.pharmacySlug));
  const unitQty = parseUnitQty(medMatchKey);

  function handleCartToggle() {
    if (inCart) {
      remove(med.matchKey);
    } else {
      add(med);
    }
  }

  async function handleShare() {
    const channelLabel = getBestChannelLabel(prices, bestPharmacy as PharmacySlug, bestPrice);
    const pharmacyName = PHARMACIES[bestPharmacy as PharmacySlug]?.name ?? bestPharmacy;
    const suffix = channelLabel ? ` (${channelLabel})` : "";
    try {
      await Share.share({
        message: `${canonicalName} — desde ${formatCLP(bestPrice)} en ${pharmacyName}${suffix} | ComparaFarma`,
      });
    } catch {
      // user cancelled
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <Stack.Screen options={{ title: canonicalName, headerTintColor: "#16a34a" }} />
      <ScrollView contentContainerClassName="px-4 py-4 gap-4">

        {/* Encabezado */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 gap-2">
          {imageUrl && !imgError && (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: 120, height: 120, alignSelf: "center" }}
              className="bg-gray-50 rounded-xl mb-2"
              resizeMode="contain"
              onError={() => setImgError(true)}
            />
          )}
          <View className="flex-row items-start justify-between">
            <Text className="text-xl font-bold text-gray-900 dark:text-white flex-1 mr-2">{canonicalName}</Text>
            <View className="flex-row items-center gap-3 mt-1">
              <TouchableOpacity onPress={handleCartToggle} hitSlop={8}>
                <Ionicons
                  name={inCart ? "cart" : "cart-outline"}
                  size={22}
                  color={inCart ? "#16a34a" : "#9ca3af"}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} hitSlop={8}>
                <Ionicons name="share-outline" size={22} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>
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
                Desde {formatCLP(bestPrice)} en {PHARMACIES[bestPharmacy as PharmacySlug]?.name ?? bestPharmacy}
              </Text>
            </View>
          </View>
        </View>

        {/* Banner: solo una farmacia tiene esta presentación */}
        {activePrices.length === 1 && (
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 flex-row items-start gap-3"
          >
            <Ionicons name="information-circle-outline" size={18} color="#d97706" style={{ marginTop: 1 }} />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Solo disponible en una farmacia
              </Text>
              <Text className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-4">
                Otras farmacias pueden tener esta molécula en distinta cantidad de unidades. Volver a resultados para comparar.
              </Text>
            </View>
            <Ionicons name="chevron-back" size={16} color="#d97706" style={{ marginTop: 1 }} />
          </TouchableOpacity>
        )}

        {/* Calculadora de ahorro */}
        <SavingsCard prices={activePrices} />

        {/* Una card por farmacia — solo farmacias activas */}
        {activePrices.map((p) => (
          <PharmacyDetail key={p.pharmacySlug} pharmacyPrice={p} unitQty={unitQty} />
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

function PharmacyDetail({ pharmacyPrice, unitQty }: { pharmacyPrice: PharmacyPrice; unitQty: { qty: number; perUnitLabel: string } | null }) {
  const { pharmacySlug, channels, hasStock, onlineUrl, fetchedAt, productName } = pharmacyPrice;
  const config = PHARMACIES[pharmacySlug];
  if (!config) return null;
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
          <PriceCol label="Presencial" price={channels.store} isBest={effective === channels.store} unitQty={unitQty} />
          {channels.online !== null && (
            <PriceCol label="Online" price={channels.online} isBest={effective === channels.online} unitQty={unitQty} />
          )}
          {channels.cmr !== null && config.cardLabel && (
            <PriceCol label={config.cardLabel} price={channels.cmr} isBest={effective === channels.cmr} unitQty={unitQty} />
          )}
          {channels.sbpay !== null && config.sbpayLabel && (
            <PriceCol label={config.sbpayLabel} price={channels.sbpay} isBest={effective === channels.sbpay} unitQty={unitQty} />
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

function SavingsCard({ prices }: { prices: PharmacyPrice[] }) {
  if (prices.length < 2) return null;

  const sorted = [...prices].sort((a, b) => a.channels.effective - b.channels.effective);
  const cheapest = sorted[0]!;
  const priciest = sorted[sorted.length - 1]!;
  const savings = priciest.channels.effective - cheapest.channels.effective;

  if (savings <= 0) return null;

  const pct = Math.round((savings / priciest.channels.effective) * 100);
  const cheapestName = PHARMACIES[cheapest.pharmacySlug]?.name ?? cheapest.pharmacySlug;
  const priestName = PHARMACIES[priciest.pharmacySlug]?.name.replace("Farmacias ", "") ?? priciest.pharmacySlug;

  return (
    <View className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-2xl p-4">
      <View className="flex-row items-center gap-2 mb-3">
        <Ionicons name="calculator-outline" size={16} color="#16a34a" />
        <Text className="text-sm font-bold text-green-800 dark:text-green-300">
          Calculadora de ahorro
        </Text>
      </View>

      <View className="flex-row justify-between mb-3">
        <View className="flex-1">
          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Más barato</Text>
          <Text className="text-lg font-extrabold text-green-600">
            {formatCLP(cheapest.channels.effective)}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
            {cheapestName}
          </Text>
        </View>

        <View className="items-center justify-center px-3">
          <Ionicons name="arrow-forward" size={16} color="#9ca3af" />
        </View>

        <View className="flex-1 items-end">
          <Text className="text-xs text-gray-400 mb-0.5">Más caro</Text>
          <Text className="text-lg font-bold text-gray-400 line-through">
            {formatCLP(priciest.channels.effective)}
          </Text>
          <Text className="text-xs text-gray-400" numberOfLines={1}>
            {priestName}
          </Text>
        </View>
      </View>

      <View className="bg-green-600 rounded-xl px-4 py-2.5 flex-row items-center justify-between">
        <Text className="text-white text-sm font-medium">
          Ahorras eligiendo {cheapestName.replace("Farmacias ", "")}
        </Text>
        <Text className="text-white font-extrabold text-base">
          {formatCLP(savings)}{" "}
          <Text className="text-green-200 text-xs font-medium">({pct}%)</Text>
        </Text>
      </View>
    </View>
  );
}

function PriceCol({ label, price, isBest, unitQty }: {
  label: string;
  price: number | null;
  isBest: boolean;
  unitQty: { qty: number; perUnitLabel: string } | null;
}) {
  const perUnit = unitQty && price ? Math.round(price / unitQty.qty) : null;
  return (
    <View className="flex-1 items-center">
      <Text className="text-xs text-gray-400 mb-1">{label}</Text>
      {price !== null ? (
        <>
          <Text className={`text-base font-bold ${isBest ? "text-green-600" : "text-gray-800 dark:text-gray-200"}`}>
            {formatCLP(price)}
          </Text>
          {perUnit && (
            <Text className="text-xs text-gray-400 mt-0.5">
              {formatCLP(perUnit)}{unitQty!.perUnitLabel}
            </Text>
          )}
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
