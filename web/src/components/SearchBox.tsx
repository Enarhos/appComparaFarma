"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Props {
  initialQuery?: string;
}

export function SearchBox({ initialQuery = "" }: Props) {
  const [value, setValue] = useState(initialQuery);
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length < 2) return;
    router.push(`/buscar/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar medicamento… (ej. Paracetamol)"
        aria-label="Buscar medicamento"
        className="min-w-0 flex-1 rounded-xl border border-line bg-paper-raised px-4 py-3 text-base text-ink shadow-sm outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      <button
        type="submit"
        className="w-full rounded-xl bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-ink sm:w-auto"
      >
        Buscar
      </button>
    </form>
  );
}
