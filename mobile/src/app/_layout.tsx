import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Sentry from "@sentry/react-native";
import * as SplashScreen from "expo-splash-screen";
import { useConfigStore } from "@/store/configStore";
import { useAlertsStore } from "@/store/alertsStore";
import { useAuthStore } from "@/store/authStore";
import { subscribeToAuthDeepLinks } from "@/lib/sessionManager";
import { InAppToast } from "@/components/InAppToast";
import "../../global.css";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
  environment: __DEV__ ? "development" : "production",
});

// TASK-005 (Épica 1): mantiene la splash nativa (configurada en `app.json`,
// no tocada por esta Task) visible hasta que el bootstrap de abajo termine
// (o el timeout de seguridad lo fuerce). Patrón oficial de Expo — el
// `.catch()` evita que una llamada duplicada (ej. Fast Refresh en dev)
// rompa el arranque.
SplashScreen.preventAutoHideAsync().catch(() => {});

/** Timeout de seguridad global del bootstrap (~6s): apenas por encima de
 * los 5s internos que ya tienen `configStore.fetch()` y la resolución de
 * entitlement (`entitlementAdapter.ts`), para no quedar nunca colgado
 * indefinidamente. Protege el Principio 1 (búsqueda anónima sin demora
 * perceptible, `docs/domain/USER_DOMAIN_MODEL.md`): si algo se cuelga de
 * forma inesperada, la splash se oculta igual. */
const BOOTSTRAP_SAFETY_TIMEOUT_MS = 6000;

function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const fetchConfig = useConfigStore((s) => s.fetch);
  const loadAlerts = useAlertsStore((s) => s.load);
  const initAuth = useAuthStore((s) => s.init);

  useEffect(() => {
    let cancelled = false;

    // TASK-005 (Épica 1): Bootstrap real de la app mientras la splash nativa
    // sigue visible. Solo entran acá las capacidades de Identity/Entitlements
    // (`initAuth()`, que internamente resuelve sesión + entitlement vía
    // `authStore.init()`) y de configuración inicial (`fetchConfig()`) — son
    // las que el CTO nombró explícitamente para gatear el bootstrap.
    //
    // `loadAlerts()` (Alertas de precio — capacidad de "Recordar", no de
    // Identidad) y `subscribeToAuthDeepLinks()` (un listener continuo, no una
    // promesa que "termina") quedan deliberadamente FUERA de `bootstrap()`:
    // se siguen disparando en paralelo, sin bloquear, exactamente igual que
    // antes de esta Task. No forman parte del alcance que el CTO definió.
    async function bootstrap() {
      const work = Promise.all([fetchConfig(), initAuth()]);
      // Timeout de seguridad global (~6s, apenas por encima de los 5s
      // internos que ya tienen `configStore.fetch()` y la resolución de
      // entitlement): garantiza que la splash nunca quede colgada de forma
      // indefinida si algo se cuelga de forma inesperada. Protege el
      // Principio 1 (búsqueda anónima sin demora perceptible,
      // `docs/domain/USER_DOMAIN_MODEL.md`).
      const safetyTimeout = new Promise<void>((resolve) => {
        setTimeout(resolve, BOOTSTRAP_SAFETY_TIMEOUT_MS);
      });
      try {
        await Promise.race([work, safetyTimeout]);
      } finally {
        // Defensivo: ninguna de `fetchConfig()`/`initAuth()` debería lanzar
        // (ambas se degradan solas), pero `try/finally` garantiza que la
        // splash se oculte igual aunque algo lance inesperadamente.
        if (!cancelled) {
          SplashScreen.hideAsync().catch(() => {});
        }
      }
    }

    bootstrap();

    // Fuera del bootstrap — ver comentario arriba.
    loadAlerts();

    // TASK-003 (Task 007 de EPIC-01): la lógica de deep links de auth vive en
    // `sessionManager.ts` — `_layout.tsx` no contiene lógica de
    // autenticación/deep-linking, solo la orquesta desde el ciclo de vida.
    const unsubscribeDeepLinks = subscribeToAuthDeepLinks();

    return () => {
      cancelled = true;
      unsubscribeDeepLinks();
    };
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
