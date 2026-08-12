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
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { signInWithPassword } from "@/lib/sessionManager";
import { goToRegistro, goToRecuperarClave, returnFromAuth } from "@/lib/authNavigation";

// Product Completion Sprint 01: la etiqueta de Plan es deliberadamente
// binaria (Gratis/Premium), igual que `web/src/lib/profile.ts`
// (`PLAN_LABEL`) — `entitlement.plan` ya viene resuelto por
// `lib/entitlementAdapter.ts` como "el planId si el entitlement está
// activo, o `null` si no" (ver ese archivo), así que su sola presencia ya
// equivale a "activo": no hace falta un catálogo de nombres de plan para
// mostrar el estado que ya existe en el Auth Store.
function planLabel(plan: string | null): string {
  return plan ? "Premium" : "Gratis";
}

// Login / Cuenta — Épica 1 (Identity Foundation), TASK-003 (Tasks 006 y 008
// del plan técnico de docs/execution/EPIC-01-IDENTITY_FOUNDATION.md).
//
// Una sola pantalla resuelve Login y Logout, reflejando el estado de sesión
// del Auth Store: sin sesión, muestra el formulario de login (con link a
// `registro.tsx`); con sesión, muestra la cuenta identificada y el botón de
// cerrar sesión. Se decide así (documentado en el PR de esta Task) porque
// Task 008 de EPIC-01 asigna el punto de UI de Logout a Task 010 (Perfil),
// que queda fuera de alcance — y la "Nota sobre Route Guards" del mismo
// documento descarta cualquier pantalla de "cuenta" protegida por sesión:
// Mobile nunca bloquea navegación por falta de sesión (Principio 1,
// docs/domain/USER_DOMAIN_MODEL.md). Por eso esta pantalla es accesible en
// todo momento y "volver al flujo autenticado" significa simplemente volver
// a la pantalla de origen tras un login/registro exitoso.
export default function LoginScreen() {
  const initialized = useAuthStore((s) => s.initialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const identity = useAuthStore((s) => s.identity);
  const entitlement = useAuthStore((s) => s.entitlement);
  const signOut = useAuthStore((s) => s.signOut);
  const signingOut = useAuthStore((s) => s.signingOut);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError("Ingresa tu email y contraseña.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const ok = await signInWithPassword(email.trim(), password);
    setSubmitting(false);

    // Mensaje genérico siempre — nunca el error real de Supabase (mismo
    // criterio que web/src/components/LoginForm.tsx).
    if (!ok) {
      setError("Email o contraseña incorrectos.");
      return;
    }
    returnFromAuth();
  }

  if (!initialized) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator color="#16a34a" />
      </SafeAreaView>
    );
  }

  if (isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={["bottom"]}>
        <View className="flex-1 px-6 pt-12 items-center">
          <View className="bg-green-50 dark:bg-green-950 rounded-full p-5 mb-4">
            <Ionicons name="person-circle-outline" size={48} color="#16a34a" />
          </View>
          <Text className="text-lg font-bold text-gray-900 dark:text-white">Mi cuenta</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">{identity?.email}</Text>

          <View className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 mt-5 w-full">
            <Text className="text-xs text-gray-500 dark:text-gray-400">Plan</Text>
            <Text className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
              {planLabel(entitlement?.plan ?? null)}
            </Text>
          </View>

          <TouchableOpacity
            onPress={signOut}
            disabled={signingOut}
            activeOpacity={0.8}
            className="mt-8 border border-red-200 dark:border-red-800 rounded-xl px-6 py-3 flex-row items-center gap-2"
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
          >
            {signingOut ? (
              <ActivityIndicator color="#dc2626" size="small" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={18} color="#dc2626" />
                <Text className="text-red-600 font-semibold">Cerrar sesión</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={["bottom"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerClassName="px-6 pt-12 pb-10" keyboardShouldPersistTaps="handled">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Iniciar sesión</Text>
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
              if (error) setError(null);
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
              if (error) setError(null);
            }}
            placeholder="Contraseña"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            autoComplete="current-password"
            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm mb-4"
          />

          <TouchableOpacity
            onPress={goToRecuperarClave}
            className="items-end mb-4"
            accessibilityRole="button"
            accessibilityLabel="Olvidé mi contraseña"
          >
            <Text className="text-sm text-green-600 font-semibold">¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
            className="bg-green-600 rounded-xl py-4 items-center"
            accessibilityRole="button"
            accessibilityLabel="Entrar"
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-white font-semibold text-base">Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToRegistro}
            className="mt-5 items-center"
            accessibilityRole="button"
            accessibilityLabel="Crear cuenta"
          >
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              ¿No tienes cuenta? <Text className="text-green-600 font-semibold">Crear cuenta</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
