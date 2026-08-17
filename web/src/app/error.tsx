"use client";

import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink">
        PreciosFarma
      </span>
      <h1 className="font-display text-2xl font-semibold text-ink">Algo salió mal</h1>
      <p className="text-sm text-muted">
        Tuvimos un problema inesperado de nuestro lado. Podés intentar de nuevo o volver más tarde.
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-accent px-5 py-2.5 font-semibold text-white transition hover:bg-accent-ink"
      >
        Reintentar
      </button>
    </main>
  );
}
