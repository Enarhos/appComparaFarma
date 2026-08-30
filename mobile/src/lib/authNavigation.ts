// Navegación de Auth — Épica 1 (Identity Foundation), TASK-003 (corrección
// de refactor solicitada por el CTO sobre el mismo PR).
//
// Encapsula la navegación entre `login.tsx`/`registro.tsx` y el "volver al
// origen" tras un login/registro exitoso, que antes vivía duplicada como
// `goToOrigin()` en ambas pantallas y como `router.push("/login" as any)`
// suelto en `index.tsx`.
//
// Usa el `router` imperativo de `expo-router` (no el hook `useRouter()`)
// para que estas funciones no dependan de estar dentro de un componente.
import { router } from "expo-router";

/** Navega a la pantalla de login. */
export function goToLogin(): void {
  router.push("/login" as any);
}

/** Navega a la pantalla de registro. */
export function goToRegistro(): void {
  router.push("/registro" as any);
}

/** Navega a la pantalla de recuperación de contraseña. */
export function goToRecuperarClave(): void {
  router.push("/recuperar-clave" as any);
}

/**
 * Vuelve a la pantalla de origen tras un login/registro exitoso: si hay una
 * pantalla anterior en el stack, vuelve a ella; si no, reemplaza por Home.
 * Misma lógica que antes tenía `goToOrigin()` duplicada en `login.tsx` y
 * `registro.tsx`.
 */
export function returnFromAuth(): void {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}
