import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { PHARMACIES } from "@/constants/pharmacies";
import { formatCLP, formatDateTime, formatPercent } from "@/lib/format";
import { PharmacyPriceCard } from "@/components/PharmacyPriceCard";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { SearchBox } from "@/components/SearchBox";
import { AddToRecipeButton } from "@/components/AddToRecipeButton";
import { RecipeLinkBadge } from "@/components/RecipeLinkBadge";
import { PriceAlertForm } from "@/components/PriceAlertForm";
import { resolveMedicationBySlug } from "@/lib/resolveMedication";
import { getPriceHistory } from "@/lib/priceHistory";
import { buildInsights } from "@/lib/insights";
import { buildMedicationDetailJsonLd, toJsonLdScript } from "@/lib/structuredData";
import { getSiteUrl } from "@/lib/site";

function changeColorClass(value: number | null): string {
  if (value == null) return "text-ink";
  if (value < 0) return "text-save";
  if (value > 0) return "text-red-600";
  return "text-ink";
}

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

  // Sin el sufijo "| ComparaFarma" acá: el título ya pasa por el template
  // "%s | ComparaFarma" del layout raíz (web/src/app/layout.tsx) — agregarlo
  // acá también duplicaba el sufijo (bug ya visto y corregido una vez en el
  // Sprint 2 original, reintroducido sin querer en el sprint de histórico).
  const title = `Precio de ${medication.canonicalName} en farmacias`;
  const description = `Compara el precio de ${medication.canonicalName} en ${medication.prices.length} farmacia${
    medication.prices.length !== 1 ? "s" : ""
  } chilenas y revisa el historial reciente de precios en ComparaFarma.`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    // Fichas nuevas: no indexar todavía (sin sitemap ni identidad persistida
    // este sprint) pero sí seguir sus enlaces salientes/internos.
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "ComparaFarma",
      ...(medication.imageUrl ? { images: [{ url: medication.imageUrl }] } : {}),
    },
    twitter: {
      card: medication.imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(medication.imageUrl ? { images: [medication.imageUrl] } : {}),
    },
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

  const history = await getPriceHistory(medication.matchKey);
  const hasHistory = history.series.some((s) => s.points.length > 0);
  const insights = buildInsights(medication, history);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <RecipeLinkBadge />
      </div>

      {/* Sprint Web 2: cabecera compactada — antes eran dos bloques apilados
          (nombre/laboratorio, luego imagen/precio en una card aparte); ahora
          es un solo bloque para reducir el espacio vertical antes del
          contenido principal (comparación + histórico). */}
      <div className="mt-4 flex items-start gap-4 rounded-2xl border border-line bg-paper-raised p-4 sm:p-5">
        {medication.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- imágenes de dominios variables por farmacia, sin lista blanca que mantener
          <img
            src={medication.imageUrl}
            alt=""
            width={72}
            height={72}
            className="h-16 w-16 shrink-0 rounded-lg border border-line bg-white object-contain p-1.5 sm:h-[72px] sm:w-[72px]"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <h1 className="font-display text-2xl font-semibold leading-snug text-ink">
              {medication.canonicalName}
            </h1>
            {medication.isBioequivalent && (
              <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-ink">
                🌿 Bioequivalente
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted">{medication.laboratory ?? "Laboratorio no especificado"}</p>

          <div className="mt-2 flex flex-wrap items-start gap-2">
            <AddToRecipeButton
              matchKey={medication.matchKey}
              canonicalName={medication.canonicalName}
              imageUrl={medication.imageUrl}
            />
            {best && (
              <PriceAlertForm
                matchKey={medication.matchKey}
                canonicalName={medication.canonicalName}
                currentBestPrice={best.channels.effective}
              />
            )}
          </div>

          {best && bestDisplay && (
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-2xl font-semibold tabular-nums text-accent-ink">
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
            <p className="mt-1 text-xs text-muted">Última actualización: {formatDateTime(lastUpdatedAt)}</p>
          )}
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-ink">Comparación por farmacia</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {sortedPrices.map((price) => (
            <PharmacyPriceCard key={price.pharmacySlug} price={price} isBestPrice={price === best} />
          ))}
        </ul>
      </section>

      {/* Sprint Web 2: el histórico pasa a ser el centro visual de la página —
          card propia con más padding, título más grande y el gráfico casi el
          doble de alto que antes (ver PriceHistoryChart). */}
      <section className="mt-8 rounded-2xl border border-line bg-paper-raised p-5 sm:p-7">
        <h2 className="font-display text-2xl font-semibold text-ink">Histórico de precios</h2>

        {!hasHistory && (
          <p className="mt-3 rounded-xl border border-line bg-paper p-4 text-sm text-muted">
            Todavía no tenemos suficiente historial registrado para este medicamento. Volvé más adelante para
            ver cómo evoluciona el precio.
          </p>
        )}

        {hasHistory && (
          <>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted">Mínimo registrado</dt>
                <dd className="mt-0.5 font-display text-lg font-semibold tabular-nums text-ink">
                  {history.summary.lowestRecordedPrice != null
                    ? formatCLP(history.summary.lowestRecordedPrice)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Máximo registrado</dt>
                <dd className="mt-0.5 font-display text-lg font-semibold tabular-nums text-ink">
                  {history.summary.highestRecordedPrice != null
                    ? formatCLP(history.summary.highestRecordedPrice)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Variación 7 días</dt>
                <dd
                  className={`mt-0.5 font-display text-lg font-semibold tabular-nums ${changeColorClass(history.summary.change7dPercent)}`}
                >
                  {history.summary.change7dPercent != null ? formatPercent(history.summary.change7dPercent) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Variación 30 días</dt>
                <dd
                  className={`mt-0.5 font-display text-lg font-semibold tabular-nums ${changeColorClass(history.summary.change30dPercent)}`}
                >
                  {history.summary.change30dPercent != null ? formatPercent(history.summary.change30dPercent) : "—"}
                </dd>
              </div>
            </dl>

            <div className="mt-6">
              <PriceHistoryChart
                series={history.series}
                referenceValue={history.summary.lowestRecordedPrice}
                referenceLabel="Mínimo histórico"
              />
            </div>
          </>
        )}

        <p className="mt-4 text-xs text-muted">
          Los precios son referenciales, pueden variar respecto al valor final en tienda o carro de compra, y
          se actualizan automáticamente a partir de cada búsqueda registrada.
        </p>
      </section>

      {insights.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-ink">Insights</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {insights.map((insight) => (
              <li
                key={insight}
                className="flex items-start gap-2 rounded-xl border border-line bg-paper-raised p-3 text-sm text-ink/80"
              >
                <span aria-hidden>💡</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

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
