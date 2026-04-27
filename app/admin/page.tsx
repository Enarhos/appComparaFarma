"use client";

import { useState, useRef, useEffect } from "react";

interface LogEntry {
  type: string;
  medication?: string;
  done?: number;
  total?: number;
  error?: string;
}

export default function AdminPage() {
  const [running, setRunning] = useState(false);
  const [query, setQuery] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [dbTotal, setDbTotal] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/admin/scrape/count")
      .then((r) => r.json())
      .then((d) => setDbTotal(d.total))
      .catch(() => {});
  }, []);

  const runScrape = async (specificQuery?: string, mode?: string) => {
    if (running) return;
    setRunning(true);
    setLog([]);
    setProgress({ done: 0, total: 0 });

    abortRef.current = new AbortController();
    const url = specificQuery
      ? `/api/admin/scrape?q=${encodeURIComponent(specificQuery)}`
      : mode === "all"
      ? `/api/admin/scrape?mode=all`
      : `/api/admin/scrape`;

    try {
      const res = await fetch(url, { signal: abortRef.current.signal });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const entry: LogEntry = JSON.parse(line.slice(6));
            setLog((prev) => [...prev, entry]);
            if (entry.done !== undefined && entry.total !== undefined) {
              setProgress({ done: entry.done, total: entry.total });
            }
          } catch {}
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        setLog((prev) => [...prev, { type: "error", error: String(e) }]);
      }
    } finally {
      setRunning(false);
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setRunning(false);
  };

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administración</h1>
        <p className="text-sm text-gray-500 mt-1">Actualiza precios manualmente desde las farmacias.</p>
      </div>

      {/* Actualizar todos */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-800">Actualizar todos los medicamentos</h2>
          <p className="text-sm text-gray-500">Corre el scraping de los 29 medicamentos comunes en Cruz Verde, Salcobrand y Ahumada.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => runScrape()}
            disabled={running}
            className="px-5 py-2 bg-pharmacy-green text-white font-semibold rounded-xl hover:bg-pharmacy-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running && !query ? "Corriendo..." : "Actualizar todos"}
          </button>
          {running && (
            <button onClick={stop} className="px-5 py-2 bg-red-100 text-red-700 font-semibold rounded-xl hover:bg-red-200 transition-colors">
              Detener
            </button>
          )}
        </div>
      </div>

      {/* Actualizar toda la base */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-800">Actualizar toda la base de datos</h2>
          <p className="text-sm text-gray-500">
            Corre el scraping de los {dbTotal !== null ? <strong>{dbTotal.toLocaleString("es-CL")}</strong> : "..."} medicamentos registrados.
            {dbTotal !== null && (
              <span className="ml-1 text-gray-400">
                (aprox. {Math.ceil((dbTotal * 1.3) / 60)} min)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => runScrape(undefined, "all")}
            disabled={running}
            className="px-5 py-2 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? "Corriendo..." : "Actualizar toda la BD"}
          </button>
          {running && (
            <button onClick={stop} className="px-5 py-2 bg-red-100 text-red-700 font-semibold rounded-xl hover:bg-red-200 transition-colors">
              Detener
            </button>
          )}
        </div>
      </div>

      {/* Medicamento específico */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-800">Actualizar medicamento específico</h2>
          <p className="text-sm text-gray-500">Busca y actualiza precios de un medicamento en particular.</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && query && runScrape(query)}
            placeholder="Ej: zival, fesema, muno forte..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pharmacy-green"
            disabled={running}
          />
          <button
            onClick={() => query && runScrape(query)}
            disabled={running || !query}
            className="px-5 py-2 bg-pharmacy-green text-white font-semibold rounded-xl hover:bg-pharmacy-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Progreso y log */}
      {log.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
          {progress.total > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{progress.done} de {progress.total} completados</span>
                <span>{pct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-pharmacy-green h-2 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto space-y-1 font-mono text-xs">
            {log.map((entry, i) => (
              <div key={i} className={`flex gap-2 ${entry.type === "error" ? "text-red-600" : entry.type === "done" ? "text-pharmacy-green font-bold" : "text-gray-600"}`}>
                {entry.type === "ok" && <span className="text-green-500">✓</span>}
                {entry.type === "error" && <span>✗</span>}
                {entry.type === "progress" && <span className="text-gray-400">→</span>}
                {entry.type === "start" && <span>▶</span>}
                {entry.type === "done" && <span>✓</span>}
                <span>
                  {entry.type === "start" && `Iniciando scraping de ${entry.total} medicamento(s)...`}
                  {entry.type === "progress" && `Buscando: ${entry.medication}`}
                  {entry.type === "ok" && `${entry.medication}`}
                  {entry.type === "error" && `Error en ${entry.medication}: ${entry.error}`}
                  {entry.type === "done" && `Completado: ${entry.done}/${entry.total} medicamentos actualizados`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
