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
  const bestDisplay = best ? PHARMACIES[best.pharmacySlug] : null;

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{medication.canonicalName}</h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            {medication.laboratory ?? "Laboratorio no especificado"}
          </p>
        </div>
        {medication.isBioequivalent && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            🌿 Bioequivalente
          </span>
        )}
      </div>

      {best && bestDisplay && (
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-best">{formatCLP(best.channels.effective)}</span>
          <span className="text-sm text-neutral-500">en {bestDisplay.name}</span>
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-4">
        {sortedPrices.map((price) => {
          const display = PHARMACIES[price.pharmacySlug];
          const content = (
            <>
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: display?.color ?? "#9ca3af" }}
                aria-hidden
              />
              <span className="flex-1 text-sm text-neutral-700">{display?.name ?? price.pharmacySlug}</span>
              <span className="text-sm font-semibold text-neutral-900">
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
                  className="flex flex-1 items-center gap-2 rounded-lg px-2 py-1 -mx-2 hover:bg-neutral-50"
                >
                  {content}
                </a>
              ) : (
                <div className="flex flex-1 items-center gap-2 px-2 py-1 -mx-2">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
