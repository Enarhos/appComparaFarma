"use client";

import { useState, useRef } from "react";

interface Props {
  onSearch: (query: string) => void;
  loading: boolean;
}

export default function SearchBar({ onSearch, loading }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: paracetamol, ibuprofeno, amoxicilina..."
          className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pharmacy-green focus:border-transparent shadow-sm"
          disabled={loading}
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || query.trim().length < 2}
          className="px-6 py-3 bg-pharmacy-green text-white font-semibold rounded-xl hover:bg-pharmacy-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>
    </form>
  );
}
