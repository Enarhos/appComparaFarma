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
import { useRouter } from "expo-router";
import { signUpWithPassword } from "@/lib/sessionManager";

type Status = "idle" | "submitting" | "check-email" | "error";

// Registro — Épica 1 (Identity Foundation), TASK-003 (Task 007 del plan
// técnico de docs/execution/EPIC-01-IDENTITY_FOUNDATION.md).
//
// Mismo doble caso que web/src/app/cuenta/registro/page.tsx: si el proyecto
// de Supabase tiene "Confirm email" desactivado, `signUp` devuelve sesión de
// inmediato y esta pantalla se comporta como un login exitoso (vuelve al
// origen); si lo tiene activado, muestra el estado "revisa tu correo" — la
// sesión se completa después, cuando la Persona abre el deep link de
// confirmación (ver `completeSessionFromUrl()` en lib/sessionManager.ts,
// invocado desde el listener de `_layout.tsx`).
//
// Limitación de validación conocida (ver PR de esta Task): no fue posible
// probar el flujo real de confirmación por email de punta a punta en este
// sandbox (no hay bandeja de correo real ni dispositivo físico), ni
// verificar que las "Redirect URLs" del proyecto Supabase acepten el
// esquema `comparafarma://` (configuración fuera de este repositorio).
export default function RegistroScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  function goToOrigin() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  async function handleSubmit() {
    if (!email.trim() || password.length < 6) {
      setError("Ingresa un email válido y una contraseña de al menos 6 caracteres.");
      setStatus("error");
      return;
    }
    setError(null);
    setStatus("submitting");

    const outcome = await signUpWithPassword(email.trim(), password);

    // Mensaje genérico siempre — nunca el error real de Supabase (mismo
    // criterio que web/src/app/cuenta/registro/page.tsx aplicado a Mobile).
    if (outcome === "error") {
      setError("No se pudo crear la cuenta. Intenta de nuevo.");
      setStatus("error");
      return;
    }
    if (outcome === "signed-in") {
      goToOrigin();
      return;
    }
    setStatus("check-email");
  }

  if (status === "check-email") {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-gray-900 px-6">
        <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">Revisa tu correo</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-3 leading-5">
          Te enviamos un link para confirmar tu cuenta. Ábrelo desde este dispositivo para volver a la app.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={["bottom"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerClassName="px-6 pt-12 pb-10" keyboardShouldPersistTaps="handled">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Crear cuenta</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">
            Opcional — puedes seguir comparando precios sin una cuenta.
          </Text>

          {error && (
            <View className="bg-red-50 dark:bg-red-950 rounded-lg px-3 py-2 mb-4">
              <Text className="text-sm text-red-700 dark:text-red-400">{error}</Text>
            </View>
          )}

          <TextInput
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (status === "error") setStatus("idle");
            }}
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm mb-3"
          />
          <TextInput
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (status === "error") setStatus("idle");
            }}
            placeholder="Contraseña (mínimo 6 caracteres)"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            autoComplete="new-password"
            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm mb-4"
          />

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={status === "submitting"}
            activeOpacity={0.8}
            className="bg-green-600 rounded-xl py-4 items-center"
            accessibilityRole="button"
            accessibilityLabel="Crear cuenta"
          >
            {status === "submitting" ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-white font-semibold text-base">Crear cuenta</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/login" as any)}
            className="mt-5 items-center"
            accessibilityRole="button"
            accessibilityLabel="Ya tengo cuenta"
          >
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              ¿Ya tienes cuenta? <Text className="text-green-600 font-semibold">Ingresa acá</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
