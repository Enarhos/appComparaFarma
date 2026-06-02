import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PHARMACIES } from "@/constants/pharmacies";
import type { PharmacySlug } from "@/lib/types";

type SortOption = "price" | "name";

interface Props {
  visible: boolean;
  onClose: () => void;
  activePharmacies: Set<PharmacySlug>;
  onTogglePharmacy: (slug: PharmacySlug) => void;
  onSelectAll: () => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  availableSlugs: PharmacySlug[];
}

const SCREEN_H = Dimensions.get("window").height;

export function FilterSheet({
  visible,
  onClose,
  activePharmacies,
  onTogglePharmacy,
  onSelectAll,
  sortBy,
  onSortChange,
  availableSlugs,
}: Props) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const [mounted, setMounted] = useState(false);

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
      }).start(() => setMounted(false));
    }
  }, [visible]);

  const allActive = availableSlugs.every((s) => activePharmacies.has(s));
  const activeCount = availableSlugs.filter((s) => activePharmacies.has(s)).length;

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
          maxHeight: SCREEN_H * 0.85,
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

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Farmacias */}
          <View className="px-6 pt-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Farmacias
              </Text>
              <TouchableOpacity onPress={onSelectAll} hitSlop={8}>
                <Text className="text-xs font-semibold text-green-600">
                  {allActive ? "Desmarcar todas" : "Todas"}
                </Text>
              </TouchableOpacity>
            </View>

            {availableSlugs.map((slug) => {
              const ph = PHARMACIES[slug];
              if (!ph) return null;
              const isActive = activePharmacies.has(slug);
              const isLast = slug === availableSlugs[availableSlugs.length - 1];
              return (
                <TouchableOpacity
                  key={slug}
                  onPress={() => onTogglePharmacy(slug)}
                  activeOpacity={0.7}
                  className={`flex-row items-center py-3.5 ${
                    !isLast ? "border-b border-gray-50" : ""
                  }`}
                >
                  <View
                    style={{ backgroundColor: isActive ? ph.color : "#d1d5db" }}
                    className="w-3 h-3 rounded-full mr-3"
                  />
                  <View className="flex-1">
                    <Text className={`text-base ${isActive ? "text-gray-900" : "text-gray-400"}`}>
                      {ph.name}
                    </Text>
                  </View>
                  <Switch
                    value={isActive}
                    onValueChange={() => onTogglePharmacy(slug)}
                    trackColor={{ false: "#e5e7eb", true: "#16a34a" }}
                    thumbColor="#ffffff"
                    ios_backgroundColor="#e5e7eb"
                  />
                </TouchableOpacity>
              );
            })}

            {activeCount < availableSlugs.length && (
              <View className="mt-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                <Text className="text-xs text-amber-700">
                  Mostrando {activeCount} de {availableSlugs.length} farmacias
                </Text>
              </View>
            )}
          </View>

          {/* Ordenar */}
          <View className="px-6 pt-6">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Ordenar por
            </Text>
            {(
              [
                { value: "price", label: "Precio más bajo primero", icon: "trending-down-outline" },
                { value: "name",  label: "Nombre A → Z",           icon: "text-outline" },
              ] as { value: SortOption; label: string; icon: string }[]
            ).map((opt) => {
              const selected = sortBy === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => onSortChange(opt.value)}
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
