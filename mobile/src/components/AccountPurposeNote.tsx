import { View, Text } from "react-native";

// ACCOUNT-UX-01 (problema 2: "antes de registrarse no queda claro para qué
// sirve una cuenta"). Bloque compartido por `app/registro.tsx` y por el
// estado no autenticado de `app/login.tsx` — un solo texto, para que ambos
// puntos del flujo digan exactamente lo mismo.
//
// Texto acotado a pedido de Mario (revisión de esta Task sobre la versión
// original de 3 bullets, que resultaba larga). Sigue el mismo principio de
// honestidad que la versión anterior: solo afirma capacidades verificadas en
// el código —
// - "administrar tu acceso": sesión (`sessionManager.signInWithPassword`) y
//   recuperación de contraseña (`sendPasswordReset`).
// - "eliminarla cuando quieras": `lib/deleteAccount.ts`.
//
// No promete sincronización, funciones exclusivas de usuarios registrados ni
// ningún beneficio Premium — ninguna de esas capacidades existe hoy en
// Mobile (detalle completo de qué existe y qué no: Principio 1,
// docs/domain/USER_DOMAIN_MODEL.md). Si alguna de esas dos afirmaciones deja
// de ser cierta (ej. se agrega sincronización real o un beneficio Premium
// visible en Mobile), este texto debe actualizarse en el mismo cambio — es la
// única promesa que la app le hace a la Persona sobre su cuenta.
export function AccountPurposeNote() {
  return (
    <View
      className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 mb-5"
      accessibilityRole="summary"
    >
      <Text className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">La cuenta es opcional</Text>
      <Text className="text-xs text-gray-600 dark:text-gray-400 leading-5">
        Puedes usar PreciosFarma y comparar precios sin registrarte. Si creas una cuenta, podrás administrar tu
        acceso y eliminarla cuando quieras.
      </Text>
    </View>
  );
}
