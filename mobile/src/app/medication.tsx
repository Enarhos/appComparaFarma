import { useState, useMemo, useEffect } from "react";
import { ScrollView, View, Text, TouchableOpacity, Linking, Share, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSearchStore } from "@/store/searchStore";
import { useCartStore } from "@/store/cartStore";
import { useConfigStore } from "@/store/configStore";
import { useFilterStore } from "@/store/filterStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useAlertsStore } from "@/store/alertsStore";
import { PHARMACIES } from "@/constants/pharmacies";
// DonationBanner: import retirado temporalmente del flujo visible de Mobile
// (decisión de producto 2026-08-15 — donaciones se retiran de Mobile durante
// la etapa inicial de adquisición de usuarios; Web sigue recibiendo donaciones
// vía Khipu sin cambios). El componente y sus constantes se conservan intactos
// para una futura reactivación — ver docs/operations/PLATFORM_OPERATIONAL_STATUS.md.
// import { DonationBanner } from "@/components/DonationBanner";
import { PharmacyLogo } from "@/components/PharmacyLogo";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { AlertSheet } from "@/components/AlertSheet";
import { formatCLP, scrapedAgo } from "@/lib/formatters";
import { recordPriceSnapshot, getPriceHistory, type PriceSnapshot } from "@/lib/priceHistory";
import { computeSavings } from "@comparafarma/domain";
import type { PharmacyPrice, PharmacySlug } from "@/lib/types";

type SortKey = "price-asc" | "price-desc";

function parseUnitQty(matchKey: string): { qty: number; perUnitLabel: string } | null {
  const parts = matchKey.split("|");
  const last = parts[parts.length - 1] ?? "";
  const qty = parseInt(last, 10);
  if (isNaN(qty) || qty <= 1) return null;
  const dose = parts[1] ?? "";
  return { qty, perUnitLabel: dose.endsWith("ml") ? "c/ml" : "c/u" };
}

