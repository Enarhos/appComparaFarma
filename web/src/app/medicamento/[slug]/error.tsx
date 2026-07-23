"use client";

import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MedicationDetailError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-display text-lg font-semibold text-ink">No pudimos mostrar esta ficha</p>
        <p className="mt-1 text-sm text-red-700">
          Puede ser un problema temporal de conexión. Intentá de nuevo en unos segundos.
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-xl bg-accent px-5 py-2.5 font-semibold text-white transition hover:bg-accent-ink"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}
