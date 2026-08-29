import type { Metadata } from "next";
import Link from "next/link";
import { parseQueryIntent } from "@comparafarma/domain";
import { searchMedications } from "@/lib/search";
import { MedicationResultsGroup } from "@/components/MedicationResultsGroup";
import {
  groupMedicationResultsByMatchKey,
  splitGroupsByConcentration,
} from "@/lib/groupMedicationResults";
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
  const groups = groupMedicationResultsByMatchKey(results);
  // CF-SEARCH-002 — la API ya clasificó cada resultado por cohorte de
  // concentración (`concentrationMatch`). Acá solo se separan las secciones;
  // no se vuelve a parsear ningún nombre ni se reordena nada.
  const { primary, other } = splitGroupsByConcentration(groups);
  // Solo para el encabezado de la sección secundaria: el principio activo tal
  // como lo entendió el dominio, sin la concentración.
  const activeTerm = parseQueryIntent(term).retrievalQuery || term;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-sm text-muted hover:text-accent-ink">
          ← Volver a la búsqueda
        </Link>
        <RecipeLinkBadge />
      </div>

      <h1 className="mt-4 font-display text-2xl font-semibold text-ink sm:text-3xl">
        Resultados para <span className="text-accent-ink">&quot;{term}&quot;</span>
      </h1>
      {results.length > 0 && (
        <p className="mt-1 text-sm text-muted">
          {groups.length} {groups.length === 1 ? "presentación encontrada" : "presentaciones encontradas"}
          {" · "}
          {results.length} {results.length === 1 ? "opción comercial" : "opciones comerciales"}
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
        <div className="mt-8 rounded-xl border border-line bg-paper-raised p-4 text-center sm:p-6">
          <p className="text-ink/80">
            No encontramos resultados para &quot;{term}&quot;.
          </p>
          <p className="mt-1 text-sm text-muted">
            Prueba con el principio activo (ej. &quot;Paracetamol&quot; en vez del nombre comercial) o
            revisa la ortografía.
          </p>
        </div>
      )}

      {primary.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          {primary.map((group) => (
            <MedicationResultsGroup key={group.matchKey} group={group} />
          ))}
        </div>
      )}

      {/* CF-SEARCH-002 — otras concentraciones del mismo principio activo. No
          se ocultan (podrían ser lo que el usuario necesita), pero quedan
          claramente separadas de lo que pidió y nunca por delante. */}
      {other.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">
            Otras concentraciones de {activeTerm}
          </h2>
          <p className="mt-1 text-sm text-muted">
            No coinciden con la concentración que buscaste. Revisa la dosis antes de comparar
            precios.
          </p>
          <div className="mt-4 flex flex-col gap-4">
            {other.map((group) => (
              <MedicationResultsGroup key={group.matchKey} group={group} />
            ))}
          </div>
        </section>
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
