import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { goToLogin } from "@/lib/authNavigation";
import { BRAND_COLORS } from "@/constants/brand";

// ACCOUNT-UX-01 (problema 1: "el usuario autenticado no tiene una señal clara
// de que inició sesión"). Antes esto era un `TouchableOpacity` inline en
// `app/index.tsx` cuya única diferencia entre sesión y no sesión era el color
// del mismo ícono (`#9ca3af` gris vs indigo): una señal que depende
// exclusivamente del color, difícil de notar y que no comunica nada a quien no
// distingue esos dos tonos.
//
// Se extrae como componente por dos razones: es el punto de entrada único a la
// pantalla de cuenta (donde ya viven Cerrar sesión y Eliminar cuenta), y así la
// señal queda cubierta por tests sin tener que montar Home entero.
//
// La diferencia ahora es de forma, no solo de color: ícono relleno + un badge
// con check, siguiendo la misma geometría del badge del carrito que ya vive en
// el header de Home (`absolute -top-1 -right-1`, `w-4 h-4`).
export function AccountButton() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <TouchableOpacity
      onPress={goToLogin}
      hitSlop={12}
      className="relative"
      accessibilityLabel={isAuthenticated ? "Mi cuenta, sesión iniciada" : "Iniciar sesión"}
      accessibilityRole="button"
    >
      <Ionicons
        name={isAuthenticated ? "person-circle" : "person-circle-outline"}
        size={26}
        color={isAuthenticated ? BRAND_COLORS.indigo : "#9ca3af"}
      />
      {isAuthenticated && (
        <View
          className="absolute -top-1 -right-1 rounded-full w-4 h-4 items-center justify-center border-2 border-white dark:border-gray-900"
          style={{ backgroundColor: BRAND_COLORS.teal }}
        >
          <Ionicons name="checkmark" size={8} color="#ffffff" />
        </View>
      )}
    </TouchableOpacity>
  );
}
