"use client";

import { useRef, useState } from "react";
import { createDonationPayment } from "@/lib/actions/createDonationPayment";
import { formatCLP } from "@/lib/format";

const AMOUNTS = [1000, 3000, 5000] as const;
const GENERIC_ERROR = "No pudimos iniciar el pago. Intenta nuevamente en unos momentos.";

type Status = "idle" | "open" | "submitting" | "error";

/**
 * CTA discreto de donación (Sprint FEAT-WEB-DONATIONS). Mismo patrón de
 * "botón colapsado -> panel expandido" que PriceAlertForm.tsx. No es un
 * banner ni un popup automático: solo aparece si el usuario hace clic.
 * Contribución voluntaria — sin dark patterns (sin monto preseleccionado
 * agresivo, siempre se puede cerrar).
 */
export function DonationWidget() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Guarda de doble-submit robusta ante clics dobles antes del re-render
  // (el estado de React no se refleja de inmediato en el DOM).
  const inFlightRef = useRef(false);

  if (status === "idle") {
    return (
      <button
        type="button"
        onClick={() => setStatus("open")}
        className="text-xs font-medium text-muted underline underline-offset-2 hover:text-accent-ink"
      >
        Apoya PreciosFarma
      </button>
    );
  }

  async function handleSelect(amount: number) {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const result = await createDonationPayment(amount);
      if (result.ok) {
        // Navegación en la misma pestaña (mismo patrón que UpgradeButton.tsx).
        // No se resetea inFlightRef: la página está por navegar de todas formas.
        window.location.href = result.paymentUrl;
        return;
      }
      setErrorMessage(result.error || GENERIC_ERROR);
      setStatus("error");
      inFlightRef.current = false;
    } catch {
      setErrorMessage(GENERIC_ERROR);
      setStatus("error");
      inFlightRef.current = false;
    }
  }

  const submitting = status === "submitting";

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-paper-raised p-4 text-center sm:items-end sm:text-right">
      <p className="max-w-xs text-xs text-muted">
        PreciosFarma es gratuito. Si te resulta útil, puedes ayudarnos a mantener y mejorar el servicio.
      </p>
      <div className="flex gap-2" role="group" aria-label="Elegir monto del aporte">
        {AMOUNTS.map((amount) => (
          <button
            key={amount}
            type="button"
            disabled={submitting}
            onClick={() => handleSelect(amount)}
            className="rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink/80 transition hover:border-accent hover:text-accent-ink disabled:opacity-60"
          >
            {formatCLP(amount)}
          </button>
        ))}
      </div>
      {submitting && <p className="text-xs text-muted">Preparando pago…</p>}
      {status === "error" && errorMessage && (
        <p role="alert" className="text-xs text-red-600">
          {errorMessage}
        </p>
      )}
      <button
        type="button"
        disabled={submitting}
        onClick={() => setStatus("idle")}
        className="text-xs font-medium text-muted hover:text-red-600 disabled:opacity-60"
      >
        Cerrar
      </button>
    </div>
  );
}
