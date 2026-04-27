"use client";

const PHARMACY_COLORS: Record<string, { bg: string; text: string }> = {
  "cruz-verde": { bg: "bg-green-100", text: "text-green-800" },
  salcobrand:   { bg: "bg-blue-100",  text: "text-blue-800"  },
  ahumada:      { bg: "bg-red-100",   text: "text-red-800"   },
  "dr-simi":    { bg: "bg-yellow-100",text: "text-yellow-800"},
};

const PHARMACY_PRICES: Record<string, { online: boolean; cmr: boolean }> = {
  "cruz-verde": { online: false, cmr: false },
  salcobrand:   { online: true,  cmr: false },
  ahumada:      { online: false, cmr: true  },
  "dr-simi":    { online: true,  cmr: false },
};

interface Price {
  pharmacy_id: number;
  pharmacy_name: string;
  pharmacy_slug: string;
  price: number;
  online_price: number | null;
  cmr_price: number | null;
  has_stock: boolean;
  has_online_delivery: boolean;
  online_url: string | null;
  scraped_at: string;
}

interface Medication {
  id: number;
  name: string;
  active_ingredient: string;
  concentration: string;
  form: string;
  laboratory: string;
  is_bioequivalent: boolean;
  prices: Price[];
}

interface Props {
  medications: Medication[];
  query: string;
}

function fmt(price: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(price);
}

function effectivePrice(p: Price) {
  return Math.min(p.price, p.online_price ?? p.price, p.cmr_price ?? p.price);
}

function scrapedAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const date = new Date(dateStr);
  const time = date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  if (h < 1) return "hace menos de 1h";
  if (date.toDateString() === new Date().toDateString()) return `hoy ${time}`;
  return date.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" }) + " " + time;
}

function PriceCell({
  label, price, best, note,
}: {
  label: string;
  price: number | null;
  best: boolean;
  note?: string;
}) {
  if (!price) {
    return (
      <div className="flex flex-col items-center gap-0.5 min-w-[80px]">
        <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</span>
        <span className="text-sm text-gray-300">—</span>
        {note && <span className="text-[10px] text-gray-400">{note}</span>}
      </div>
    );
  }
  return (
    <div className={`flex flex-col items-center gap-0.5 min-w-[80px] rounded-xl px-3 py-2 ${best ? "bg-pharmacy-green-light" : ""}`}>
      <span className={`text-[11px] font-medium uppercase tracking-wide ${best ? "text-pharmacy-green-dark" : "text-gray-400"}`}>
        {label}
      </span>
      <span className={`text-lg font-bold ${best ? "text-pharmacy-green" : "text-gray-700"}`}>
        {fmt(price)}
      </span>
      {note && <span className={`text-[10px] ${best ? "text-pharmacy-green-dark" : "text-gray-400"}`}>{note}</span>}
    </div>
  );
}

export default function PriceResults({ medications, query }: Props) {
  if (medications.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg font-medium">No se encontraron resultados para &quot;{query}&quot;</p>
        <p className="text-sm mt-2">Intenta con el nombre del principio activo o la marca comercial.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">{medications.length} resultado(s) para &quot;{query}&quot;</p>

      {medications.map((med) => {
        const sorted = [...(med.prices || [])].sort((a, b) => effectivePrice(a) - effectivePrice(b));
        const globalBest = sorted[0] ? effectivePrice(sorted[0]) : null;

        return (
          <div key={med.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Cabecera del medicamento */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">{med.name}</h2>
                  <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
                    {med.active_ingredient && (
                      <span className="text-xs text-gray-500">
                        p.a. <strong>{med.active_ingredient}</strong>
                      </span>
                    )}
                    {med.concentration && <span className="text-xs text-gray-400">{med.concentration}</span>}
                    {med.form        && <span className="text-xs text-gray-400">{med.form}</span>}
                    {med.laboratory  && <span className="text-xs text-gray-400">{med.laboratory}</span>}
                  </div>
                </div>
                {med.is_bioequivalent && (
                  <span className="shrink-0 text-xs font-semibold bg-pharmacy-green-light text-pharmacy-green-dark px-2 py-1 rounded-full">
                    Bioequivalente
                  </span>
                )}
              </div>
            </div>

            {sorted.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                Sin precios disponibles aún.
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-50">
                  {sorted.map((p, idx) => {
                    const colors = PHARMACY_COLORS[p.pharmacy_slug] ?? { bg: "bg-gray-100", text: "text-gray-700" };
                    const caps = PHARMACY_PRICES[p.pharmacy_slug] ?? { online: true, cmr: true };
                    const isGlobalBest = effectivePrice(p) === globalBest;
                    const bestType = caps.cmr && p.cmr_price
                      ? "cmr"
                      : caps.online && p.online_price && p.online_price < p.price
                      ? "online"
                      : "presencial";
                    const cols = 1 + (caps.online ? 1 : 0) + (caps.cmr ? 1 : 0);

                    return (
                      <div key={p.pharmacy_id} className={`px-5 py-4 ${isGlobalBest && idx === 0 ? "" : ""}`}>

                        {/* Fila farmacia + badges */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isGlobalBest && (
                              <span className="text-[11px] font-bold text-pharmacy-green border border-pharmacy-green px-1.5 py-0.5 rounded-full">
                                Mejor precio
                              </span>
                            )}
                            <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                              {p.pharmacy_name}
                            </span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full ${p.has_stock ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                              {p.has_stock ? "Con stock" : "Sin stock"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-400">{scrapedAgo(p.scraped_at)}</span>
                            {p.online_url && (
                              <a href={p.online_url} target="_blank" rel="noopener noreferrer"
                                className="text-[11px] text-pharmacy-green hover:underline">
                                Ver →
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Celdas de precios */}
                        <div className={`flex gap-2 flex-wrap sm:grid sm:grid-cols-${cols}`}>
                          <PriceCell
                            label="Presencial"
                            price={p.price}
                            best={bestType === "presencial"}
                          />
                          {caps.online && (
                            <PriceCell
                              label="Online"
                              price={p.online_price}
                              best={bestType === "online"}
                              note={!p.has_online_delivery ? "sin despacho" : undefined}
                            />
                          )}
                          {caps.cmr && (
                            <PriceCell
                              label="CMR"
                              price={p.cmr_price}
                              best={bestType === "cmr"}
                            />
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Footer resumen */}
                {sorted.length > 1 && globalBest !== null && (
                  <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex gap-3">
                    <span>
                      Mejor: <strong className="text-gray-800">{fmt(globalBest)}</strong> en {sorted[0].pharmacy_name}
                    </span>
                    <span>
                      Diferencia: <strong className="text-gray-800">
                        {fmt(effectivePrice(sorted[sorted.length - 1]) - globalBest)}
                      </strong> vs el más caro
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
