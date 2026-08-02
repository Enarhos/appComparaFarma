import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/profile";
import { CuentaSignOutButton } from "@/components/cuenta/CuentaSignOutButton";

export const dynamic = "force-dynamic";

const PLAN_LABEL: Record<"free" | "premium", string> = {
  free: "Gratis",
  premium: "Premium",
};

export default async function CuentaPage() {
  const profile = await getCurrentProfile();

  // proxy.ts ya exige sesión para llegar acá — si no hay perfil (caso
  // borde: trigger no corrió), no tiene sentido mostrar la página vacía.
  if (!profile) {
    redirect("/cuenta/ingresar");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink">
        ComparaFarma
      </span>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Mi cuenta</h1>

      <div className="mt-6 rounded-xl border border-line bg-paper-raised px-4 py-4">
        <p className="text-sm text-muted">Email</p>
        <p className="text-ink">{profile.email}</p>

        <p className="mt-4 text-sm text-muted">Plan</p>
        <p className="text-ink">{PLAN_LABEL[profile.plan]}</p>
      </div>

      <div className="mt-6">
        <CuentaSignOutButton />
      </div>
    </main>
  );
}
