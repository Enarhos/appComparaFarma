import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { QUICK_SEARCHES } from "@/constants/pharmacies";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center px-6 py-16 text-center">
      <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-best">
        9 farmacias en Chile, comparadas en tiempo real
      </span>

      <h1 className="mt-6 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
        No pagues de más por tus medicamentos
      </h1>
      <p className="mt-4 max-w-xl text-lg text-neutral-600">
        ComparaFarma busca el precio más bajo entre Cruz Verde, Salcobrand, Ahumada, Dr. Simi y 5
        farmacias más — gratis, sin publicidad y sin registro.
      </p>

      <div className="mt-8 w-full flex justify-center">
        <SearchBox />
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {QUICK_SEARCHES.map((term) => (
          <Link
            key={term}
            href={`/buscar/${encodeURIComponent(term)}`}
            className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 transition hover:border-best hover:text-best"
          >
            {term}
          </Link>
        ))}
      </div>

      <p className="mt-16 text-sm text-neutral-400">
        ¿Preferís usar la app?{" "}
        <a
          href="https://play.google.com/store/apps/details?id=mla.app.comparafarma"
          className="font-medium text-best underline underline-offset-2"
        >
          Descargala en Google Play
        </a>
      </p>
    </main>
  );
}
