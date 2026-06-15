import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PHARMACIES } from "@/constants/pharmacies";
import type { PharmacySlug } from "@/lib/types";
import { useFilterStore } from "@/store/filterStore";
import { useLocationStore } from "@/store/locationStore";
import {
  getBranchIndex,
  getCommuneList,
  getPharmaciesForCommune,
  type BranchIndex,
} from "@/lib/branches";

interface CommuneItem {
  key: string;
  nombre: string;
  region: string;
}

const ALL_SLUGS = Object.keys(PHARMACIES) as PharmacySlug[];
const SCREEN_H = Dimensions.get("window").height;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function FilterSheet({ visible, onClose }: Props) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const [mounted, setMounted] = useState(false);

  // Stores
  const { activePharmacies, setActivePharmacies, sortBy, setSortBy, onlineSalesOnly, setOnlineSalesOnly } = useFilterStore();
  const { selectedCommune, selectedCommuneName, selectedRegion, setCommune, clearCommune } =
    useLocationStore();

  // Branch index
  const [branchIndex, setBranchIndex] = useState<BranchIndex | null>(null);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Commune search state
  const [communeQuery, setCommuneQuery] = useState("");
  const [showCommuneList, setShowCommuneList] = useState(false);
  const [showUnavailable, setShowUnavailable] = useState(false);

  // Carga el índice al abrir
  useEffect(() => {
    if (!visible) return;
    setLoadingBranches(true);
    getBranchIndex().then((idx) => {
      setBranchIndex(idx);
      setLoadingBranches(false);
    });
  }, [visible]);

  // Animación slide
  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_H,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setMounted(false);
        setShowCommuneList(false);
        setCommuneQuery("");
        setShowUnavailable(false);
      });
    }
  }, [visible]);

  // Conjunto activo (null = todas)
  const activeSet = activePharmacies ?? new Set(ALL_SLUGS);

  // Precalcular disponibilidad por comuna (una sola llamada)
  const communeAvailable =
    selectedCommune && branchIndex
      ? getPharmaciesForCommune(selectedCommune, branchIndex)
      : null;

  function isCommuneDisabled(slug: PharmacySlug): boolean {
    if (!communeAvailable || PHARMACIES[slug].onlineOnly) return false;
    return communeAvailable.length > 0 && !communeAvailable.includes(slug);
  }

  const disabledSlugs = ALL_SLUGS.filter(isCommuneDisabled);
  const availableSlugs = ALL_SLUGS.filter((s) => !isCommuneDisabled(s));
  const allActive = availableSlugs.every((s) => activeSet.has(s));
  const activeCount = availableSlugs.filter((s) => activeSet.has(s)).length;

  // Comunas filtradas para el dropdown
  const communes: CommuneItem[] = branchIndex ? getCommuneList(branchIndex) : [];
  const filteredCommunes =
    communeQuery.trim().length >= 1
      ? communes
          .filter(
            (c) =>
              c.nombre.toLowerCase().includes(communeQuery.toLowerCase()) ||
              c.region.toLowerCase().includes(communeQuery.toLowerCase())
          )
          .slice(0, 15)
      : communes.slice(0, 8);

  function togglePharmacy(slug: PharmacySlug) {
    const next = new Set(activeSet);
    if (next.has(slug)) {
      if (next.size === 1) return; // al menos una activa
      next.delete(slug);
    } else {
      next.add(slug);
    }
    setActivePharmacies(next);
  }

  function selectAllPharmacies() {
    if (allActive) {
      setActivePharmacies(new Set([availableSlugs[0]]));
    } else {
      setActivePharmacies(null); // null = todas
    }
  }

  function handleCommuneSelect(item: CommuneItem) {
    setCommune({ key: item.key, nombre: item.nombre, region: item.region });
    setCommuneQuery("");
    setShowCommuneList(false);

    // Auto-deshabilitar farmacias sin sucursal en la comuna
    if (branchIndex) {
      const available = getPharmaciesForCommune(item.key, branchIndex);
      if (available.length > 0) {
        const availableSet = new Set(available);
        const newActive = new Set(
          ALL_SLUGS.filter((s) => availableSet.has(s) || PHARMACIES[s].onlineOnly)
        );
        setActivePharmacies(newActive);
      }
    }
  }

  function handleCommuneClear() {
    clearCommune();
    setCommuneQuery("");
    setShowCommuneList(false);
    setActivePharmacies(null); // re-habilitar todas
  }

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}
        onPress={onClose}
      />

      {/* Sheet */}
      <Animated.View
        style={{
          transform: [{ translateY: slideAnim }],
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "white",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingBottom: 36,
          maxHeight: SCREEN_H * 0.88,
        }}
      >
        {/* Handle */}
        <View
          style={{
            width: 40,
            height: 4,
            backgroundColor: "#e5e7eb",
            borderRadius: 2,
            alignSelf: "center",
            marginTop: 12,
            marginBottom: 4,
          }}
        />

        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
          <Text className="text-lg font-bold text-gray-900">Filtros</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={12}
            className="bg-gray-100 rounded-full px-4 py-1.5"
          >
            <Text className="text-sm font-semibold text-gray-700">Listo</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── SECCIÓN UBICACIÓN ─── */}
          <View className="px-6 pt-5">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Ubicación
            </Text>

            {/* Input de búsqueda de comuna */}
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 gap-2">
              <Ionicons
                name="location-outline"
                size={16}
                color={selectedCommuneName ? "#16a34a" : "#9ca3af"}
              />
              <TextInput
                value={showCommuneList ? communeQuery : (selectedCommuneName ?? "")}
                onChangeText={(t) => {
                  setCommuneQuery(t);
                  setShowCommuneList(true);
                }}
                onFocus={() => setShowCommuneList(true)}
                placeholder="Buscar comuna..."
                placeholderTextColor="#9ca3af"
                style={{ flex: 1, fontSize: 14, color: "#111827" }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {(selectedCommuneName || showCommuneList) && (
                <TouchableOpacity
                  onPress={handleCommuneClear}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={16} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            {/* Dropdown de comunas */}
            {showCommuneList && (
              <View
                style={{
                  marginTop: 4,
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: "#f3f4f6",
                  borderRadius: 12,
                  overflow: "hidden",
                  maxHeight: 220,
                  elevation: 4,
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                }}
              >
                {loadingBranches ? (
                  <View className="py-5 items-center">
                    <ActivityIndicator size="small" color="#16a34a" />
                  </View>
                ) : (
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                  >
                    {/* Opción "Todas" */}
                    <TouchableOpacity
                      onPress={handleCommuneClear}
                      activeOpacity={0.7}
                      className="flex-row items-center gap-3 px-4 py-3 border-b border-gray-50"
                    >
                      <Ionicons name="globe-outline" size={15} color="#16a34a" />
                      <Text className="flex-1 text-sm font-medium text-green-700">
                        Todas las comunas
                      </Text>
                      {!selectedCommune && (
                        <Ionicons name="checkmark" size={16} color="#16a34a" />
                      )}
                    </TouchableOpacity>

                    {filteredCommunes.map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        onPress={() => handleCommuneSelect(item)}
                        activeOpacity={0.7}
                        className="flex-row items-center px-4 py-3 border-b border-gray-50"
                      >
                        <View className="flex-1">
                          <Text
                            className={`text-sm font-medium ${
                              item.key === selectedCommune
                                ? "text-green-700"
                                : "text-gray-800"
                            }`}
                          >
                            {item.nombre}
                          </Text>
                          <Text className="text-xs text-gray-400 mt-0.5">
                            {item.region}
                          </Text>
                        </View>
                        {item.key === selectedCommune && (
                          <Ionicons name="checkmark" size={16} color="#16a34a" />
                        )}
                      </TouchableOpacity>
                    ))}

                    {filteredCommunes.length === 0 && communeQuery.length > 0 && (
                      <View className="py-4 items-center">
                        <Text className="text-sm text-gray-400">
                          Sin resultados para "{communeQuery}"
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Indicador de comuna activa */}
            {selectedCommuneName && !showCommuneList && (
              <View className="mt-2 flex-row items-center gap-1.5">
                <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <Text className="text-xs text-green-700">
                  {selectedCommuneName}
                  {selectedRegion ? ` — ${selectedRegion}` : ""}
                </Text>
              </View>
            )}
          </View>

          {/* ─── SECCIÓN FARMACIAS ─── */}
          <View className="px-6 pt-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Farmacias
              </Text>
              <TouchableOpacity onPress={selectAllPharmacies} hitSlop={8}>
                <Text className="text-xs font-semibold text-green-600">
                  {allActive ? "Desmarcar todas" : "Todas"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Farmacias disponibles en la comuna (o todas si no hay comuna) */}
            {availableSlugs.map((slug, i) => {
              const ph = PHARMACIES[slug];
              if (!ph) return null;
              const isActive = activeSet.has(slug);
              const isLast = i === availableSlugs.length - 1 && disabledSlugs.length === 0;
              return (
                <TouchableOpacity
                  key={slug}
                  onPress={() => togglePharmacy(slug)}
                  activeOpacity={0.7}
                  className={`flex-row items-center py-3.5 ${
                    !isLast ? "border-b border-gray-50" : ""
                  }`}
                >
                  <View
                    style={{
                      backgroundColor: isActive ? ph.color : "#d1d5db",
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      marginRight: 12,
                    }}
                  />
                  <Text
                    className={`flex-1 text-base ${
                      isActive ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {ph.name}
                  </Text>
                  <View pointerEvents="none">
                    <Switch
                      value={isActive}
                      trackColor={{ false: "#e5e7eb", true: "#16a34a" }}
                      thumbColor="#ffffff"
                      ios_backgroundColor="#e5e7eb"
                    />
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Colapsible: sin sucursal en la comuna */}
            {disabledSlugs.length > 0 && (
              <>
                <TouchableOpacity
                  onPress={() => setShowUnavailable((v) => !v)}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-2 py-3 mt-0.5"
                >
                  <Ionicons name="storefront-outline" size={13} color="#9ca3af" />
                  <Text className="flex-1 text-xs text-gray-400">
                    {disabledSlugs.length} sin sucursal en {selectedCommuneName}
                  </Text>
                  <Ionicons
                    name={showUnavailable ? "chevron-up" : "chevron-down"}
                    size={13}
                    color="#9ca3af"
                  />
                </TouchableOpacity>

                {showUnavailable &&
                  disabledSlugs.map((slug) => {
                    const ph = PHARMACIES[slug];
                    if (!ph) return null;
                    return (
                      <View
                        key={slug}
                        className="flex-row items-center py-2.5 pl-1 border-b border-gray-50"
                      >
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#e5e7eb",
                            marginRight: 10,
                          }}
                        />
                        <Text className="text-sm text-gray-300">{ph.name}</Text>
                      </View>
                    );
                  })}
              </>
            )}

            {/* Banner: farmacias manualmente desactivadas */}
            {activeCount < availableSlugs.length && (
              <View className="mt-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                <Text className="text-xs text-amber-700">
                  Mostrando {activeCount} de {availableSlugs.length} farmacias disponibles
                </Text>
              </View>
            )}
          </View>

          {/* ─── SECCIÓN COMPRA ONLINE ─── */}
          <View className="px-6 pt-5">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Modo de compra
            </Text>
            <TouchableOpacity
              onPress={() => setOnlineSalesOnly(!onlineSalesOnly)}
              activeOpacity={0.7}
              className="flex-row items-center py-3.5"
            >
              <View className="flex-1">
                <Text className="text-base text-gray-900">Solo con despacho a domicilio</Text>
                <Text className="text-xs text-gray-400 mt-0.5">
                  Salcobrand, Dr. Simi, AraucoMed, EcoFarmacias, Farmex
                </Text>
              </View>
              <Switch
                value={onlineSalesOnly}
                onValueChange={setOnlineSalesOnly}
                trackColor={{ false: "#e5e7eb", true: "#16a34a" }}
                thumbColor="#ffffff"
                ios_backgroundColor="#e5e7eb"
              />
            </TouchableOpacity>
          </View>

          {/* ─── SECCIÓN ORDENAR ─── */}
          <View className="px-6 pt-6 pb-2">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Ordenar por
            </Text>
            {(
              [
                {
                  value: "price" as const,
                  label: "Precio más bajo primero",
                  icon: "trending-down-outline",
                },
                {
                  value: "name" as const,
                  label: "Nombre A → Z",
                  icon: "text-outline",
                },
              ]
            ).map((opt) => {
              const selected = sortBy === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setSortBy(opt.value)}
                  activeOpacity={0.7}
                  className="flex-row items-center py-3.5 border-b border-gray-50"
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                      selected ? "border-green-600" : "border-gray-300"
                    }`}
                  >
                    {selected && (
                      <View className="w-2.5 h-2.5 rounded-full bg-green-600" />
                    )}
                  </View>
                  <Ionicons
                    name={opt.icon as any}
                    size={16}
                    color={selected ? "#16a34a" : "#9ca3af"}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    className={`text-base ${
                      selected ? "text-green-700 font-semibold" : "text-gray-700"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
