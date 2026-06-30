import { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useToastStore, type ToastPayload, type ToastType } from "@/store/toastStore";

const ICON: Record<ToastType, { name: string; color: string; bg: string }> = {
  alert: { name: "notifications", color: "#d97706", bg: "#fef3c7" },
  info:  { name: "information-circle", color: "#2563eb", bg: "#dbeafe" },
  success: { name: "checkmark-circle", color: "#16a34a", bg: "#dcfce7" },
  error: { name: "alert-circle", color: "#dc2626", bg: "#fee2e2" },
};

function ToastItem({ toast }: { toast: ToastPayload }) {
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const { dismiss } = useToastStore();
  const cfg = ICON[toast.type];

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });
  }, []);

  function handleDismiss() {
    opacity.value = withTiming(0, { duration: 180 });
    translateY.value = withTiming(-120, { duration: 200 }, () => {
      runOnJS(dismiss)(toast.id);
    });
  }

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={handleDismiss}
        activeOpacity={0.9}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#1f2937",
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginBottom: 8,
          gap: 12,
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: cfg.bg,
          alignItems: "center", justifyContent: "center",
        }}>
          <Ionicons name={cfg.name as any} size={20} color={cfg.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#f9fafb", fontWeight: "700", fontSize: 14, lineHeight: 18 }}>
            {toast.message}
          </Text>
          {toast.subtitle && (
            <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>
              {toast.subtitle}
            </Text>
          )}
        </View>
        <Ionicons name="close" size={18} color="#6b7280" />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function InAppToast() {
  const { toasts } = useToastStore();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: insets.top + 8,
        left: 16,
        right: 16,
        zIndex: 9999,
      }}
      pointerEvents="box-none"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </View>
  );
}
