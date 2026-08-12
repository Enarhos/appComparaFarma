import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { QUICK_SEARCHES } from "@/constants/pharmacies";
import { formatCLP } from "@/lib/format";

const DEMO_PRICES = [
  { pharmacy: "Cruz Verde", price: 4990, color: "var(--color-cruz-verde)" },
  { pharmacy: "Salcobrand", price: 3290, color: "var(--color-salcobrand)" },
  { pharmacy: "EasyFarma", price: 1415, color: "var(--color-easyfarma)" },
];

export default function HomePage() {
  const cheapest = DEMO_PRICES[DEMO_PRICES.length - 1]!;
  const priciest = DEMO_PRICES[0]!;
  const savings = priciest.price - cheapest.price;

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      <div className="flex justify-end">
        <Link href="/cuenta" className="text-sm font-medium text-accent-ink underline-offset-2 hover:underline">
          Mi cuenta
        </Link>
      </div>

      <div className="mt-6 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        {/* Columna de texto */}
        <div>
          <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink">
            9 farmacias chilenas · en tiempo real
          </span>
          <h1 className="mt-4 text-balance font-display text-5xl font-semibold leading-[1.05] text-ink sm:text-6xl">
            El mismo remedio,
            <br />
            precios muy distintos.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
            ComparaFarma busca el precio más bajo entre Cruz Verde, Salcobrand, Ahumada, Dr. Simi y
            5 farmacias más — gratis, sin publicidad y sin registro.
          </p>

          <div className="mt-8">
            <SearchBox />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {QUICK_SEARCHES.map((term) => (
              <Link
                key={term}
                href={`/buscar/${encodeURIComponent(term)}`}
                className="rounded-full border border-line bg-paper-raised px-4 py-1.5 text-sm text-ink/80 transition hover:border-accent hover:text-accent-ink"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>

        {/* Prueba visual — la tesis del producto */}
        <div className="rounded-2xl border border-line bg-paper-raised p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <p className="font-sans text-xs font-medium uppercase tracking-wide text-muted">
            Paracetamol 500 mg · 16 comprimidos
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {DEMO_PRICES.map((p) => (
              <li key={p.pharmacy} className="flex items-center gap-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: p.color }}
                  aria-hidden
                />
                <span className="flex-1 text-sm text-ink/80">{p.pharmacy}</span>
                <span
                  className={`font-display text-lg font-semibold tabular-nums ${
                    p.price === cheapest.price ? "text-accent-ink" : "text-ink/50 line-through decoration-ink/20"
                  }`}
                >
                  {formatCLP(p.price)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-xl bg-save-soft px-4 py-3">
            <p className="font-sans text-sm font-semibold text-save">
              Ahorrás {formatCLP(savings)} eligiendo bien.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-20 text-center text-sm text-muted">
        ¿Preferís usar la app?{" "}
        <a
          href="https://play.google.com/store/apps/details?id=mla.app.comparafarma"
          className="font-medium text-accent-ink underline underline-offset-2"
        >
          Descargala en Google Play
        </a>
      </p>
    </main>
  );
}
