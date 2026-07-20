import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente con sesión del usuario (respeta RLS) — usar para saber quién está
 * logueado (getUser, signOut). Para leer datos del dashboard usar admin.ts.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Component: no puede escribir cookies, la sesión se refresca en middleware.ts
          }
        },
      },
    }
  );
}
