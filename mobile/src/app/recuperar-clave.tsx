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
import { sendPasswordReset } from "@/lib/sessionManager";
import { goToLogin } from "@/lib/authNavigation";
import { BRAND_COLORS } from "@/constants/brand";

type Status = "idle" | "submitting" | "check-email" | "error";

// Recuperar contraseña — Product Completion Sprint 01.
//
// Mismo doble-paso que web/src/app/cuenta/recuperar/page.tsx: pide el email,
// envía el link de recuperación vía Supabase Auth (sin backend propio) y
// muestra "revisa tu correo" — nunca distingue si el email existe o no,
// mismo criterio de mensaje genérico ya usado en login.tsx/registro.tsx.
export default function RecuperarClaveScreen() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit() {
    if (!email.trim()) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    await sendPasswordReset(email.trim());
    setStatus("check-email");
  }

  if (status === "check-email") {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-gray-900 px-6">
        <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">Revisa tu correo</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-3 leading-5">
          Si existe una cuenta con ese correo, te enviamos un link para elegir una contraseña nueva. Ábrelo desde
          este dispositivo.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={["bottom"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerClassName="px-6 pt-12 pb-10" keyboardShouldPersistTaps="handled">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Recuperar contraseña</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">
            Te enviaremos un link para elegir una contraseña nueva.
          </Text>

          {status === "error" && (
            <View className="bg-red-50 dark:bg-red-950 rounded-lg px-3 py-2 mb-4">
              <Text className="text-sm text-red-700 dark:text-red-400">Ingresa tu email.</Text>
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
            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm mb-4"
          />

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={status === "submitting"}
            activeOpacity={0.8}
            className="rounded-xl py-4 items-center"
            style={{ backgroundColor: BRAND_COLORS.indigo }}
            accessibilityRole="button"
            accessibilityLabel="Enviar link"
          >
            {status === "submitting" ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-white font-semibold text-base">Enviar link</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToLogin}
            className="mt-5 items-center"
            accessibilityRole="button"
            accessibilityLabel="Volver a ingresar"
          >
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              <Text className="font-semibold" style={{ color: BRAND_COLORS.indigo }}>Volver a ingresar</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
