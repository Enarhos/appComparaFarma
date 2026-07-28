import { PHARMACIES } from "@/constants/pharmacies";
import { formatCLP, formatDateShort } from "@/lib/format";
import type { PriceHistorySeries } from "@/lib/priceHistory";

interface Props {
  series: PriceHistorySeries[];
}

const WIDTH = 640;
const HEIGHT = 280;
const PAD_LEFT = 60;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 32;
const CHART_WIDTH = WIDTH - PAD_LEFT - PAD_RIGHT;
const CHART_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM;

function displayFor(pharmacySlug: string) {
  return PHARMACIES[pharmacySlug as keyof typeof PHARMACIES];
}

function sortByDate<T extends { date: string }>(points: T[]): T[] {
  return [...points].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * SVG accesible y responsive de evolución de precio efectivo por farmacia.
 * Sin dependencias nuevas. Funciona con 0, 1 o varias series, y con series de
 * un solo punto (se dibuja como círculo, no como línea). Incluye una tabla
 * textual equivalente (colapsada por defecto) para lectores de pantalla y
 * cualquier persona que prefiera los datos crudos.
 */
export function PriceHistoryChart({ series }: Props) {
  const withPoints = series.filter((s) => s.points.length > 0).map((s) => ({ ...s, points: sortByDate(s.points) }));

  if (withPoints.length === 0) {
    return null;
  }

  const allDates = Array.from(new Set(withPoints.flatMap((s) => s.points.map((p) => p.date)))).sort();

  const allPrices = withPoints.flatMap((s) => s.points.map((p) => p.effectivePrice));
  let minPrice = Math.min(...allPrices);
  let maxPrice = Math.max(...allPrices);
  if (minPrice === maxPrice) {
    const pad = minPrice === 0 ? 1 : minPrice * 0.1;
    minPrice -= pad;
    maxPrice += pad;
  }

  function xFor(date: string): number {
    if (allDates.length === 1) return PAD_LEFT + CHART_WIDTH / 2;
    const idx = allDates.indexOf(date);
    return PAD_LEFT + (idx / (allDates.length - 1)) * CHART_WIDTH;
  }

  function yFor(price: number): number {
    return PAD_TOP + CHART_HEIGHT - ((price - minPrice) / (maxPrice - minPrice)) * CHART_HEIGHT;
  }

  const dateLabelIdxs =
    allDates.length <= 1
      ? [0]
      : Array.from(new Set([0, Math.floor((allDates.length - 1) / 2), allDates.length - 1]));

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Evolución del precio efectivo por farmacia entre ${formatDateShort(allDates[0])} y ${formatDateShort(allDates[allDates.length - 1])}`}
        className="w-full"
      >
        <text x={PAD_LEFT - 8} y={PAD_TOP + 4} textAnchor="end" fontSize="11" fill="#6b7280">
          {formatCLP(Math.round(maxPrice))}
        </text>
        <text x={PAD_LEFT - 8} y={PAD_TOP + CHART_HEIGHT} textAnchor="end" fontSize="11" fill="#6b7280">
          {formatCLP(Math.round(minPrice))}
        </text>

        <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={PAD_TOP + CHART_HEIGHT} stroke="#e5e7eb" strokeWidth="1" />
        <line
          x1={PAD_LEFT}
          y1={PAD_TOP + CHART_HEIGHT}
          x2={PAD_LEFT + CHART_WIDTH}
          y2={PAD_TOP + CHART_HEIGHT}
          stroke="#e5e7eb"
          strokeWidth="1"
        />

        {dateLabelIdxs.map((idx) => (
          <text key={allDates[idx]} x={xFor(allDates[idx])} y={HEIGHT - 8} textAnchor="middle" fontSize="11" fill="#6b7280">
            {formatDateShort(allDates[idx])}
          </text>
        ))}

        {withPoints.map((s) => {
          const display = displayFor(s.pharmacySlug);
          const color = display?.color ?? "#9ca3af";

          if (s.points.length === 1) {
            const p = s.points[0];
            return <circle key={s.pharmacySlug} cx={xFor(p.date)} cy={yFor(p.effectivePrice)} r="4" fill={color} />;
          }

          return (
            <g key={s.pharmacySlug}>
              <polyline
                points={s.points.map((p) => `${xFor(p.date)},${yFor(p.effectivePrice)}`).join(" ")}
                fill="none"
                stroke={color}
                strokeWidth="2"
              />
              {s.points.map((p) => (
                <circle key={p.date} cx={xFor(p.date)} cy={yFor(p.effectivePrice)} r="2.5" fill={color} />
              ))}
            </g>
          );
        })}
      </svg>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {withPoints.map((s) => {
          const display = displayFor(s.pharmacySlug);
          return (
            <li key={s.pharmacySlug} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: display?.color ?? "#9ca3af" }}
                aria-hidden
              />
              {display?.name ?? s.pharmacySlug}
            </li>
          );
        })}
      </ul>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-medium text-accent-ink">Ver datos en formato de tabla</summary>
        <table className="mt-2 w-full text-left text-sm">
          <caption className="sr-only">Historial de precio efectivo por farmacia y fecha</caption>
          <thead>
            <tr className="text-muted">
              <th scope="col" className="py-1 pr-3">
                Farmacia
              </th>
              <th scope="col" className="py-1 pr-3">
                Fecha
              </th>
              <th scope="col" className="py-1">
                Precio efectivo
              </th>
            </tr>
          </thead>
          <tbody>
            {withPoints.flatMap((s) => {
              const display = displayFor(s.pharmacySlug);
              return s.points.map((p) => (
                <tr key={`${s.pharmacySlug}-${p.date}`} className="border-t border-line">
                  <td className="py-1 pr-3">{display?.name ?? s.pharmacySlug}</td>
                  <td className="py-1 pr-3 tabular-nums">{formatDateShort(p.date)}</td>
                  <td className="py-1 tabular-nums">{formatCLP(p.effectivePrice)}</td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </details>
    </div>
  );
}
