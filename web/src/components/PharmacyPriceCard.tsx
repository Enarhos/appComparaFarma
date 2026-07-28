import type { PharmacyPrice } from "@comparafarma/domain";
import { PHARMACIES } from "@/constants/pharmacies";
import { formatCLP } from "@/lib/format";
import { channelChips } from "@/components/MedicationCard";

interface Props {
  price: PharmacyPrice;
  isBestPrice: boolean;
}

/**
 * Tarjeta de farmacia para la ficha de medicamento (Sprint Web 2). Reemplaza
 * el <li> plano anterior: agrega el badge "Mejor precio" y un botón real
 * (no solo un link de texto) hacia la farmacia.
 */
export function PharmacyPriceCard({ price, isBestPrice }: Props) {
  const display = PHARMACIES[price.pharmacySlug];
  const chips = channelChips(price, display?.cardLabel ?? null);

  return (
    <li className="rounded-xl border border-line bg-paper-raised p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="inline-block h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: display?.color ?? "#9ca3af" }}
            aria-hidden
          />
          <span className="truncate text-sm font-medium text-ink/80">{display?.name ?? price.pharmacySlug}</span>
          {isBestPrice && (
            <span className="shrink-0 rounded-full bg-save-soft px-2 py-0.5 text-xs font-semibold text-save">
              Mejor precio
            </span>
          )}
          {!price.hasStock && (
            <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-muted">Sin stock</span>
          )}
        </div>
        <span className="text-base font-semibold tabular-nums text-ink">{formatCLP(price.channels.effective)}</span>
      </div>

      {chips.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-1.5 pl-5">
          {chips.map((chip) => (
            <span key={chip.label} className="rounded-md bg-paper px-2 py-0.5 text-xs text-muted tabular-nums">
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
          className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-accent-soft px-4 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-soft/70 sm:w-auto"
        >
          Ir a la farmacia →
        </a>
      )}
    </li>
  );
}
