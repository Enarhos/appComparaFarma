import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAlertsStore } from "@/store/alertsStore";
import { formatCLP } from "@/lib/formatters";

const SCREEN_H = Dimensions.get("window").height;

interface Props {
  visible: boolean;
  onClose: () => void;
  matchKey: string;
  canonicalName: string;
  currentPrice: number;
  bestPharmacy: string;
}

export function AlertSheet({ visible, onClose, matchKey, canonicalName, currentPrice, bestPharmacy }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const [mounted, setMounted] = useState(false);
  const [targetInput, setTargetInput] = useState("");

  const { getAlert, setAlert, removeAlert } = useAlertsStore();
  const existing = getAlert(matchKey);

  // Pre-rellenar con 10% menos del precio actual o la alerta existente
  useEffect(() => {
    if (visible) {
      const suggested = existing?.targetPrice ?? Math.round(currentPrice * 0.9);
      setTargetInput(String(suggested));
    }
  }, [visible, existing, currentPrice]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 12 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 220, useNativeDriver: true }).start(() => setMounted(false));
    }
  }, [visible]);

  const targetPrice = parseInt(targetInput.replace(/\D/g, ""), 10);
  const isValid = !isNaN(targetPrice) && targetPrice > 0 && targetPrice < currentPrice;
  const discount = isValid ? Math.round(((currentPrice - targetPrice) / currentPrice) * 100) : 0;

  function handleSave() {
    if (!isValid) return;
    setAlert({ matchKey, canonicalName, targetPrice, bestPharmacy });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  }

  function handleRemove() {
    removeAlert(matchKey);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  }

  function adjustTarget(delta: number) {
    const current = parseInt(targetInput.replace(/\D/g, ""), 10) || currentPrice;
    const next = Math.max(1, current + delta);
    setTargetInput(String(next));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }} onPress={onClose} />

      <Animated.View
        style={{
          transform: [{ translateY: slideAnim }],
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingBottom: 36,
        }}
      >
        {/* Handle */}
        <View style={{ width: 40, height: 4, backgroundColor: isDark ? "#374151" : "#e5e7eb", borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 }} />

        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <View className="flex-row items-center gap-2">
            <Ionicons name="notifications-outline" size={20} color="#f59e0b" />
            <Text className="text-lg font-bold text-gray-900 dark:text-white">Alerta de precio</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={12} className="bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-1.5">
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200">Cerrar</Text>
          </TouchableOpacity>
        </View>

        <View className="px-6 pt-5">
          {/* Medicamento */}
          <Text className="text-sm text-gray-500 dark:text-gray-400" numberOfLines={1}>{canonicalName}</Text>
          <View className="flex-row items-center justify-between mt-1 mb-5">
            <Text className="text-xs text-gray-400">Precio actual</Text>
            <Text className="text-lg font-bold text-gray-900 dark:text-white">{formatCLP(currentPrice)}</Text>
          </View>

          {/* Input del precio objetivo */}
          <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
            Avísame si baja de
          </Text>

          <View className="flex-row items-center gap-3 mb-2">
            <TouchableOpacity
              onPress={() => adjustTarget(-500)}
              className="bg-gray-100 dark:bg-gray-700 rounded-full w-10 h-10 items-center justify-center"
            >
              <Ionicons name="remove" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
            </TouchableOpacity>

            <View className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 flex-row items-center justify-center gap-1">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">$</Text>
              <TextInput
                value={targetInput}
                onChangeText={(t) => setTargetInput(t.replace(/\D/g, ""))}
                keyboardType="number-pad"
                style={{ fontSize: 24, fontWeight: "800", color: isDark ? "#f9fafb" : "#111827", minWidth: 80, textAlign: "center" }}
                selectTextOnFocus
              />
            </View>

            <TouchableOpacity
              onPress={() => adjustTarget(500)}
              className="bg-gray-100 dark:bg-gray-700 rounded-full w-10 h-10 items-center justify-center"
            >
              <Ionicons name="add" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
            </TouchableOpacity>
          </View>

          {/* Indicador de descuento */}
          {isValid && (
            <View className="flex-row justify-center mb-4">
              <View className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-full px-3 py-1">
                <Text className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                  {discount}% menos que el precio actual
                </Text>
              </View>
            </View>
          )}

          {!isValid && targetInput.length > 0 && (
            <Text className="text-xs text-red-400 text-center mb-4">
              El precio objetivo debe ser menor al precio actual ({formatCLP(currentPrice)})
            </Text>
          )}

          {/* Botones */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={!isValid}
            className={`rounded-2xl py-4 items-center mb-3 ${isValid ? "bg-amber-500" : "bg-gray-200 dark:bg-gray-700"}`}
          >
            <Text className={`font-bold text-base ${isValid ? "text-white" : "text-gray-400"}`}>
              {existing ? "Actualizar alerta" : "Crear alerta"}
            </Text>
          </TouchableOpacity>

          {existing && (
            <TouchableOpacity onPress={handleRemove} className="rounded-2xl py-3 items-center border border-red-200 dark:border-red-800">
              <Text className="text-sm font-semibold text-red-500">Eliminar alerta</Text>
            </TouchableOpacity>
          )}

          <Text className="text-xs text-gray-400 text-center mt-4 leading-4">
            Te avisaremos en la app cuando busques este medicamento y el precio baje del objetivo.
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
}
