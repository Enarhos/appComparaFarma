export default function Loading() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink">
        PreciosFarma
      </span>
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent"
        role="status"
        aria-label="Cargando"
      />
      <p className="text-sm text-muted">Cargando…</p>
    </main>
  );
}
