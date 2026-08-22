import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { getCurrentSession } from "@/lib/sessionManager";
import { deleteAccount, type DeleteAccountResult } from "@/lib/deleteAccount";

const SCREEN_H = Dimensions.get("window").height;

interface Props {
  visible: boolean;
  onClose: () => void;
}

// AUTH-DELETE-02 (Mobile) — bottom sheet de "Eliminar cuenta", CTO Gate 2
// (diseño aprobado: sin confirmación de texto tipeado ni checkbox — la
// contraseña + un paso de confirmación final separado dan la fricción
// intencional necesaria). Mismo esqueleto que AlertSheet.tsx/FilterSheet.tsx
// (Modal nativo + Animated, backdrop, handle, header con botón "Cerrar"),
// con DOS pasos internos en vez de un solo sheet sobrecargado:
//   Step A: explicación (qué se borra / qué se conserva) + contraseña
//   Step B: confirmación final, irreversible
//
// El botón físico de retroceso de Android cierra el sheet en cualquier paso
// (onRequestClose, igual que los otros 3 sheets del proyecto) — nunca
// ejecuta el borrado.
type Step = "form" | "confirm" | "processing";

export function DeleteAccountSheet({ visible, onClose }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const [mounted, setMounted] = useState(false);

  const [step, setStep] = useState<Step>("form");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [subscriptionNotice, setSubscriptionNotice] = useState<string | null>(null);

  const signOut = useAuthStore((s) => s.signOut);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 12 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 220, useNativeDriver: true }).start(() => setMounted(false));
    }
  }, [visible]);

  // Reset del estado interno cada vez que el sheet se cierra — nunca dejar
  // la contraseña ni un error viejo esperando la próxima apertura.
  useEffect(() => {
    if (!visible) {
      setStep("form");
      setPassword("");
      setError(null);
      setSubscriptionNotice(null);
    }
  }, [visible]);

  function handleContinue() {
    setError(null);
    if (!password) {
      setError("Ingresa tu contraseña actual.");
      return;
    }
    setStep("confirm");
  }

  function handleBackToForm() {
    setError(null);
    setSubscriptionNotice(null);
    setStep("form");
  }

  // Gate 2.1 (hardening): se limpia el estado sensible de forma síncrona y
  // directa en el momento de cerrar — no se depende únicamente del efecto
  // que observa `visible` (que sigue existiendo como respaldo). Todo punto
  // de cierre (backdrop, botón "Cerrar", Cancelar de Step A, back de
  // Android) pasa por acá.
  function handleClose() {
    setPassword("");
    setError(null);
    setSubscriptionNotice(null);
    setStep("form");
    onClose();
  }

  function applyErrorResult(result: Extract<DeleteAccountResult, { ok: false }>) {
    if (result.code === "active_subscription_requires_cancellation") {
      setSubscriptionNotice(
        result.provider
          ? `Tienes una suscripción activa (${result.provider}) que debe cancelarse antes de eliminar tu cuenta. Cancélala desde donde la contrataste e inténtalo de nuevo.`
          : result.message
      );
      setStep("confirm");
      return;
    }
    if (result.code === "unauthorized") {
      setError(result.message);
      setStep("form");
      return;
    }
    setError(result.message);
    setStep("confirm");
  }

  async function handleConfirmDelete() {
    setError(null);
    setSubscriptionNotice(null);
    setStep("processing");

    const session = await getCurrentSession();
    const result = await deleteAccount(session?.access_token ?? null, password);

    if (!result.ok) {
      applyErrorResult(result);
      return;
    }

    // Limpieza de cliente SOLO después de un 200 confirmado (nunca antes).
    // `signOut()` cierra la sesión de Supabase y, vía `onSessionChange`,
    // sincroniza `authStore` (identity/isAuthenticated/entitlement) — ver
    // AUTH-DELETE-02 Fase 6. `favorites-v1`/`cart-v1`/`search-history`/
    // `location-v1`/`price_alerts_v1` NO se tocan: inspección de código
    // confirma que ninguno está sincronizado con la cuenta (ver informe
    // final, sección F) — son estado de Dispositivo, no de Usuario, según
    // la implementación real hoy.
    setPassword("");
    await signOut();
    onClose();
    router.replace("/");
  }

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={handleClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }} onPress={step === "processing" ? undefined : handleClose} />

      <Animated.View
        style={{
          transform: [{ translateY: slideAnim }],
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingBottom: 36,
        }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: isDark ? "#374151" : "#e5e7eb",
              borderRadius: 2,
              alignSelf: "center",
              marginTop: 12,
              marginBottom: 4,
            }}
          />

          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <View className="flex-row items-center gap-2">
              <Ionicons name="warning-outline" size={20} color="#dc2626" />
              <Text className="text-lg font-bold text-gray-900 dark:text-white">Eliminar cuenta</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              disabled={step === "processing"}
              hitSlop={12}
              className="bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-1.5"
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
            >
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200">Cerrar</Text>
            </TouchableOpacity>
          </View>

          <View className="px-6 pt-5">
            {error && (
              <View className="bg-red-50 dark:bg-red-950 rounded-lg px-3 py-2 mb-4" accessibilityLiveRegion="polite">
                <Text className="text-sm text-red-700 dark:text-red-400">{error}</Text>
              </View>
            )}
            {subscriptionNotice && (
              <View className="bg-red-50 dark:bg-red-950 rounded-lg px-3 py-2 mb-4" accessibilityLiveRegion="polite">
                <Text className="text-sm text-red-700 dark:text-red-400">{subscriptionNotice}</Text>
              </View>
            )}

            {step === "form" && (
              <>
                <Text className="text-sm text-gray-900 dark:text-white font-semibold mb-2">
                  Esta acción es permanente y no se puede deshacer.
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Al eliminar tu cuenta:</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  • Se elimina tu perfil y acceso — ya no podrás iniciar sesión con este correo.
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  • Se cancela tu suscripción si la administras directamente por acá.
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  • Se eliminan tus alertas de precio y comentarios asociados a tu correo.
                </Text>
                <Text className="text-xs text-gray-400 dark:text-gray-500 mb-5">
                  La información de precios de medicamentos y otros datos no personales de la plataforma no se
                  elimina, porque no son registros de tu cuenta.
                </Text>

                <TextInput
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (error) setError(null);
                  }}
                  placeholder="Contraseña actual"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  autoComplete="current-password"
                  accessibilityLabel="Contraseña actual"
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm mb-4"
                />

                <TouchableOpacity
                  onPress={handleContinue}
                  activeOpacity={0.8}
                  className="rounded-2xl py-4 items-center mb-3 bg-red-600"
                  accessibilityRole="button"
                  accessibilityLabel="Continuar"
                >
                  <Text className="font-bold text-base text-white">Continuar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleClose}
                  className="rounded-2xl py-3 items-center border border-gray-200 dark:border-gray-700"
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar"
                >
                  <Text className="text-sm font-semibold text-gray-600 dark:text-gray-300">Cancelar</Text>
                </TouchableOpacity>
              </>
            )}

            {(step === "confirm" || step === "processing") && (
              <>
                <View className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-4 mb-5">
                  <Text className="text-sm font-semibold text-red-700 dark:text-red-400">
                    Esta acción no se puede deshacer.
                  </Text>
                  <Text className="text-sm text-red-700 dark:text-red-400 mt-2">
                    Al continuar, tu cuenta y los datos personales asociados se eliminarán de forma permanente.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleConfirmDelete}
                  disabled={step === "processing"}
                  activeOpacity={0.8}
                  className="rounded-2xl py-4 items-center mb-3 bg-red-600"
                  style={step === "processing" ? { opacity: 0.6 } : undefined}
                  accessibilityRole="button"
                  accessibilityLabel="Eliminar mi cuenta"
                  accessibilityState={{ disabled: step === "processing" }}
                >
                  <Text className="font-bold text-base text-white">
                    {step === "processing" ? "Eliminando…" : "Eliminar mi cuenta"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleBackToForm}
                  disabled={step === "processing"}
                  style={step === "processing" ? { opacity: 0.6 } : undefined}
                  className="rounded-2xl py-3 items-center border border-gray-200 dark:border-gray-700"
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar"
                >
                  <Text className="text-sm font-semibold text-gray-600 dark:text-gray-300">Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}
