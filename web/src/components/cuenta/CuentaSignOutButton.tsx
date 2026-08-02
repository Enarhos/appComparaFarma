"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CuentaSignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/cuenta/ingresar");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink/80 transition hover:border-accent hover:text-accent-ink"
    >
      Cerrar sesión
    </button>
  );
}
