export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <span className="sr-only" role="status">
        Cargando ficha del medicamento…
      </span>
      <div className="h-4 w-40 animate-pulse rounded bg-line" />
      <div className="mt-4 h-9 w-2/3 animate-pulse rounded bg-line" />
      <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-line" />

      <div className="mt-6 animate-pulse rounded-2xl border border-line bg-paper-raised p-6">
        <div className="flex items-start gap-5">
          <div className="h-24 w-24 shrink-0 rounded-lg bg-line" />
          <div className="min-w-0 flex-1">
            <div className="h-8 w-1/2 rounded bg-line" />
            <div className="mt-2 h-3 w-1/3 rounded bg-line" />
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <div className="h-16 animate-pulse rounded-xl bg-line" />
        <div className="h-16 animate-pulse rounded-xl bg-line" />
        <div className="h-16 animate-pulse rounded-xl bg-line" />
      </div>
    </main>
  );
}
