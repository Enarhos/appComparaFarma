"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MedicationResult } from "@comparafarma/domain";
import { useRecipeList } from "@/lib/useRecipeList";
import { getRecipePrices } from "@/lib/actions/getRecipePrices";
import { computeAllInOneTotals, computeSplitTotal, compareOptions } from "@/lib/recipeComparison";
import { formatCLP } from "@/lib/format";

interface ResolvedRecipe {
  signature: string;
  medications: MedicationResult[];
  missingNames: string[];
}

export function RecipeComparisonView() {
  const { items, remove, clear } = useRecipeList();
  const [resolved, setResolved] = useState<ResolvedRecipe | null>(null);

  // Clave estable derivada de los matchKey presentes — evita relanzar el
  // fetch cuando cambia la referencia del array pero no su contenido real, y
  // permite derivar `loading` sin un setState propio (ver comentario abajo).
  const matchKeysSignature = items.map((i) => i.matchKey).join(",");
  const loading = items.length > 0 && resolved?.signature !== matchKeysSignature;
  const medications = resolved?.signature === matchKeysSignature ? resolved.medications : null;
  const missingNames = resolved?.signature === matchKeysSignature ? resolved.missingNames : [];

  useEffect(() => {
    // Lista vacía: el componente devuelve el estado vacío más abajo sin
    // llegar a leer `medications`/`missingNames`, así que no hace falta
    // disparar ningún fetch acá.
    if (items.length === 0) return;
    let cancelled = false;
    // Un solo setState, dentro del callback de la promesa (no sincrónico en
    // el cuerpo del efecto) — `loading` arriba se deriva comparando
    // `resolved.signature` contra `matchKeysSignature` en vez de necesitar
    // un setLoading(true) separado al empezar el fetch.
    getRecipePrices(items.map(({ matchKey, canonicalName }) => ({ matchKey, canonicalName }))).then((results) => {
      if (cancelled) return;
      const found: MedicationResult[] = [];
      const missing: string[] = [];
      results.forEach((result, index) => {
        if (result) {
          found.push(result);
        } else {
          missing.push(items[index].canonicalName);
        }
      });
      setResolved({ signature: matchKeysSignature, medications: found, missingNames: missing });
    });
    return () => {
      cancelled = true;
    };
    // items.length ya está cubierto por matchKeysSignature; se ignora `items`
    // como dependencia directa a propósito (ver comentario arriba).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchKeysSignature]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-paper-raised p-8 text-center">
        <p className="text-sm text-muted">Todavía no agregaste medicamentos a tu receta.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-accent-ink hover:underline">
          Buscar más medicamentos →
        </Link>
      </div>
    );
  }

  const allInOne = medications ? computeAllInOneTotals(medications) : [];
  const { breakdown, total: splitTotal } = medications
    ? computeSplitTotal(medications)
    : { breakdown: [], total: 0 };
  const { savings } = compareOptions(allInOne, splitTotal);
  const bestAllInOne = allInOne.find((t) => t.missing === 0) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">Medicamentos ({items.length})</h2>
          <Link href="/" className="text-sm font-medium text-accent-ink hover:underline">
            Buscar más medicamentos →
          </Link>
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.matchKey}
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper-raised px-4 py-2.5"
            >
              <span className="text-sm font-medium text-ink">{item.canonicalName}</span>
              <button
                type="button"
                onClick={() => remove(item.matchKey)}
                className="text-xs font-medium text-muted hover:text-red-600"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={clear} className="mt-2 text-xs font-medium text-muted hover:text-red-600">
          Vaciar receta
        </button>
      </section>

      {loading && <p className="text-sm text-muted">Buscando precios actuales…</p>}

      {!loading && missingNames.length > 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          No encontramos precios vigentes para: {missingNames.join(", ")}. Puede que el producto ya no esté
          disponible en ninguna farmacia — la comparación de abajo no los incluye.
        </p>
      )}

      {!loading && medications && medications.length > 0 && (
        <>
          <section className="rounded-2xl border border-line bg-paper-raised p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Todo en una farmacia</h2>
            {allInOne.length === 0 && (
              <p className="mt-2 text-sm text-muted">No encontramos ninguna farmacia con estos medicamentos.</p>
            )}
            <ul className="mt-3 flex flex-col gap-2">
              {allInOne.map((t, index) => (
                <li
                  key={t.pharmacySlug}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 ${
                    index === 0 && t.missing === 0
                      ? "border-accent-ink bg-accent-soft/40"
                      : "border-line bg-paper"
                  }`}
                >
                  <div>
                    <span className="text-sm font-semibold text-ink">{t.pharmacyName}</span>
                    {t.missing > 0 && (
                      <span className="ml-2 text-xs text-amber-600">
                        Solo tiene {t.found} de {medications.length}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-ink">{formatCLP(t.total)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-line bg-paper-raised p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Repartido al mejor precio</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {breakdown.map((item) => (
                <li
                  key={item.matchKey}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-4 py-2.5"
                >
                  <div>
                    <span className="text-sm font-medium text-ink">{item.canonicalName}</span>
                    <span className="ml-2 text-xs text-muted">en {item.pharmacyName}</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-ink">{formatCLP(item.price)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-right text-sm font-semibold text-ink">Total: {formatCLP(splitTotal)}</p>
          </section>

          <section className="rounded-2xl border border-line bg-paper-raised p-5">
            {savings == null && (
              <p className="text-sm text-muted">
                Ninguna farmacia tiene todos los medicamentos — no hay una alternativa de &ldquo;todo en un
                lugar&rdquo; para comparar todavía.
              </p>
            )}
            {savings != null && savings > 0 && bestAllInOne && (
              <p className="text-sm font-semibold text-save">
                Ahorras {formatCLP(savings)} repartiendo la compra en vez de comprar todo en{" "}
                {bestAllInOne.pharmacyName}.
              </p>
            )}
            {savings != null && savings <= 0 && bestAllInOne && (
              <p className="text-sm font-semibold text-ink">
                Comprar todo en {bestAllInOne.pharmacyName} ya es igual o más conveniente que repartir la compra.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
