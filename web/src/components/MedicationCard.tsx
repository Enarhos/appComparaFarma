import Link from "next/link";
import type { PharmacyPrice, MedicationResult } from "@comparafarma/domain";
import { PHARMACIES } from "@/constants/pharmacies";
import { formatCLP } from "@/lib/format";
import { buildMedicationSlug } from "@/lib/medicationSlug";

interface Props {
  medication: MedicationResult;
}

export function channelChips(price: PharmacyPrice, cardLabel: string | null): { label: string; value: number }[] {
  const { channels } = price;
  const chips: { label: string; value: number }[] = [{ label: "Presencial", value: channels.store }];
  if (channels.online != null) chips.push({ label: "Online", value: channels.online });
  if (channels.cmr != null) chips.push({ label: cardLabel ?? "Tarjeta", value: channels.cmr });
  if (channels.sbpay != null) chips.push({ label: "SBPay", value: channels.sbpay });
  return chips;
}

export function MedicationCard({ medication }: Props) {
  const sortedPrices = [...medication.prices].sort(
    (a, b) => a.channels.effective - b.channels.effective
  );
  const best = sortedPrices[0];
  const priciest = sortedPrices[sortedPrices.length - 1];
  const bestDisplay = best ? PHARMACIES[best.pharmacySlug] : null;
  const savings = best && priciest && priciest !== best ? priciest.channels.effective - best.channels.effective : 0;

  const detailHref = `/medicamento/${buildMedicationSlug(medication)}`;

  return (
    <article className="rounded-2xl border border-line bg-paper-raised p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-start gap-4">
        {medication.imageUrl && (
          <Link href={detailHref} className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- imágenes de dominios variables por farmacia, sin lista blanca que mantener */}
            <img
              src={medication.imageUrl}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 rounded-lg border border-line bg-white object-contain p-1"
            />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-xl font-semibold leading-snug text-ink">
              <Link href={detailHref} className="hover:text-accent-ink">
                {medication.canonicalName}
              </Link>
            </h2>
            {medication.isBioequivalent && (
              <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-ink">
                🌿 Bioequivalente
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {medication.laboratory ?? "Laboratorio no especificado"}
          </p>
        </div>
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

      <ul className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
        {sortedPrices.map((price) => {
          const display = PHARMACIES[price.pharmacySlug];
          const chips = channelChips(price, display?.cardLabel ?? null);
          const row = (
            <>
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
                <div className="mt-1.5 flex flex-wrap gap-1.5 pl-[18px]">
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
            </>
          );
          return (
            <li key={price.pharmacySlug}>
              {price.onlineUrl ? (
                <a
                  href={price.onlineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="-mx-2 block rounded-lg px-2 py-1 hover:bg-accent-soft/60"
                >
                  {row}
                </a>
              ) : (
                <div className="-mx-2 px-2 py-1">{row}</div>
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
