import type { Metadata } from "next";
import Link from "next/link";
import { searchMedications } from "@/lib/search";
import { MedicationCard } from "@/components/MedicationCard";
import { SearchBox } from "@/components/SearchBox";
import { RecipeLinkBadge } from "@/components/RecipeLinkBadge";
import { buildMedicationJsonLd, toJsonLdScript } from "@/lib/structuredData";

interface PageProps {
  params: Promise<{ query: string }>;
}

function decodeTerm(raw: string): string {
  return decodeURIComponent(raw).trim();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { query } = await params;
  const term = decodeTerm(query);
  return {
    title: `Precio de ${term} en Chile — Compara 9 Farmacias`,
    description: `Encuentra el precio más barato de ${term} entre Cruz Verde, Salcobrand, Ahumada, Dr. Simi y 5 farmacias más en Chile. Actualizado en tiempo real.`,
  };
}

export default async function SearchPage({ params }: PageProps) {
  const { query } = await params;
  const term = decodeTerm(query);
  const { results, error } = await searchMedications(term);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-sm text-muted hover:text-accent-ink">
          ← Volver a la búsqueda
        </Link>
        <RecipeLinkBadge />
      </div>

      <h1 className="mt-4 font-display text-3xl font-semibold text-ink">
        Resultados para <span className="text-accent-ink">&quot;{term}&quot;</span>
      </h1>
      {results.length > 0 && (
        <p className="mt-1 text-sm text-muted">
          {results.length} medicamento{results.length !== 1 ? "s" : ""} encontrado
          {results.length !== 1 ? "s" : ""}
        </p>
      )}

      <div className="mt-6">
        <SearchBox initialQuery={term} />
      </div>

      {error && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && results.length === 0 && (
        <div className="mt-8 rounded-xl border border-line bg-paper-raised p-6 text-center">
          <p className="text-ink/80">
            No encontramos resultados para &quot;{term}&quot;.
          </p>
          <p className="mt-1 text-sm text-muted">
            Prueba con el principio activo (ej. &quot;Paracetamol&quot; en vez del nombre comercial) o
            revisa la ortografía.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          {results.map((medication) => (
            <MedicationCard key={medication.matchKey} medication={medication} />
          ))}
        </div>
      )}

      {results.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: toJsonLdScript(buildMedicationJsonLd(term, results)),
          }}
        />
      )}
    </main>
  );
}
