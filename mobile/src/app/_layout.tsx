import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Sentry from "@sentry/react-native";
import "../../global.css";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
  environment: __DEV__ ? "development" : "production",
});

function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: "ComparaFarma", headerShown: false }} />
        <Stack.Screen
          name="results"
          options={{
            title: "Resultados",
            headerBackTitle: "Buscar",
            headerTintColor: "#16a34a",
          }}
        />
        <Stack.Screen
          name="medication"
          options={{
            headerBackTitle: "Resultados",
            headerTintColor: "#16a34a",
          }}
        />
      </Stack>
    </>
  );
}

export default Sentry.wrap(RootLayout);
