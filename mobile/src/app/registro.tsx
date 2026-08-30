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
import { signUpWithPassword } from "@/lib/sessionManager";
import { goToLogin, returnFromAuth } from "@/lib/authNavigation";
import { BRAND_COLORS } from "@/constants/brand";
import { AccountPurposeNote } from "@/components/AccountPurposeNote";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  // ACCOUNT-UX-01 (problema 3): dirección exacta a la que se envió la
  // verificación. Se congela en el submit, en vez de leer `email` al pintar el
  // estado "check-email", para que la pantalla de confirmación muestre siempre
  // el valor que realmente se le pasó a `signUpWithPassword` (ya trimmeado) y
  // no pueda desincronizarse del envío real.
  //
  // Es el dato que la Persona acaba de escribir en este formulario — no se le
  // pide a ningún backend (no existe, ni debe existir, un endpoint que
  // devuelva el email de una cuenta sin sesión: sería un oráculo de cuentas
  // ajenas). Tampoco se persiste en AsyncStorage: al salir de esta pantalla el
  // valor se pierde a propósito, porque no hay ninguna acción posterior que lo
  // consuma (hoy no existe "reenviar verificación" en Mobile, y agregarla es
  // capacidad nueva, fuera de ACCOUNT-UX-01). Si la dirección quedó mal
  // escrita, el camino real es volver atrás y registrarse de nuevo — que es
  // exactamente lo que dice el texto de abajo.
  const [verificationEmail, setVerificationEmail] = useState("");

  async function handleSubmit() {
    if (!email.trim() || password.length < 6) {
      setError("Ingresa un email válido y una contraseña de al menos 6 caracteres.");
      setStatus("error");
      return;
    }
    setError(null);
    setStatus("submitting");

    const submittedEmail = email.trim();
    const outcome = await signUpWithPassword(submittedEmail, password);

    // Mensaje genérico siempre — nunca el error real de Supabase (mismo
    // criterio que web/src/app/cuenta/registro/page.tsx aplicado a Mobile).
    if (outcome === "error") {
      setError("No se pudo crear la cuenta. Intenta de nuevo.");
      setStatus("error");
      return;
    }
    if (outcome === "signed-in") {
      returnFromAuth();
      return;
    }
    setVerificationEmail(submittedEmail);
    setStatus("check-email");
  }

  if (status === "check-email") {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-gray-900 px-6">
        <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">Revisa tu correo</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-3 leading-5">
          Te enviamos un link para confirmar tu cuenta a:
        </Text>
        <Text className="text-base font-semibold text-gray-900 dark:text-white text-center mt-2">
          {verificationEmail}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-3 leading-5">
          Ábrelo desde este dispositivo para volver a la app.
        </Text>
        <Text className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4 leading-5">
          Si esa dirección no es correcta, vuelve atrás y crea la cuenta de nuevo con tu correo.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={["bottom"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerClassName="px-6 pt-12 pb-10" keyboardShouldPersistTaps="handled">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Crear cuenta</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
            Opcional — puedes seguir comparando precios sin una cuenta.
          </Text>

          {/* ACCOUNT-UX-01 (problema 2): expectativa explícita antes de pedir
              email y contraseña — mismo bloque que el estado no autenticado de
              `login.tsx`. */}
          <AccountPurposeNote />

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
            className="rounded-xl py-4 items-center"
            style={{ backgroundColor: BRAND_COLORS.indigo }}
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
            onPress={goToLogin}
            className="mt-5 items-center"
            accessibilityRole="button"
            accessibilityLabel="Ya tengo cuenta"
          >
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              ¿Ya tienes cuenta? <Text className="font-semibold" style={{ color: BRAND_COLORS.indigo }}>Ingresa acá</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
