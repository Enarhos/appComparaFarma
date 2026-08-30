import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BRAND_COLORS } from "@/constants/brand";

// ACCOUNT-UX-01 (problema 2: "antes de registrarse no queda claro para qué
// sirve una cuenta"). Bloque compartido por `app/registro.tsx` y por el
// estado no autenticado de `app/login.tsx` — un solo texto, para que ambos
// puntos del flujo digan exactamente lo mismo.
//
// Los tres puntos describen SOLO capacidades verificadas en el código, no lo
// que "debería" ofrecer una cuenta:
//
// 1. No hay ninguna función exclusiva de usuarios registrados. El único
//    consumidor de `isAuthenticated` fuera de la propia pantalla de cuenta es
//    el botón del header de `app/index.tsx` — ninguna búsqueda, comparación,
//    alerta ni favorito está gateada por sesión (Principio 1,
//    docs/domain/USER_DOMAIN_MODEL.md). El `entitlement` que resuelve
//    `authStore.init()` se guarda pero hoy ninguna UI de Mobile lo lee.
// 2. Favoritos, historial, carrito y alertas viven en AsyncStorage local
//    (`store/favoritesStore.ts`, `historyStore.ts`, `cartStore.ts`,
//    `alertsStore.ts`) sin `user_id` ni sincronización con `api/` — la cuenta
//    no los respalda ni los mueve entre dispositivos.
// 3. Lo que sí existe hoy: sesión (`sessionManager.signInWithPassword`),
//    recuperación de contraseña (`sendPasswordReset`) y eliminación de cuenta
//    (`lib/deleteAccount.ts`).
//
// Si alguna de esas tres afirmaciones deja de ser cierta (ej. se agrega
// sincronización real o un beneficio Premium visible en Mobile), este texto
// debe actualizarse en el mismo cambio — es la única promesa que la app le
// hace a la Persona sobre su cuenta.
const POINTS = [
  "Por ahora no desbloquea funciones exclusivas: todo lo que hay en la app funciona igual sin cuenta.",
  "Tus favoritos, búsquedas recientes y alertas se guardan solo en este teléfono. La cuenta todavía no los sincroniza entre dispositivos.",
  "Sirve para tener tu identidad registrada: puedes iniciar sesión, recuperar tu contraseña y eliminar tu cuenta cuando quieras.",
] as const;

export function AccountPurposeNote() {
  return (
    <View
      className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 mb-5"
      accessibilityRole="summary"
    >
      <Text className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
        ¿Para qué sirve crear una cuenta?
      </Text>
      {POINTS.map((point) => (
        <View key={point} className="flex-row gap-2 mt-1.5">
          <Ionicons name="ellipse" size={6} color={BRAND_COLORS.indigo} style={{ marginTop: 6 }} />
          <Text className="flex-1 text-xs text-gray-600 dark:text-gray-400 leading-5">{point}</Text>
        </View>
      ))}
    </View>
  );
}
