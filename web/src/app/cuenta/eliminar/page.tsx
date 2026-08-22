"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteAccount } from "@/lib/actions/deleteAccount";

// AUTH-DELETE-02 (Web) — flujo de autoservicio "Eliminar cuenta", CTO Gate 2
// (diseño aprobado: sin confirmación de texto tipeado ni checkbox adicional
// — la contraseña + un paso de confirmación final explícito y separado ya
// dan la fricción intencional necesaria). Llama al endpoint ya desplegado
// en Production (AUTH-DELETE-01, sin cambios de backend en esta tarea).
//
// Máquina de estados de esta página (un solo route, sin páginas nuevas):
//   "form"       -> explicación + contraseña -> "confirm"
//   "confirm"    -> advertencia final, irreversible -> "processing"
//   "processing" -> llamada a la Server Action, botones deshabilitados
//   "success"    -> sesión cerrada, mensaje breve antes de navegar a "/"
// Un error en cualquier punto vuelve a "confirm" (o a "form" si falta la
// contraseña) mostrando el mensaje mapeado por deleteAccount.ts — nunca se
// muestra el detalle interno del backend.
type Step = "form" | "confirm" | "processing" | "success";

export default function EliminarCuentaPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [subscriptionNotice, setSubscriptionNotice] = useState<string | null>(null);

  function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!password) {
      setError("Ingresa tu contraseña actual.");
      return;
    }
    setStep("confirm");
  }

  function handleBackToForm() {
    setError(null);
    setSubscriptionNotice(null);
    setStep("form");
  }

  async function handleConfirmDelete() {
    setError(null);
    setSubscriptionNotice(null);
    setStep("processing");

    const result = await deleteAccount(password);

    if (result.ok) {
      setStep("success");
      // Limpieza de cliente SOLO después de un 200 confirmado del backend
      // (nunca antes) — ver AUTH-DELETE-02 Fase 6. En web, el único estado
      // ligado a la cuenta es la sesión de Supabase (cookies vía
      // @supabase/ssr); no hay localStorage/caché específico de cuenta que
      // limpiar (ver informe de auditoría Gate 1, sección J).
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
      return;
    }

    if (result.code === "unauthorized") {
      setError(result.message);
      setStep("form");
      return;
    }

    if (result.code === "active_subscription_requires_cancellation") {
      setSubscriptionNotice(
        result.provider
          ? `Tienes una suscripción activa (${result.provider}) que debe cancelarse antes de eliminar tu cuenta. Cancélala desde donde la contrataste e inténtalo de nuevo.`
          : result.message
      );
      setStep("confirm");
      return;
    }

    setError(result.message);
    setStep("confirm");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 sm:px-6">
      <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink">
        PreciosFarma
      </span>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Eliminar cuenta</h1>

      <div aria-live="polite">
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        {subscriptionNotice && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{subscriptionNotice}</p>
        )}
      </div>

      {step === "form" && (
        <>
          <div className="mt-4 rounded-xl border border-line bg-paper-raised px-4 py-4 text-sm text-muted">
            <p className="text-ink">Esta acción es permanente y no se puede deshacer.</p>
            <p className="mt-3">Al eliminar tu cuenta:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Se elimina tu perfil y acceso — ya no podrás iniciar sesión con este correo.</li>
              <li>Se cancela tu suscripción si la administras directamente por acá.</li>
              <li>Se eliminan tus alertas de precio y comentarios asociados a tu correo.</li>
            </ul>
            <p className="mt-3">
              La información de precios de medicamentos y otros datos no personales de la plataforma no se
              elimina, porque no son registros de tu cuenta, sino conocimiento compartido del catálogo.
            </p>
          </div>

          <form onSubmit={handleContinue} className="mt-6 flex flex-col gap-3">
            <label htmlFor="delete-account-password" className="text-sm text-muted">
              Confirma tu contraseña actual
            </label>
            <input
              id="delete-account-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña actual"
              className="rounded-xl border border-line bg-paper-raised px-4 py-3 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <div className="mt-2 flex flex-col gap-2">
              <button
                type="submit"
                className="rounded-xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700"
              >
                Continuar
              </button>
              <button
                type="button"
                onClick={() => router.push("/cuenta")}
                className="rounded-lg border border-line px-4 py-3 text-sm text-ink/80 transition hover:border-accent hover:text-accent-ink"
              >
                Cancelar
              </button>
            </div>
          </form>
        </>
      )}

      {(step === "confirm" || step === "processing") && (
        <>
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            <p className="font-semibold">Esta acción no se puede deshacer.</p>
            <p className="mt-2">
              Al continuar, tu cuenta y los datos personales asociados se eliminarán de forma permanente.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={step === "processing"}
              className="rounded-xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {step === "processing" ? "Eliminando…" : "Eliminar mi cuenta"}
            </button>
            <button
              type="button"
              onClick={handleBackToForm}
              disabled={step === "processing"}
              className="rounded-lg border border-line px-4 py-3 text-sm text-ink/80 transition hover:border-accent hover:text-accent-ink disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </>
      )}

      {step === "success" && (
        <p className="mt-6 rounded-xl border border-line bg-paper-raised px-4 py-4 text-sm text-ink" role="status">
          Tu cuenta fue eliminada. Redirigiendo…
        </p>
      )}
    </main>
  );
}
