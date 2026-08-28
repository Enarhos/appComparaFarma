import { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useConfigStore } from "@/store/configStore";
import { useLocationStore } from "@/store/locationStore";
import { sortByEffectivePrice } from "@comparafarma/domain";
import type { MedicationResult, PharmacySlug } from "@/lib/types";
import { PHARMACIES } from "@/constants/pharmacies";
import { formatCLP } from "@/lib/formatters";

interface Props {
  medication: MedicationResult;
  activePharmacies?: Set<PharmacySlug>;
}

export function MedicationListItem({ medication, activePharmacies }: Props) {
  const { canonicalName, laboratory, isBioequivalent, prices, matchKey, presentationKey, imageUrl, bestPrice, bestPharmacy } = medication;
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const isActive = useConfigStore((s) => s.isActive);
  const selectedCommune = useLocationStore((s) => s.selectedCommune);

  const visiblePrices = prices.filter(
    (p) => isActive(p.pharmacySlug) && (!activePharmacies || activePharmacies.has(p.pharmacySlug))
  );

  // Equivalencia con el reduce() anterior demostrada antes de migrar (Domain
  // Consolidation v4, PR refactor/domain-sort-effective-price): mismo
  // resultado por referencia de objeto en todos los casos, incluidos
  // empates, gracias a que Array.prototype.sort es estable.
  const visibleBest = sortByEffectivePrice(visiblePrices)[0] ?? null;

  const displayPrice = visibleBest?.channels.effective ?? bestPrice;
  const displayPharmacySlug = (visibleBest?.pharmacySlug ?? bestPharmacy) as PharmacySlug;
  const displayPharmacy = PHARMACIES[displayPharmacySlug]?.name ?? displayPharmacySlug;
  const displayColor = PHARMACIES[displayPharmacySlug]?.color ?? "#16a34a";

  function handlePress() {
    // CF-SEARCH-001 — se navega por `presentationKey`, no por `matchKey`.
    // Desde FASE 1 — Product Identity (2026-08-19) `mergeDuplicates` agrupa por
    // `presentationKey`, así que `matchKey` DEJÓ de ser único en la lista de
    // resultados: varias tarjetas distintas pueden compartirlo. La ficha
    // resolvía con `results.find(r => r.matchKey === key)` y devolvía siempre
    // la primera coincidencia — que, como la lista viene ordenada por precio,
    // es la más barata.
    //
    // Efecto observado en producción (query "tapsin", 2026-08-27): tocar
    // "Tapsin Rojo Dolor de Cabeza Tira x 6" (AraucoMed, $500, matchKey
    // `tapsin|6`) abría la ficha de "Tapsin X 6 Comprimidos" (EcoFarmacias,
    // $460, mismo `tapsin|6`) y el enlace llevaba a EcoFarmacias.
    //
    // `matchKey` se sigue enviando: es la clave de historial/alertas/
    // favoritos y el fallback para navegaciones emitidas antes de este cambio.
    router.push({ pathname: "/medication", params: { matchKey, presentationKey } });
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
      style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
    >
      <View className="px-4 py-3 flex-row items-center gap-3">
        {/* Imagen o placeholder */}
        {imageUrl && !imgError ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: 56, height: 56 }}
            className="rounded-xl bg-gray-50 dark:bg-gray-800"
            resizeMode="contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <View className="w-14 h-14 rounded-xl bg-gray-50 dark:bg-gray-800 items-center justify-center">
            <Text style={{ fontSize: 28 }}>💊</Text>
          </View>
        )}

        {/* Nombre + lab + dots */}
        <View className="flex-1 gap-0.5">
          <Text className="text-sm font-bold text-gray-900 dark:text-white leading-snug" numberOfLines={2}>
            {canonicalName}
          </Text>
          {laboratory && (
            <Text className="text-xs text-gray-400" numberOfLines={1}>{laboratory}</Text>
          )}
          <View className="flex-row items-center gap-2 mt-1.5 flex-wrap">
            {/* Dots de farmacias disponibles */}
            {visiblePrices.length > 0 && (
              <View className="flex-row gap-1 items-center">
                {visiblePrices.map((p) => {
                  const ph = PHARMACIES[p.pharmacySlug];
                  if (!ph) return null;
                  return ph.onlineOnly && selectedCommune ? (
                    <View key={p.pharmacySlug} className="flex-row items-center bg-blue-50 dark:bg-blue-950 rounded-full px-1.5 py-0.5">
                      <Text style={{ fontSize: 9, color: ph.color }}>🌐</Text>
                    </View>
                  ) : (
                    <View
                      key={p.pharmacySlug}
                      style={{ backgroundColor: ph.color }}
                      className="w-2 h-2 rounded-full"
                    />
                  );
                })}
              </View>
            )}
            {isBioequivalent && (
              <View className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-full px-2 py-0.5">
                <Text className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold">Bio</Text>
              </View>
            )}
          </View>
        </View>

        {/* Precio + farmacia */}
        {visiblePrices.length > 0 && (
          <View className="items-end gap-0.5">
            <Text className="text-lg font-extrabold" style={{ color: displayColor }}>
              {formatCLP(displayPrice)}
            </Text>
            <Text className="text-xs text-gray-400 text-right" numberOfLines={1} style={{ maxWidth: 90 }}>
              {displayPharmacy.replace("Farmacias ", "")}
            </Text>
          </View>
        )}

        <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
      </View>

      {/* Barra de color de la farmacia más barata (bottom accent) */}
      <View style={{ height: 3, backgroundColor: displayColor, opacity: 0.7 }} />
    </TouchableOpacity>
  );
}
