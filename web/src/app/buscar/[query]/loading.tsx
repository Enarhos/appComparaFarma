function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-line bg-paper-raised p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="h-14 w-14 shrink-0 rounded-lg bg-line" />
        <div className="min-w-0 flex-1">
          <div className="h-5 w-2/3 rounded bg-line" />
          <div className="mt-2 h-3 w-1/3 rounded bg-line" />
        </div>
      </div>
      <div className="mt-4 h-6 w-1/3 rounded bg-line" />
      <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
        <div className="h-5 rounded bg-line" />
        <div className="h-5 rounded bg-line" />
        <div className="h-5 rounded bg-line" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <span className="sr-only" role="status">
        Cargando resultados…
      </span>
      <div className="h-4 w-32 animate-pulse rounded bg-line" />
      <div className="mt-4 h-9 w-2/3 animate-pulse rounded bg-line" />
      <div className="mt-6 flex flex-col gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </main>
  );
}
