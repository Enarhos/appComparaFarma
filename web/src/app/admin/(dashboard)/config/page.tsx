import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PharmacySlug } from "@comparafarma/domain";
import { getConfigValue, setConfigValue } from "@/lib/appConfig";
import { PHARMACIES } from "@/constants/pharmacies";

export const dynamic = "force-dynamic";

interface DonationBannerConfig {
  enabled: boolean;
  dismissDays: number;
}

interface PageProps {
  searchParams: Promise<{ status?: string; message?: string }>;
}

const ALL_SLUGS = Object.keys(PHARMACIES) as PharmacySlug[];
const DEFAULT_BANNER: DonationBannerConfig = { enabled: true, dismissDays: 7 };

async function updateConfigAction(formData: FormData) {
  "use server";

  const disabled = ALL_SLUGS.filter((slug) => formData.get(`pharmacy_${slug}`) !== "on");
  const enabled = formData.get("banner_enabled") === "on";
  const dismissDaysRaw = Number(formData.get("banner_dismiss_days"));
  const dismissDays = Number.isFinite(dismissDaysRaw) && dismissDaysRaw > 0 ? dismissDaysRaw : 7;

  const [pharmaciesResult, bannerResult] = await Promise.all([
    setConfigValue("disabled_pharmacies", disabled),
    setConfigValue("donation_banner", { enabled, dismissDays }),
  ]);

  revalidatePath("/admin/config");

  const error = pharmaciesResult.error ?? bannerResult.error;
  redirect(error ? `/admin/config?status=error&message=${encodeURIComponent(error)}` : "/admin/config?status=ok");
}

export default async function AdminConfigPage({ searchParams }: PageProps) {
  const [disabledList, banner, params] = await Promise.all([
    getConfigValue<PharmacySlug[]>("disabled_pharmacies"),
    getConfigValue<DonationBannerConfig>("donation_banner"),
    searchParams,
  ]);

  const disabled = new Set(disabledList ?? []);
  const bannerConfig = banner ?? DEFAULT_BANNER;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">Farmacias y banner</h2>
        <p className="mt-1 text-sm text-muted">
          Reemplaza las variables de entorno <code className="rounded bg-paper px-1.5 py-0.5">DISABLED_PHARMACIES</code>{" "}
          y <code className="rounded bg-paper px-1.5 py-0.5">DONATION_BANNER_*</code> — los cambios acá aplican a la
          app y la web sin redeploy (hasta 60s de caché en el backend).
        </p>
      </div>

      {params.status === "ok" && (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-ink">Cambios guardados.</p>
      )}
      {params.status === "error" && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          No se pudo guardar: {params.message ?? "error desconocido"}.
        </p>
      )}

      <form action={updateConfigAction} className="flex flex-col gap-8">
        <section className="rounded-2xl border border-line bg-paper-raised p-6">
          <h3 className="font-display text-lg font-semibold text-ink">Farmacias activas</h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ALL_SLUGS.map((slug) => {
              const display = PHARMACIES[slug];
              return (
                <label key={slug} className="flex items-center gap-2 text-sm text-ink/80">
                  <input
                    type="checkbox"
                    name={`pharmacy_${slug}`}
                    defaultChecked={!disabled.has(slug)}
                    className="h-4 w-4 rounded border-line"
                  />
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: display.color }}
                    aria-hidden
                  />
                  {display.name}
                </label>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-paper-raised p-6">
          <h3 className="font-display text-lg font-semibold text-ink">Banner de donación</h3>
          <label className="mt-4 flex items-center gap-2 text-sm text-ink/80">
            <input
              type="checkbox"
              name="banner_enabled"
              defaultChecked={bannerConfig.enabled}
              className="h-4 w-4 rounded border-line"
            />
            Mostrar el banner
          </label>
          <label className="mt-3 flex items-center gap-2 text-sm text-ink/80">
            Días antes de volver a mostrarlo tras &quot;Ahora no&quot;:
            <input
              type="number"
              name="banner_dismiss_days"
              min={1}
              defaultValue={bannerConfig.dismissDays}
              className="w-20 rounded-lg border border-line bg-paper px-2 py-1 text-ink outline-none focus:border-accent"
            />
          </label>
        </section>

        <button
          type="submit"
          className="self-start rounded-xl bg-accent px-5 py-2.5 font-semibold text-white transition hover:bg-accent-ink"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
