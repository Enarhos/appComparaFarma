"use client";

import { useState } from "react";
import Link from "next/link";
import { sortByEffectivePrice, type MedicationResult } from "@comparafarma/domain";
import { PHARMACIES } from "@/constants/pharmacies";
import { formatCLP } from "@/lib/format";
import { buildMedicationSlug } from "@/lib/medicationSlug";
import { channelChips } from "@/components/MedicationCard";
import { AddToRecipeButton } from "@/components/AddToRecipeButton";

interface Props {
  /** Un producto comercial completo (una marca/presentationKey) dentro de un grupo farmacológico. */
  medication: MedicationResult;
}

/**
 * Fila compacta de producto comercial dentro de un MedicationResultsGroup.
 * Deliberadamente NO reutiliza <MedicationCard> completa (mantendría la
 * altura actual que esta feature busca reducir) — reutiliza sus utilidades
 * internas (`channelChips`, `sortByEffectivePrice`, `PHARMACIES`,
 * `buildMedicationSlug`, `AddToRecipeButton`) para no duplicar lógica de
 * negocio de presentación.
 *
 * "Marca no identificada" (copy aprobado) se muestra cuando `laboratory` es
 * null/vacío — lectura directa del campo semántico existente, sin parsear
 * `presentationKey`.
 */
export function CommercialProductRow({ medication }: Props) {
  const [expanded, setExpanded] = useState(false);
  const brandLabel = medication.laboratory?.trim() ? medication.laboratory : "Marca no identificada";
  const isUnknownBrand = !medication.laboratory?.trim();
  const pharmacyCount = medication.prices.length;
  const detailHref = `/medicamento/${buildMedicationSlug(medication)}`;
  const sortedPrices = sortByEffectivePrice(medication.prices);
  const rowId = `commercial-product-${buildMedicationSlug(medication)}`;

  return (
    <div className="border-t border-line first:border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3">
        {/* CF-WEB-001 — `flex-1` (flex-basis 0) hacía que este bloque nunca
            provocara el wrap del contenedor: se encogía hasta ~12px mientras
            sus hijos `shrink-0` (badge bioequivalente + "N farmacias") se
            desbordaban y se superponían con el precio a ≤430px, dejando la
            marca comercial ilegible o directamente invisible. Con una
            flex-basis real (mismo idiom que `flex-[1_1_9rem]` de las filas de
            farmacia y `flex-[1_1_12rem]` de PharmacyPriceCard) el contenedor
            padre sí hace wrap en móvil y a ≥sm el layout queda idéntico. */}
        <div className="flex min-w-0 flex-[1_1_11rem] flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={
              isUnknownBrand
                ? "min-w-0 max-w-full truncate text-sm font-medium text-muted"
                : "min-w-0 max-w-full truncate text-sm font-medium text-ink"
            }
          >
            {brandLabel}
          </span>
          {medication.isBioequivalent && (
            <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-ink">
              🌿 Bioequivalente
            </span>
          )}
          <span className="shrink-0 text-xs text-muted">
            {pharmacyCount} farmacia{pharmacyCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <span className="text-sm font-semibold tabular-nums text-ink">
            desde {formatCLP(medication.bestPrice)}
          </span>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={rowId}
            onClick={() => setExpanded((value) => !value)}
            className="text-sm font-medium text-accent-ink hover:underline"
          >
            {expanded ? "Ocultar precios ^" : "Ver precios >"}
          </button>
        </div>
      </div>

      {expanded && (
        <div id={rowId} className="pb-3">
          <ul className="flex flex-col gap-3 rounded-lg bg-paper p-3">
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
                          className="rounded-md bg-paper-raised px-2 py-0.5 text-xs text-muted tabular-nums"
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

          <div className="mt-3 flex flex-wrap items-start gap-3">
            <Link href={detailHref} className="text-sm font-medium text-accent-ink hover:underline">
              Ver detalle e histórico →
            </Link>
            <AddToRecipeButton
              matchKey={medication.matchKey}
              canonicalName={medication.canonicalName}
              imageUrl={medication.imageUrl}
            />
          </div>
        </div>
      )}
    </div>
  );
}
