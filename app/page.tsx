"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import PriceResults from "@/components/PriceResults";

interface Medication {
  id: number;
  name: string;
  active_ingredient: string;
  concentration: string;
  form: string;
  laboratory: string;
  is_bioequivalent: boolean;
  prices: never[];
}

export default function Home() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLive, setLoadingLive] = useState(false);
  const [searched, setSearched] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");

  const handleSearch = async (query: string) => {
    setLoading(true);
    setLoadingLive(false);
    setCurrentQuery(query);
    try {
      const res = await fetch(`/api/medications/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.source === "live") setLoadingLive(true);
      setMedications(data.medications || []);
      setSearched(true);
    } catch {
      setMedications([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">
          Compara precios de remedios
        </h1>
        <p className="text-gray-500 text-base">
          Encuentra el mejor precio en Cruz Verde, Salcobrand, Ahumada y Dr. Simi
        </p>
      </div>

      <SearchBar onSearch={handleSearch} loading={loading} />

      {!searched && !loading && (
        <div className="text-center py-12 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {["Paracetamol", "Ibuprofeno", "Amoxicilina", "Metformina"].map((med) => (
              <button
                key={med}
                onClick={() => handleSearch(med)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-pharmacy-green hover:text-pharmacy-green transition-colors shadow-sm"
              >
                {med}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">Búsquedas frecuentes</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-400">
          <div className="inline-block w-6 h-6 border-2 border-pharmacy-green border-t-transparent rounded-full animate-spin mb-3"></div>
          <p>Buscando precios...</p>
        </div>
      )}

      {loadingLive && !loading && (
        <div className="flex items-center gap-2 text-xs text-pharmacy-green bg-pharmacy-green-light px-3 py-2 rounded-lg w-fit">
          <span className="inline-block w-3 h-3 border-2 border-pharmacy-green border-t-transparent rounded-full animate-spin"></span>
          Precios obtenidos directamente desde las farmacias
        </div>
      )}

      {searched && !loading && (
        <PriceResults medications={medications} query={currentQuery} />
      )}
    </div>
  );
}
