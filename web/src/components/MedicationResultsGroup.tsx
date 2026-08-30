"use client";

import { useState } from "react";
import {
  computeRemainingOptions,
  rowVisibilityClassName,
  type MedicationGroup,
} from "@/lib/groupMedicationResults";
import { CommercialProductRow } from "@/components/CommercialProductRow";

interface Props {
  group: MedicationGroup;
}

/**
 * Grupo padre de una presentación farmacológica (matchKey) — Fase 2 UX.
 * Muestra el título de presentación una sola vez y una fila compacta por
 * producto comercial (marca), en vez de una tarjeta grande por marca como
 * antes. Ver docs/product para el detalle de la decisión (Fase 2 UX).
 */
export function MedicationResultsGroup({ group }: Props) {
  const [expanded, setExpanded] = useState(false);
  const total = group.products.length;
  const remaining = computeRemainingOptions(total);
  const hasMoreThanMobileDefault = remaining.mobile > 0;
  const hasMoreThanDesktopDefault = remaining.desktop > 0;
  const showMoreButton = !expanded && (hasMoreThanMobileDefault || hasMoreThanDesktopDefault);
  const moreButtonClassName = hasMoreThanDesktopDefault ? "" : "sm:hidden";

  return (
    <section className="rounded-2xl border border-line bg-paper-raised p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-5">
      <div className="flex items-start gap-3">
        {group.imageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element -- imágenes de dominios variables por farmacia, sin lista blanca que mantener (mismo criterio que MedicationCard) */
          <img
            src={group.imageUrl}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-lg border border-line bg-white object-contain p-1"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          {/* CF-WEB-001 — el título convive con la miniatura de 48px, así que
              a 320px le quedan ~196px: nombres con tokens compuestos largos y
              sin espacio ("Vildagliptina/Metformina", "Clorhidrato/Paracetamol")
              no tenían punto de corte y se salían de la tarjeta. `min-w-0`
              permite que el ítem flex se encoja y `break-words` habilita el
              corte dentro del token solo cuando no entra completo. */}
          <h2 className="min-w-0 break-words font-display text-lg font-semibold leading-snug text-ink sm:text-xl">
            {group.title}
          </h2>
          <span className="text-sm text-muted">
            {total} {total === 1 ? "opción encontrada" : "opciones encontradas"}
          </span>
        </div>
      </div>

      <ul className="mt-3 flex flex-col">
        {group.products.map((product, index) => (
          <li key={product.presentationKey} className={rowVisibilityClassName(index, expanded)}>
            <CommercialProductRow medication={product} />
          </li>
        ))}
      </ul>

      {showMoreButton && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(true)}
          className={`mt-2 text-sm font-medium text-accent-ink hover:underline ${moreButtonClassName}`}
        >
          <span className="sm:hidden">
            Ver {remaining.mobile} opci{remaining.mobile === 1 ? "ón" : "ones"} más ↓
          </span>
          {hasMoreThanDesktopDefault && (
            <span className="hidden sm:inline">
              Ver {remaining.desktop} opci{remaining.desktop === 1 ? "ón" : "ones"} más ↓
            </span>
          )}
        </button>
      )}

      {expanded && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(false)}
          className="mt-2 text-sm font-medium text-accent-ink hover:underline"
        >
          Ver menos ↑
        </button>
      )}
    </section>
  );
}
