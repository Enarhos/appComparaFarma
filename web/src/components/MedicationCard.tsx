import Link from "next/link";
import { computeSavings, sortByEffectivePrice, type PharmacyPrice, type MedicationResult } from "@comparafarma/domain";
import { PHARMACIES } from "@/constants/pharmacies";
import { formatCLP } from "@/lib/format";
import { buildMedicationSlug } from "@/lib/medicationSlug";
import { AddToRecipeButton } from "@/components/AddToRecipeButton";
import { identityLine } from "@/lib/brandLabels";

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
  const sortedPrices = sortByEffectivePrice(medication.prices);
  const { cheapest: best, savings } = computeSavings(sortedPrices);
  const bestDisplay = best ? PHARMACIES[best.pharmacySlug] : null;

  const detailHref = `/medicamento/${buildMedicationSlug(medication)}`;

  return (
    <article className="rounded-2xl border border-line bg-paper-raised p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
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
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
            <h2 className="font-display text-lg font-semibold leading-snug text-ink sm:text-xl">
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
          {/* CF-DATA-001: la línea de identidad ya no lee `laboratory` (alias
              ambiguo: fabricante en unas farmacias, marca en Salcobrand). Ver
              `identityLine()` — mismo texto donde antes había dato, e
              información nueva donde antes decía "no especificado". */}
          <p className="mt-0.5 text-sm text-muted">{identityLine(medication)}</p>
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
              ahorras {formatCLP(savings)}
            </span>
          )}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-start gap-3">
        <Link href={detailHref} className="text-sm font-medium text-accent-ink hover:underline">
          Ver detalle e histórico →
        </Link>
        <AddToRecipeButton
          matchKey={medication.matchKey}
          canonicalName={medication.canonicalName}
          imageUrl={medication.imageUrl}
        />
      </div>

      <ul className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
        {sortedPrices.map((price) => {
          const display = PHARMACIES[price.pharmacySlug];
          const chips = channelChips(price, display?.cardLabel ?? null);
          const row = (
            <>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: display?.color ?? "#9ca3af" }}
                  aria-hidden
                />
                <span className="min-w-0 flex-[1_1_9rem] text-sm font-medium text-ink/80">
                  {display?.name ?? price.pharmacySlug}
                </span>
                {!price.hasStock && (
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-muted">Sin stock</span>
                )}
                <span className="ml-auto text-sm font-semibold tabular-nums text-ink">
                  {formatCLP(price.channels.effective)}
                </span>
              </div>
              {chips.length > 1 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5 sm:pl-[18px]">
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
