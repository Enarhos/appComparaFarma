import { revalidatePath } from "next/cache";
import { getFeedback, setFeedbackStatus } from "@/lib/feedbackAdmin";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

async function toggleStatusAction(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  const nextStatus = String(formData.get("nextStatus"));
  if (!Number.isFinite(id)) return;

  await setFeedbackStatus(id, nextStatus);
  revalidatePath("/admin/feedback");
}

export default async function AdminFeedbackPage() {
  const result = await getFeedback();

  if (!result.ok) {
    return (
      <div className="rounded-xl border border-line bg-paper-raised p-6 text-sm text-muted">
        No se pudo cargar el feedback.
        <pre className="mt-2 overflow-x-auto rounded-lg bg-paper px-3 py-2 text-xs text-red-700">{result.error}</pre>
      </div>
    );
  }

  const rows = result.rows;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">Feedback de usuarios</h2>
        <p className="mt-1 text-sm text-muted">
          Sugerencias enviadas desde la app y la web — antes solo llegaban por email.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-line bg-paper-raised p-6 text-center text-sm text-muted">
          Todavía no hay feedback registrado.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => {
            const resolved = row.status === "resolved";
            const nextStatus = resolved ? "open" : "resolved";
            return (
              <li key={row.id} className="rounded-2xl border border-line bg-paper-raised p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="whitespace-pre-wrap text-sm text-ink">{row.message}</p>
                    <p className="mt-2 text-xs text-muted">
                      {row.email ?? "sin email"} · {formatDateTime(row.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        resolved ? "bg-accent-soft text-accent-ink" : "bg-save-soft text-save"
                      }`}
                    >
                      {resolved ? "Resuelto" : "Abierto"}
                    </span>
                    <form action={toggleStatusAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="nextStatus" value={nextStatus} />
                      <button
                        type="submit"
                        className="rounded-lg border border-line px-3 py-1 text-xs text-ink/80 transition hover:border-accent hover:text-accent-ink"
                      >
                        {resolved ? "Reabrir" : "Marcar resuelto"}
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
