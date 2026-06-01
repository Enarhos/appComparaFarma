import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Sentry from "@sentry/react-native";
import { useConfigStore } from "@/store/configStore";
import "../../global.css";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
  environment: __DEV__ ? "development" : "production",
});

function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const fetchConfig = useConfigStore((s) => s.fetch);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);
  const headerBg = isDark ? "#111827" : "#ffffff";

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: headerBg }, headerTintColor: "#16a34a" }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="results" options={{ title: "Resultados", headerBackTitle: "Buscar" }} />
        <Stack.Screen name="medication" options={{ headerBackTitle: "Resultados" }} />
        <Stack.Screen name="cart" options={{ headerBackTitle: "Inicio" }} />
        <Stack.Screen name="about" options={{ title: "Acerca de", headerBackTitle: "Inicio" }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default Sentry.wrap(RootLayout);
