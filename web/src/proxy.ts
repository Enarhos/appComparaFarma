import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedAdmin } from "@/lib/adminAllowlist";

// Sprint D: rutas de usuario final protegidas por sesión, sin lista blanca
// (a diferencia de /admin, cualquiera con cuenta puede entrar acá).
// Product Completion Sprint 01: "/cuenta/recuperar" se agrega como pública
// porque la Persona todavía no tiene sesión cuando pide recuperar su
// contraseña — "/cuenta/actualizar-clave" NO se agrega acá a propósito: solo
// se llega a esa ruta después de que el link de recuperación ya estableció
// una sesión (ver auth/callback/route.ts), así que debe seguir exigiendo
// sesión como cualquier otra ruta de /cuenta.
const PUBLIC_CUENTA_PATHS = new Set(["/cuenta/ingresar", "/cuenta/registro", "/cuenta/recuperar"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || PUBLIC_CUENTA_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname.startsWith("/cuenta")) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/cuenta/ingresar";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  if (!user || !isAllowedAdmin(user.email)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = user ? "?error=unauthorized" : "";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/cuenta/:path*"],
};
