import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { PHARMACIES } from "@/constants/pharmacies";
import { formatCLP, formatDateTime } from "@/lib/format";
import { channelChips } from "@/components/MedicationCard";
import { SearchBox } from "@/components/SearchBox";
import { resolveMedicationBySlug } from "@/lib/resolveMedication";
import { buildMedicationDetailJsonLd, toJsonLdScript } from "@/lib/structuredData";
import { getSiteUrl } from "@/lib/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolution = await resolveMedicationBySlug(slug);

  if (resolution.status !== "ok") {
    return {
      title: "Medicamento no encontrado",
      robots: { index: false, follow: true },
    };
  }

  const { medication, canonicalSlug } = resolution;
  // El canonical siempre apunta al slug vigente recién calculado, nunca a la
  // URL pedida — si difieren, la página redirige (ver más abajo) y el
  // canonical ya anticipa a dónde.
  const canonicalUrl = `${getSiteUrl()}/medicamento/${canonicalSlug}`;

  return {
    title: `${medication.canonicalName} — Precio y dónde comprar`,
    description: `Comparación de precio de ${medication.canonicalName} en ${medication.prices.length} farmacia${
      medication.prices.length !== 1 ? "s" : ""
    } chilenas, actualizado en tiempo real.`,
    alternates: { canonical: canonicalUrl },
    // Fichas nuevas: no indexar todavía (sin sitemap ni identidad persistida
    // este sprint) pero sí seguir sus enlaces salientes/internos.
    robots: { index: false, follow: true },
  };
}

export default async function MedicationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const resolution = await resolveMedicationBySlug(slug);

  if (resolution.status === "not-found") {
    notFound();
  }

  if (resolution.status === "ambiguous") {
    // No se elige un ganador por precio/farmacia/orden — ver resolveMedication.ts.
    throw new Error("Encontramos más de un medicamento para este enlace.");
  }

  const { medication, canonicalSlug } = resolution;

  if (canonicalSlug !== slug) {
    permanentRedirect(`/medicamento/${canonicalSlug}`);
  }

  const sortedPrices = [...medication.prices].sort((a, b) => a.channels.effective - b.channels.effective);
  const best = sortedPrices[0];
  const priciest = sortedPrices[sortedPrices.length - 1];
  const bestDisplay = best ? PHARMACIES[best.pharmacySlug] : null;
  const savings = best && priciest && priciest !== best ? priciest.channels.effective - best.channels.effective : 0;
  const lastUpdatedAt = medication.prices.length
    ? new Date(Math.max(...medication.prices.map((p) => new Date(p.fetchedAt).getTime()))).toISOString()
    : null;
  const pageUrl = `${getSiteUrl()}/medicamento/${canonicalSlug}`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted">
        <Link href="/" className="hover:text-accent-ink">
          Inicio
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/buscar/${encodeURIComponent(medication.canonicalName)}`} className="hover:text-accent-ink">
          Resultados
        </Link>
        <span aria-hidden>/</span>
        <span className="text-ink/70">{medication.canonicalName}</span>
      </nav>

      <header className="mt-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold leading-snug text-ink">
            {medication.canonicalName}
          </h1>
          {medication.isBioequivalent && (
            <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-ink">
              🌿 Bioequivalente
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted">{medication.laboratory ?? "Laboratorio no especificado"}</p>
      </header>

      <section className="mt-6 rounded-2xl border border-line bg-paper-raised p-6">
        <div className="flex items-start gap-5">
          {medication.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- imágenes de dominios variables por farmacia, sin lista blanca que mantener
            <img
              src={medication.imageUrl}
              alt=""
              width={96}
              height={96}
              className="h-24 w-24 shrink-0 rounded-lg border border-line bg-white object-contain p-2"
            />
          )}
          <div className="min-w-0 flex-1">
            {best && bestDisplay && (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-3xl font-semibold tabular-nums text-accent-ink">
                  {formatCLP(best.channels.effective)}
                </span>
                <span className="text-sm text-muted">en {bestDisplay.name}</span>
                {savings > 0 && (
                  <span className="rounded-md bg-save-soft px-2 py-0.5 text-xs font-semibold text-save">
                    ahorrás {formatCLP(savings)} vs. la farmacia más cara
                  </span>
                )}
              </div>
            )}
            {lastUpdatedAt && (
              <p className="mt-2 text-xs text-muted">Última actualización: {formatDateTime(lastUpdatedAt)}</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-ink">Comparación por farmacia</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {sortedPrices.map((price) => {
            const display = PHARMACIES[price.pharmacySlug];
            const chips = channelChips(price, display?.cardLabel ?? null);

            return (
              <li key={price.pharmacySlug} className="rounded-xl border border-line bg-paper-raised p-4">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: display?.color ?? "#9ca3af" }}
                    aria-hidden
                  />
                  <span className="flex-1 text-sm font-medium text-ink/80">
                    {display?.name ?? price.pharmacySlug}
                  </span>
                  {!price.hasStock && (
                    <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-muted">Sin stock</span>
                  )}
                  <span className="text-sm font-semibold tabular-nums text-ink">
                    {formatCLP(price.channels.effective)}
                  </span>
                </div>

                {chips.length > 1 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 pl-[18px]">
                    {chips.map((chip) => (
                      <span
                        key={chip.label}
                        className="rounded-md bg-paper px-2 py-0.5 text-xs text-muted tabular-nums"
                      >
                        {chip.label}: {formatCLP(chip.value)}
                      </span>
                    ))}
                  </div>
                )}

                {price.onlineUrl && (
                  <a
                    href={price.onlineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-medium text-accent-ink hover:underline"
                  >
                    Ver en {display?.name ?? price.pharmacySlug} →
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-ink">Buscar otro medicamento</h2>
        <div className="mt-3">
          <SearchBox />
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(buildMedicationDetailJsonLd(medication, pageUrl)) }}
      />
    </main>
  );
}
