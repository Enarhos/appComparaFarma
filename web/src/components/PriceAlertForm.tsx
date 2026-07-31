"use client";

import { useState } from "react";
import { createPriceAlert } from "@/lib/actions/createPriceAlert";

interface Props {
  matchKey: string;
  canonicalName: string;
  currentBestPrice: number;
}

type Status = "idle" | "open" | "submitting" | "success" | "error";

// Mismo default que mobile/src/components/AlertSheet.tsx: sugerir 90% del
// precio actual como objetivo razonable.
function suggestedTarget(currentBestPrice: number): number {
  return Math.max(1, Math.round(currentBestPrice * 0.9));
}

export function PriceAlertForm({ matchKey, canonicalName, currentBestPrice }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [email, setEmail] = useState("");
  const [targetPrice, setTargetPrice] = useState<number>(suggestedTarget(currentBestPrice));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (status === "idle") {
    return (
      <button
        type="button"
        onClick={() => setStatus("open")}
        className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink/70 hover:bg-paper"
      >
        🔔 Avisarme si baja de precio
      </button>
    );
  }

  if (status === "success") {
    return (
      <p className="text-xs text-save">
        Revisa tu email para confirmar la alerta — te avisaremos si {canonicalName} baja de precio.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const result = await createPriceAlert({ email, matchKey, canonicalName, targetPrice });
    if (result.ok) {
      setStatus("success");
    } else {
      setErrorMessage(result.error);
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-paper p-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="alert-email" className="text-xs text-muted">
          Tu email
        </label>
        <input
          id="alert-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="rounded-md border border-line px-2 py-1 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="alert-target" className="text-xs text-muted">
          Avísame si baja de
        </label>
        <input
          id="alert-target"
          type="number"
          required
          min={1}
          value={targetPrice}
          onChange={(e) => setTargetPrice(Number(e.target.value))}
          className="w-28 rounded-md border border-line px-2 py-1 text-sm tabular-nums"
        />
      </div>
      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-md bg-accent-ink px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        {status === "submitting" ? "Creando…" : "Crear alerta"}
      </button>
      <button
        type="button"
        onClick={() => setStatus("idle")}
        className="text-xs font-medium text-muted hover:text-red-600"
      >
        Cancelar
      </button>
      {status === "error" && errorMessage && <p className="w-full text-xs text-red-600">{errorMessage}</p>}
    </form>
  );
}
