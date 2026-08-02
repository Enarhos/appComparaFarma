import { revalidatePath } from "next/cache";
import { getProfiles, setProfilePlan } from "@/lib/profilesAdmin";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

async function togglePlanAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id"));
  const nextPlan = String(formData.get("nextPlan"));
  if (!id || (nextPlan !== "free" && nextPlan !== "premium")) return;

  await setProfilePlan(id, nextPlan);
  revalidatePath("/admin/usuarios");
}

export default async function AdminUsuariosPage() {
  const result = await getProfiles();

  if (!result.ok) {
    return (
      <div className="rounded-xl border border-line bg-paper-raised p-6 text-sm text-muted">
        No se pudieron cargar los usuarios.
        <pre className="mt-2 overflow-x-auto rounded-lg bg-paper px-3 py-2 text-xs text-red-700">{result.error}</pre>
      </div>
    );
  }

  const rows = result.rows;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">Usuarios</h2>
        <p className="mt-1 text-sm text-muted">
          Cuentas creadas en /cuenta. El plan se activa a mano acá — todavía no hay flujo de pago.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-line bg-paper-raised p-6 text-center text-sm text-muted">
          Todavía no hay usuarios registrados.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => {
            const isPremium = row.plan === "premium";
            const nextPlan = isPremium ? "free" : "premium";
            return (
              <li key={row.id} className="rounded-2xl border border-line bg-paper-raised p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-ink">{row.email}</p>
                    <p className="mt-2 text-xs text-muted">Creada {formatDateTime(row.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        isPremium ? "bg-accent-soft text-accent-ink" : "bg-save-soft text-save"
                      }`}
                    >
                      {isPremium ? "Premium" : "Free"}
                    </span>
                    <form action={togglePlanAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="nextPlan" value={nextPlan} />
                      <button
                        type="submit"
                        className="rounded-lg border border-line px-3 py-1 text-xs text-ink/80 transition hover:border-accent hover:text-accent-ink"
                      >
                        {isPremium ? "Quitar premium" : "Hacer premium"}
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
