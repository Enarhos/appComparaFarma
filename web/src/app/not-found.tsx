import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink">
        PreciosFarma
      </span>
      <h1 className="font-display text-2xl font-semibold text-ink">Página no encontrada</h1>
      <p className="text-sm text-muted">La página que buscás no existe o cambió de dirección.</p>
      <Link
        href="/"
        className="rounded-xl bg-accent px-5 py-2.5 font-semibold text-white transition hover:bg-accent-ink"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
