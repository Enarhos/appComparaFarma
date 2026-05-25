import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

const PHARMACIES = ["Cruz Verde", "Salcobrand", "Ahumada", "Dr. Simi"];

type SubmitState = "idle" | "sending" | "success" | "error";

export default function AboutScreen() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorText, setErrorText] = useState("");

  async function handleSend() {
    const trimmed = message.trim();
    if (trimmed.length < 5) {
      setErrorText("Escribe al menos 5 caracteres.");
      return;
    }
    setErrorText("");
    setSubmitState("sending");

    try {
      const res = await fetch(`${API_URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, email: email.trim() || undefined }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Error al enviar");
      }

      setSubmitState("success");
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "No se pudo enviar. Intenta de nuevo.");
      setSubmitState("error");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={["bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-6 pb-10"
          keyboardShouldPersistTaps="handled"
        >
          {/* Encabezado de la app */}
          <View className="items-center mb-8">
            <View className="bg-green-50 dark:bg-green-950 rounded-2xl p-4 mb-3">
              <Ionicons name="medkit" size={40} color="#16a34a" />
            </View>
            <Text className="text-2xl font-bold text-green-700">ComparaFarma</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">
              Compara precios de medicamentos en{"\n"}
              {PHARMACIES.join(" · ")}
            </Text>
          </View>

          {/* Separador */}
          <View className="h-px bg-gray-100 dark:bg-gray-800 mb-6" />

          {/* Formulario de feedback */}
          {submitState === "success" ? (
            <View className="items-center py-8">
              <View className="bg-green-50 dark:bg-green-950 rounded-full p-4 mb-4">
                <Ionicons name="checkmark-circle" size={48} color="#16a34a" />
              </View>
              <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                ¡Gracias!
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-center text-sm leading-5">
                Tu sugerencia fue enviada.{"\n"}Nos ayuda mucho a mejorar la app.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setMessage("");
                  setEmail("");
                  setSubmitState("idle");
                }}
                className="mt-6 border border-green-600 rounded-xl px-6 py-3"
              >
                <Text className="text-green-700 font-semibold">Enviar otro mensaje</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View className="flex-row items-center mb-1">
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#16a34a" />
                <Text className="text-base font-semibold text-gray-900 dark:text-white ml-2">
                  Tu opinión nos ayuda a mejorar
                </Text>
              </View>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                ¿Algo que no funciona bien? ¿Una farmacia que falta? ¡Cuéntanos!
              </Text>

              {/* Área de mensaje */}
              <TextInput
                value={message}
                onChangeText={(t) => {
                  setMessage(t);
                  if (errorText) setErrorText("");
                  if (submitState === "error") setSubmitState("idle");
                }}
                placeholder="Escribe tu sugerencia o comentario aquí..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm mb-3"
                style={{ minHeight: 120 }}
              />

              {/* Campo de email opcional */}
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Tu email (opcional, para responderte)"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm mb-1"
              />

              {/* Error */}
              {errorText ? (
                <Text className="text-red-500 text-xs mb-3">{errorText}</Text>
              ) : (
                <View className="mb-3" />
              )}

              {/* Botón enviar */}
              <TouchableOpacity
                onPress={handleSend}
                disabled={submitState === "sending"}
                className="bg-green-600 rounded-xl py-4 items-center"
                activeOpacity={0.8}
              >
                {submitState === "sending" ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text className="text-white font-semibold text-base">Enviar</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Separador */}
          <View className="h-px bg-gray-100 dark:bg-gray-800 mt-8 mb-6" />

          {/* Footer */}
          <View className="items-center">
            <Text className="text-xs text-gray-400 dark:text-gray-600 text-center">
              Comparamos precios en tiempo real en{"\n"}
              {PHARMACIES.join(", ")}
            </Text>
            <Text className="text-xs text-gray-300 dark:text-gray-700 mt-3">
              ComparaFarma · Chile
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
