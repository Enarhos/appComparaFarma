// Cliente Supabase de Mobile — Épica 1 (Identity Foundation), TASK-001.
//
// Mismo proyecto Supabase que ya usan `web/` y `api/` (nunca uno nuevo — ver
// docs/architecture/IDENTITY_INTEGRATION_PLAN.md y
// docs/execution/EPIC-01-IDENTITY_FOUNDATION.md). Usa `@supabase/supabase-js`
// puro, no `@supabase/ssr` (ese paquete es específico de Next.js/cookies y
// no aplica a React Native — ver inventario "Cliente Web" de EPIC-01).
//
// Patrón de inicialización a nivel de módulo, igual que
// `mobile/src/lib/analytics.ts` (PostHog): se instancia una única vez al
// importar el archivo y se exporta como singleton reutilizable desde
// stores/pantallas, sin duplicar la creación del cliente.
import "react-native-get-random-values";
import * as aesjs from "aes-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

/**
 * Storage adapter recomendado oficialmente por Supabase para Expo/React
 * Native — guía "Build a User Management App with Expo React Native",
 * pestaña "SecureStore" (supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native).
 *
 * Expo SecureStore no admite valores mayores a 2048 bytes (una sesión de
 * Supabase completa —access/refresh token + metadata— normalmente los
 * supera), así que este adapter genera una clave AES-256 por escritura,
 * guarda esa clave en SecureStore (cifrado por el OS — Keychain en iOS,
 * Keystore en Android), y cifra el valor real con esa clave antes de
 * guardarlo en AsyncStorage. La sesión nunca queda en texto plano en el
 * dispositivo.
 *
 * Implementación idéntica a la documentada oficialmente por Supabase — no
 * se modifica el patrón. La propia guía advierte explícitamente contra
 * "optimizaciones" que puedan introducir vulnerabilidades sutiles.
 */
class LargeSecureStore {
  private async _encrypt(key: string, value: string): Promise<string> {
    const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));

    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));

    await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));

    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  private async _decrypt(key: string, value: string): Promise<string | null> {
    const encryptionKeyHex = await SecureStore.getItemAsync(key);
    if (!encryptionKeyHex) {
      return null;
    }

    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1)
    );
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));

    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;

    return await this._decrypt(key, encrypted);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    const encrypted = await this._encrypt(key, value);
    await AsyncStorage.setItem(key, encrypted);
  }
}

let client: SupabaseClient | null = null;
try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: new LargeSecureStore(),
        autoRefreshToken: true,
        persistSession: true,
        // No aplica a React Native — no hay URL de navegador desde donde
        // "detectar" tokens de sesión (equivalente al mismo flag desactivado
        // en `api/src/lib/supabaseClient.ts` para el uso server-to-server).
        detectSessionInUrl: false,
      },
    });
  } else if (__DEV__) {
    // Mismo criterio que `useConfigStore`/`search.ts`: si falta configuración,
    // la app sigue funcionando 100% anónima (Principio 1,
    // docs/domain/USER_DOMAIN_MODEL.md) — Identity/Entitlements quedan
    // simplemente deshabilitados, nunca bloquean la búsqueda.
    console.warn(
      "Supabase: faltan EXPO_PUBLIC_SUPABASE_URL/EXPO_PUBLIC_SUPABASE_ANON_KEY — Identity/Entitlements deshabilitados, búsqueda anónima no afectada."
    );
  }
} catch (err) {
  if (__DEV__) console.warn("Supabase: init falló, Identity/Entitlements deshabilitados.", err);
  client = null;
}

/**
 * Cliente Supabase de Mobile, o `null` si no está configurado. Ningún
 * consumidor (`sessionManager.ts`, `authStore.ts`) debe asumir que existe —
 * siempre debe manejar el caso `null` degradando a estado anónimo, nunca
 * lanzando ni bloqueando el arranque de la app.
 */
export const supabase = client;
