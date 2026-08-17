import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { updatePassword } from "@/lib/sessionManager";
import { router } from "expo-router";
import { BRAND_COLORS } from "@/constants/brand";

// Actualizar contraseña — Product Completion Sprint 01.
//
// Solo tiene sentido abrir esta pantalla desde el deep link de recuperación
// (`sendPasswordReset` en lib/sessionManager.ts) — para entonces,
// `subscribeToAuthDeepLinks()` (registrado en `_layout.tsx`) ya completó la
// sesión de recuperación a partir de la URL, así que `updatePassword` opera
// sobre esa sesión sin pedir la contraseña anterior (comportamiento nativo
// de `supabase.auth.updateUser`).
export default function ActualizarClaveScreen() {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const ok = await updatePassword(password);
    setSubmitting(false);

    if (!ok) {
      setError("No se pudo actualizar la contraseña. Intenta de nuevo.");
      return;
    }
    router.replace("/login" as any);
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={["bottom"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerClassName="px-6 pt-12 pb-10" keyboardShouldPersistTaps="handled">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Elegir nueva contraseña</Text>

          {error && (
            <View className="bg-red-50 dark:bg-red-950 rounded-lg px-3 py-2 mb-4 mt-4">
              <Text className="text-sm text-red-700 dark:text-red-400">{error}</Text>
            </View>
          )}

          <TextInput
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (error) setError(null);
            }}
            placeholder="Contraseña nueva (mínimo 6 caracteres)"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            autoComplete="new-password"
            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm mb-4 mt-6"
          />

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
            className="rounded-xl py-4 items-center"
            style={{ backgroundColor: BRAND_COLORS.indigo }}
            accessibilityRole="button"
            accessibilityLabel="Guardar contraseña"
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-white font-semibold text-base">Guardar contraseña</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
