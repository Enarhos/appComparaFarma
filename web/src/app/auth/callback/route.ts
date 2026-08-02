import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Sprint D: reusado tanto por el login de Google de /admin (sin `next`,
// default histórico "/admin") como por la confirmación de email de
// /cuenta/registro (`next=/cuenta`) — un solo callback, dos destinos.
function loginPathFor(next: string): string {
  return next.startsWith("/cuenta") ? "/cuenta/ingresar" : "/admin/login";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}${loginPathFor(next)}?error=auth`);
}
