import { getClickStats } from "@/lib/clickStats";
import { PHARMACIES } from "@/constants/pharmacies";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const result = await getClickStats();

  if (!result.ok) {
    return (
      <div className="rounded-xl border border-line bg-paper-raised p-6 text-sm text-muted">
        No se pudo cargar el dashboard de clicks.
        <pre className="mt-2 overflow-x-auto rounded-lg bg-paper px-3 py-2 text-xs text-red-700">
          {result.error}
        </pre>
      </div>
    );
  }

  const stats = result.stats;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">Clicks por farmacia</h2>
        <p className="mt-1 text-sm text-muted">
          Cuántas veces los usuarios tocaron &quot;Ver en farmacia&quot; desde que arrancó el tracking
          (Fase 1) — base para evaluar el modelo de afiliación.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-paper-raised p-6">
        <p className="font-sans text-xs font-medium uppercase tracking-wide text-muted">
          Total de clicks registrados
        </p>
        <p className="mt-1 font-display text-4xl font-semibold tabular-nums text-accent-ink">
          {stats.totalClicks.toLocaleString("es-CL")}
        </p>
      </div>

      {stats.byPharmacy.length === 0 ? (
        <div className="rounded-xl border border-line bg-paper-raised p-6 text-center text-sm text-muted">
          Todavía no hay clicks registrados.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-paper-raised">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Farmacia</th>
                <th className="px-4 py-3 font-medium tabular-nums">Total</th>
                <th className="px-4 py-3 font-medium tabular-nums">Últimos 7 días</th>
                <th className="px-4 py-3 font-medium">Último click</th>
              </tr>
            </thead>
            <tbody>
              {stats.byPharmacy.map((row) => {
                const display = PHARMACIES[row.slug as keyof typeof PHARMACIES];
                return (
                  <tr key={row.slug} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: display?.color ?? "#9ca3af" }}
                          aria-hidden
                        />
                        <span className="font-medium text-ink">{display?.name ?? row.slug}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-ink">{row.total}</td>
                    <td className="px-4 py-3 tabular-nums text-ink/80">{row.last7Days}</td>
                    <td className="px-4 py-3 text-muted">
                      {row.lastClickAt ? formatDateTime(row.lastClickAt) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