export default function MedicationScreen() {
  const { matchKey: key } = useLocalSearchParams<{ matchKey: string }>();
  const results = useSearchStore((s) => s.results);
  const [imgError, setImgError] = useState(false);
  const [sort, setSort] = useState<SortKey>("price-asc");
  const [showAlert, setShowAlert] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PriceSnapshot[]>([]);
  const { add, remove: removeCart, isInCart } = useCartStore();
  const isActive = useConfigStore((s) => s.isActive);
  const isPharmacyVisible = useFilterStore((s) => s.isPharmacyVisible);
  const { keys: favKeys, toggle: toggleFav } = useFavoritesStore();
  const { getAlert } = useAlertsStore();
  const router = useRouter();

  const medication = results.find((r) => r.matchKey === key);
  const inCart = medication ? isInCart(medication.matchKey) : false;
  const isFav = medication ? favKeys.includes(medication.matchKey) : false;
  const hasAlert = medication ? !!getAlert(medication.matchKey) : false;

  if (!medication) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center gap-3">
        <Ionicons name="alert-circle-outline" size={48} color="#9ca3af" />
        <Text className="text-gray-400 text-base">Medicamento no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-green-600 rounded-2xl px-6 py-3">
          <Text className="text-white font-semibold">Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const med = medication;
  const { canonicalName, laboratory, isBioequivalent, prices, bestPrice, bestPharmacy, imageUrl, matchKey: medMatchKey } = med;

  const activePrices = useMemo(() =>
    prices.filter((p) => isActive(p.pharmacySlug) && isPharmacyVisible(p.pharmacySlug)),
    [prices, isActive, isPharmacyVisible]
  );

  const sortedPrices = useMemo(() => {
    const copy = [...activePrices];
    if (sort === "price-asc") copy.sort((a, b) => a.channels.effective - b.channels.effective);
    else copy.sort((a, b) => b.channels.effective - a.channels.effective);
    return copy;
  }, [activePrices, sort]);

  const unitQty = useMemo(() => parseUnitQty(medMatchKey), [medMatchKey]);

  // Registrar snapshot de precio y cargar historial al abrir el detalle
  // (recordPriceSnapshot debe terminar antes de leer, si no getPriceHistory
  // puede leer el storage previo al snapshot recién grabado)
  useEffect(() => {
    recordPriceSnapshot(medMatchKey, bestPrice, bestPharmacy).then(() =>
      getPriceHistory(medMatchKey).then(setPriceHistory)
    );
  }, [medMatchKey, bestPrice, bestPharmacy]);

  // computeSavings() no ordena ni filtra `sortedPrices` — recibe tal cual el
  // array ya construido arriba (que respeta el toggle de orden "price-asc"/
  // "price-desc" del usuario). Esto preserva a propósito un comportamiento
  // existente: si el usuario ordena por precio descendente, cheapest/
  // priciest quedan invertidos y `savings` da negativo, por lo que el
  // SavingsCard (guard `savings > 0`) simplemente no se muestra. No es un
  // bug que este PR deba corregir (ver packages/domain/src/savings.ts).
  const { cheapest, priciest, savings } = computeSavings(sortedPrices);
  const savingsPct = (savings > 0 && priciest)
    ? Math.round((savings / priciest.channels.effective) * 100)
    : 0;

  // activeSavings (alias de `savings` usado solo por el DonationBanner) se
  // retira junto con el banner — ver comentarios de import/render arriba.

  async function handleShare() {
    const pharmacyName = PHARMACIES[bestPharmacy as PharmacySlug]?.name ?? bestPharmacy;
    try {
      await Share.share({
        message: `${canonicalName} — desde ${formatCLP(bestPrice)} en ${pharmacyName} | ComparaFarma`,
      });
    } catch { /* user cancelled */ }
  }

  function handleCartToggle() {
    if (inCart) removeCart(med.matchKey);
    else add(med);
  }

  function handleFavToggle() {
    toggleFav(med);
  }

  const bestPharmacyName = PHARMACIES[bestPharmacy as PharmacySlug]?.name ?? bestPharmacy;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>

      {/* ── Header personalizado ── */}
      <View className="bg-white dark:bg-gray-900 px-4 pt-3 pb-4 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center gap-3 mb-2">
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} accessibilityLabel="Volver" accessibilityRole="button">
            <Ionicons name="arrow-back" size={22} color="#16a34a" />
          </TouchableOpacity>
          <View className="flex-1" />
          <TouchableOpacity onPress={handleFavToggle} hitSlop={12} accessibilityLabel={isFav ? "Quitar de favoritos" : "Agregar a favoritos"} accessibilityRole="button">
            <Ionicons name={isFav ? "heart" : "heart-outline"} size={22} color={isFav ? "#ef4444" : "#9ca3af"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowAlert(true)} hitSlop={12} accessibilityLabel={hasAlert ? "Alerta activa" : "Crear alerta de precio"} accessibilityRole="button">
            <Ionicons name={hasAlert ? "notifications" : "notifications-outline"} size={22} color={hasAlert ? "#f59e0b" : "#9ca3af"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCartToggle} hitSlop={12} accessibilityLabel={inCart ? "Quitar del carrito" : "Agregar al carrito"} accessibilityRole="button">
            <Ionicons name={inCart ? "cart" : "cart-outline"} size={22} color={inCart ? "#16a34a" : "#9ca3af"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} hitSlop={12} accessibilityLabel="Compartir precio" accessibilityRole="button">
            <Ionicons name="share-social-outline" size={22} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-3">
          {imageUrl && !imgError && (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: 56, height: 56 }}
              className="rounded-xl bg-gray-100"
              resizeMode="contain"
              onError={() => setImgError(true)}
            />
          )}
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900 dark:text-white leading-snug" numberOfLines={2}>
              {canonicalName}
            </Text>
            {laboratory && (
              <Text className="text-sm text-gray-400 mt-0.5" numberOfLines={1}>{laboratory}</Text>
            )}
            <View className="flex-row gap-2 mt-1 flex-wrap">
              {isBioequivalent && (
                <View className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-full px-2 py-0.5">
                  <Text className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold">Bioequivalente</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Banner resumen ── */}
        <View className="mx-4 mt-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-2xl px-4 py-3 flex-row items-center gap-3">
          <View className="bg-green-100 dark:bg-green-900 rounded-full p-2">
            <Ionicons name="pricetag-outline" size={16} color="#16a34a" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-green-800 dark:text-green-300">
              {activePrices.length === 1
                ? "Disponible en 1 farmacia"
                : `Hemos encontrado ${activePrices.length} precios en ${activePrices.length} farmacias`}
            </Text>
            <Text className="text-xs text-green-600 dark:text-green-500 mt-0.5">
              Mejor precio: {formatCLP(bestPrice)} en {bestPharmacyName.replace("Farmacias ", "")}
            </Text>
          </View>
        </View>

        {/* ── Aviso solo una farmacia ── */}
        {activePrices.length === 1 && (
          <View className="mx-4 mt-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 flex-row items-center gap-3">
            <Ionicons name="information-circle-outline" size={18} color="#d97706" />
            <Text className="text-xs text-amber-700 dark:text-amber-400 flex-1 leading-4">
              Otras farmacias pueden tener esta molécula en distinta presentación. Vuelve a buscar para comparar.
            </Text>
          </View>
        )}

        {/* ── Tabs de ordenamiento ── */}
        {activePrices.length > 1 && (
          <View className="mx-4 mt-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-1 flex-row">
            {([["price-asc", "Precio más bajo", "trending-down-outline"], ["price-desc", "Precio más alto", "trending-up-outline"]] as [SortKey, string, string][]).map(([key, label, icon]) => (
              <TouchableOpacity
                key={key}
                onPress={() => setSort(key)}
                className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl ${sort === key ? "bg-green-600" : ""}`}
                accessibilityRole="button"
                accessibilityLabel={label}
              >
                <Ionicons name={icon as any} size={14} color={sort === key ? "#fff" : "#9ca3af"} />
                <Text className={`text-xs font-semibold ${sort === key ? "text-white" : "text-gray-400"}`}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Cards de farmacia ── */}
        <View className="mx-4 mt-3 gap-3">
          {sortedPrices.map((p, index) => (
            <PharmacyCard
              key={p.pharmacySlug}
              pharmacyPrice={p}
              unitQty={unitQty}
              isBest={sort === "price-asc" ? index === 0 : false}
            />
          ))}
        </View>

        {/* ── Comparativa de ahorro ── */}
        {savings > 0 && cheapest && priciest && (
          <View className="mx-4 mt-4">
            <SavingsCard
              cheapest={cheapest}
              priciest={priciest}
              savings={savings}
              savingsPct={savingsPct}
            />
          </View>
        )}

        {/* ── Historial de precios ── */}
        {priceHistory.length >= 1 && (
          <View className="mx-4 mt-4">
            <PriceHistoryChart history={priceHistory} currentPrice={bestPrice} />
          </View>
        )}

        {/* ── Banner de donación — retirado temporalmente de Mobile (decisión de
            producto 2026-08-15). No renderizar en Mobile hasta nueva evaluación
            de políticas de Google Play / estrategia comercial. Web no se ve
            afectado. ── */}

        {/* ── Footer verificación ── */}
        <View className="mx-4 mt-4 flex-row items-center gap-2 justify-center">
          <Ionicons name="shield-checkmark-outline" size={14} color="#9ca3af" />
          <Text className="text-xs text-gray-400">Precios verificados hoy · Actualizados en tiempo real</Text>
        </View>

      </ScrollView>

      <AlertSheet
        visible={showAlert}
        onClose={() => setShowAlert(false)}
        matchKey={medMatchKey}
        canonicalName={canonicalName}
        currentPrice={bestPrice}
        bestPharmacy={bestPharmacy}
      />
    </SafeAreaView>
  );
}

function PharmacyCard({
  pharmacyPrice,
  unitQty,
  isBest,
}: {
  pharmacyPrice: PharmacyPrice;
  unitQty: { qty: number; perUnitLabel: string } | null;
  isBest: boolean;
}) {
  const { pharmacySlug, channels, hasStock, onlineUrl, fetchedAt, productName } = pharmacyPrice;
  const config = PHARMACIES[pharmacySlug];
  if (!config) return null;

  const effective = channels.effective;
  const perUnit = unitQty ? Math.round(effective / unitQty.qty) : null;

  // Canal que da el precio efectivo
  const channelLabel = (() => {
    if (channels.sbpay === effective && config.sbpayLabel) return config.sbpayLabel;
    if (channels.cmr === effective && config.cardLabel) return config.cardLabel;
    if (channels.online === effective) return "Online";
    return "Presencial";
  })();

  const hasAlternativeChannels = channels.online !== null || channels.cmr !== null || channels.sbpay !== null;

  function openUrl() {
    if (onlineUrl) Linking.openURL(onlineUrl);
  }

  return (
    <View
      className={`bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border ${
        isBest
          ? "border-green-300 dark:border-green-700"
          : "border-gray-100 dark:border-gray-800"
      }`}
      style={isBest ? { shadowColor: "#16a34a", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 } : undefined}
    >
      {/* Fila principal */}
      <View className="px-4 py-3 flex-row items-center gap-3">
        {/* Logo */}
        <View>
          <PharmacyLogo slug={pharmacySlug} size={48} />
        </View>

        {/* Nombre + producto */}
        <View className="flex-1 gap-0.5">
          <View className="flex-row items-center gap-2 flex-wrap">
            <Text className="text-sm font-bold text-gray-900 dark:text-white">{config.name}</Text>
            {isBest && (
              <View className="bg-green-600 rounded-full px-2 py-0.5">
                <Text className="text-white text-xs font-bold">MEJOR PRECIO</Text>
              </View>
            )}
          </View>
          <Text className="text-xs text-gray-400" numberOfLines={1}>{productName}</Text>
          <View className="flex-row items-center gap-1.5 mt-0.5 flex-wrap">
            <View className={`rounded-full px-2 py-0.5 ${hasStock ? "bg-green-50 dark:bg-green-950" : "bg-gray-100 dark:bg-gray-800"}`}>
              <Text className={`text-xs font-medium ${hasStock ? "text-green-700 dark:text-green-400" : "text-gray-400"}`}>
                {hasStock ? "✓ En stock" : "Sin stock"}
              </Text>
            </View>
            <View className="bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">
              <Text className="text-xs text-gray-500 dark:text-gray-400">{channelLabel}</Text>
            </View>
          </View>
        </View>

        {/* Precio */}
        <View className="items-end gap-0.5">
          <Text className={`text-xl font-extrabold ${isBest ? "text-green-600" : "text-gray-800 dark:text-gray-200"}`}>
            {formatCLP(effective)}
          </Text>
          {perUnit && (
            <Text className="text-xs text-gray-400">
              {formatCLP(perUnit)}{unitQty!.perUnitLabel}
            </Text>
          )}
        </View>
      </View>

      {/* Canales alternativos (si hay) */}
      {hasAlternativeChannels && (
        <View className="px-4 pb-2 flex-row gap-3">
          {channels.store !== null && (
            <ChannelChip label="Presencial" price={channels.store} isBest={effective === channels.store} />
          )}
          {channels.online !== null && (
            <ChannelChip label="Online" price={channels.online} isBest={effective === channels.online} />
          )}
          {channels.cmr !== null && config.cardLabel && (
            <ChannelChip label={config.cardLabel} price={channels.cmr} isBest={effective === channels.cmr} />
          )}
          {channels.sbpay !== null && config.sbpayLabel && (
            <ChannelChip label={config.sbpayLabel} price={channels.sbpay} isBest={effective === channels.sbpay} />
          )}
        </View>
      )}

      {/* Footer: timestamp + botón */}
      <View className="px-4 pb-3 flex-row items-center justify-between">
        <Text className="text-xs text-gray-300 dark:text-gray-600">{scrapedAgo(fetchedAt)}</Text>
        {onlineUrl ? (
          <TouchableOpacity
            onPress={openUrl}
            className="bg-green-600 rounded-xl px-4 py-1.5"
            accessibilityLabel={`Ver en ${config.name}`}
            accessibilityRole="link"
          >
            <Text className="text-white text-xs font-semibold">Ver en farmacia →</Text>
          </TouchableOpacity>
        ) : (
          <Text className="text-xs text-gray-300 dark:text-gray-600">Solo presencial</Text>
        )}
      </View>
    </View>
  );
}

function ChannelChip({ label, price, isBest }: { label: string; price: number | null; isBest: boolean }) {
  if (price === null) return null;
  return (
    <View className={`rounded-lg px-2 py-1 ${isBest ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800" : "bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"}`}>
      <Text className={`text-xs ${isBest ? "text-green-700 dark:text-green-400 font-semibold" : "text-gray-500 dark:text-gray-400"}`}>
        {label}: {formatCLP(price)}
      </Text>
    </View>
  );
}

function SavingsCard({
  cheapest,
  priciest,
  savings,
  savingsPct,
}: {
  cheapest: PharmacyPrice;
  priciest: PharmacyPrice;
  savings: number;
  savingsPct: number;
}) {
  const cheapName = PHARMACIES[cheapest.pharmacySlug]?.name.replace("Farmacias ", "") ?? cheapest.pharmacySlug;
  const priName = PHARMACIES[priciest.pharmacySlug]?.name.replace("Farmacias ", "") ?? priciest.pharmacySlug;

  return (
    <View className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <View className="bg-green-600 px-4 py-3 flex-row items-center gap-2">
        <Ionicons name="checkmark-circle" size={20} color="#fff" />
        <View>
          <Text className="text-white font-bold text-sm">¡Excelente elección!</Text>
          <Text className="text-green-100 text-xs">Elige {cheapName} y ahorra {formatCLP(savings)}</Text>
        </View>
        <View className="ml-auto bg-white/20 rounded-xl px-3 py-1">
          <Text className="text-white font-extrabold text-lg">{savingsPct}%</Text>
        </View>
      </View>

      {/* Comparativa */}
      <View className="px-4 py-3 flex-row items-center gap-3">
        <View className="flex-1 items-center gap-1">
          <Text className="text-xs text-green-600 font-semibold">Mejor precio</Text>
          <View className="flex-row items-center gap-2">
            <PharmacyLogo slug={cheapest.pharmacySlug} size={32} />
            <View>
              <Text className="text-xs text-gray-500">{cheapName}</Text>
              <Text className="text-lg font-extrabold text-green-600">{formatCLP(cheapest.channels.effective)}</Text>
            </View>
          </View>
        </View>

        <View className="bg-gray-100 dark:bg-gray-800 rounded-full w-9 h-9 items-center justify-center">
          <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold">VS</Text>
        </View>

        <View className="flex-1 items-center gap-1">
          <Text className="text-xs text-red-400 font-semibold">Precio más alto</Text>
          <View className="flex-row items-center gap-2">
            <PharmacyLogo slug={priciest.pharmacySlug} size={32} />
            <View>
              <Text className="text-xs text-gray-500">{priName}</Text>
              <Text className="text-lg font-bold text-red-400">{formatCLP(priciest.channels.effective)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Ahorro */}
      <View className="mx-4 mb-4 bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-900 rounded-xl px-4 py-2.5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons name="wallet-outline" size={16} color="#16a34a" />
          <Text className="text-sm text-green-800 dark:text-green-300 font-medium">Tu ahorro</Text>
        </View>
        <Text className="text-lg font-extrabold text-green-600">{formatCLP(savings)}</Text>
      </View>
    </View>
  );
}
