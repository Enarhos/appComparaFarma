import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import * as Sentry from "@sentry/react-native";
import { useConfigStore } from "@/store/configStore";
import { useAlertsStore } from "@/store/alertsStore";
import { useAuthStore } from "@/store/authStore";
import { completeSessionFromUrl } from "@/lib/sessionManager";
import { InAppToast } from "@/components/InAppToast";
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
  const loadAlerts = useAlertsStore((s) => s.load);
  const initAuth = useAuthStore((s) => s.init);

  useEffect(() => {
    fetchConfig();
    loadAlerts();
    // Identity Foundation (Épica 1, TASK-001): resuelve una sesión existente
    // (si la hay) y su entitlement — Supabase → Identity → Entitlements →
    // Auth Store. No bloquea el montaje del Stack, igual que fetchConfig()/
    // loadAlerts(): sin sesión o sin red, la app sigue 100% anónima.
    initAuth();

    // TASK-003 (Task 007 de EPIC-01): completa la sesión cuando la Persona
    // abre el deep link de confirmación de email enviado por Supabase
    // (`comparafarma://login#access_token=...`). No navega ni sincroniza el
    // Auth Store a mano — `setSession()` (dentro de `completeSessionFromUrl`)
    // dispara el evento `SIGNED_IN`, que `authStore.init()` ya escucha vía
    // `onSessionChange`. Cubre tanto el caso de la app ya abierta
    // (`addEventListener`) como el de abrirla recién desde el link
    // (`getInitialURL`).
    const subscription = Linking.addEventListener("url", ({ url }) => {
      completeSessionFromUrl(url);
    });
    Linking.getInitialURL().then((url) => {
      if (url) completeSessionFromUrl(url);
    });

    return () => subscription.remove();
  }, [fetchConfig, loadAlerts, initAuth]);
  const headerBg = isDark ? "#111827" : "#ffffff";

  return (
    <>
      <StatusBar style="auto" />
      <InAppToast />
      <Stack screenOptions={{ headerStyle: { backgroundColor: headerBg }, headerTintColor: "#16a34a" }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="results" options={{ title: "Resultados", headerBackTitle: "Buscar" }} />
        <Stack.Screen name="medication" options={{ headerShown: false }} />
        <Stack.Screen name="cart" options={{ headerBackTitle: "Inicio" }} />
        <Stack.Screen name="about" options={{ title: "Acerca de", headerBackTitle: "Inicio" }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Cuenta", headerBackTitle: "Inicio" }} />
        <Stack.Screen name="registro" options={{ title: "Crear cuenta", headerBackTitle: "Cuenta" }} />
      </Stack>
    </>
  );
}

export default Sentry.wrap(RootLayout);
