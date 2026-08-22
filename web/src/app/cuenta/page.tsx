import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/profile";
import { getAvailablePlans } from "@/lib/plans";
import { formatCLP } from "@/lib/format";
import { CuentaSignOutButton } from "@/components/cuenta/CuentaSignOutButton";
import { UpgradeButton } from "@/components/cuenta/UpgradeButton";

export const dynamic = "force-dynamic";

const PLAN_LABEL: Record<"free" | "premium", string> = {
  free: "Gratis",
  premium: "Premium",
};

// Subscription Platform Fase 2 corregida (RFC-005) — mensaje según
// ?upgrade=, puramente informativo: el estado real del plan lo actualiza
// api/ (flow-register-return/flow-webhook), no esta URL de retorno.
const UPGRADE_BANNER: Record<string, { text: string; tone: "ok" | "muted" | "error" }> = {
  success: { text: "Pago iniciado. Puede tardar unos segundos en reflejarse acá.", tone: "ok" },
  error: { text: "Algo salió mal al iniciar el pago. Intenta de nuevo.", tone: "error" },
};

interface PageProps {
  searchParams: Promise<{ upgrade?: string }>;
}

export default async function CuentaPage({ searchParams }: PageProps) {
  const [profile, params] = await Promise.all([getCurrentProfile(), searchParams]);

  // proxy.ts ya exige sesión para llegar acá — si no hay perfil (caso
  // borde: trigger no corrió), no tiene sentido mostrar la página vacía.
  if (!profile) {
    redirect("/cuenta/ingresar");
  }

  const plans = profile.plan === "free" ? await getAvailablePlans() : [];
  const banner = params.upgrade ? UPGRADE_BANNER[params.upgrade] : undefined;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 sm:px-6">
      <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink">
        PreciosFarma
      </span>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Mi cuenta</h1>

      {banner && (
        <p
          className={
            "mt-4 rounded-lg px-3 py-2 text-sm " +
            (banner.tone === "ok"
              ? "bg-green-50 text-green-700"
              : banner.tone === "error"
                ? "bg-red-50 text-red-700"
                : "bg-paper-raised text-muted")
          }
        >
          {banner.text}
        </p>
      )}

      <div className="mt-6 rounded-xl border border-line bg-paper-raised px-4 py-4">
        <p className="text-sm text-muted">Email</p>
        <p className="text-ink">{profile.email}</p>

        <p className="mt-4 text-sm text-muted">Plan</p>
        <p className="text-ink">{PLAN_LABEL[profile.plan]}</p>
      </div>

      {plans.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {plans.map((plan) => (
            <UpgradeButton
              key={plan.id}
              planId={plan.id}
              label={
                plan.referencePrice != null
                  ? `Actualizar a ${plan.name} — ${formatCLP(plan.referencePrice)}${plan.billingPeriod === "monthly" ? "/mes" : ""}`
                  : `Actualizar a ${plan.name}`
              }
            />
          ))}
        </div>
      )}

      <div className="mt-6">
        <CuentaSignOutButton />
      </div>

      <div className="mt-8 border-t border-line pt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Zona de peligro</p>
        <Link
          href="/cuenta/eliminar"
          className="mt-3 inline-block rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:border-red-400 hover:text-red-700"
        >
          Eliminar cuenta
        </Link>
      </div>
    </main>
  );
}
