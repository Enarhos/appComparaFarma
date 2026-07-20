import type { MedicationResult } from "@comparafarma/domain";
import { PHARMACIES } from "@/constants/pharmacies";
import { formatCLP } from "@/lib/format";

interface Props {
  medication: MedicationResult;
}

export function MedicationCard({ medication }: Props) {
  const sortedPrices = [...medication.prices].sort(
    (a, b) => a.channels.effective - b.channels.effective
  );
  const best = sortedPrices[0];
  const priciest = sortedPrices[sortedPrices.length - 1];
  const bestDisplay = best ? PHARMACIES[best.pharmacySlug] : null;
  const savings = best && priciest && priciest !== best ? priciest.channels.effective - best.channels.effective : 0;

  return (
    <article className="rounded-2xl border border-line bg-paper-raised p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold leading-snug text-ink">
            {medication.canonicalName}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {medication.laboratory ?? "Laboratorio no especificado"}
          </p>
        </div>
        {medication.isBioequivalent && (
          <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-ink">
            🌿 Bioequivalente
          </span>
        )}
      </div>

      {best && bestDisplay && (
        <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-2xl font-semibold tabular-nums text-accent-ink">
            {formatCLP(best.channels.effective)}
          </span>
          <span className="text-sm text-muted">en {bestDisplay.name}</span>
          {savings > 0 && (
            <span className="rounded-md bg-save-soft px-2 py-0.5 text-xs font-semibold text-save">
              ahorrás {formatCLP(savings)}
            </span>
          )}
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
        {sortedPrices.map((price) => {
          const display = PHARMACIES[price.pharmacySlug];
          const content = (
            <>
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: display?.color ?? "#9ca3af" }}
                aria-hidden
              />
              <span className="flex-1 text-sm text-ink/80">{display?.name ?? price.pharmacySlug}</span>
              <span className="text-sm font-semibold tabular-nums text-ink">
                {formatCLP(price.channels.effective)}
              </span>
            </>
          );
          return (
            <li key={price.pharmacySlug} className="flex items-center gap-2">
              {price.onlineUrl ? (
                <a
                  href={price.onlineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="-mx-2 flex flex-1 items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent-soft/60"
                >
                  {content}
                </a>
              ) : (
                <div className="-mx-2 flex flex-1 items-center gap-2 px-2 py-1">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
