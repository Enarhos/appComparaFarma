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
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar medicamento… (ej. Paracetamol)"
        aria-label="Buscar medicamento"
        className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 shadow-sm outline-none placeholder:text-neutral-400 focus:border-best focus:ring-2 focus:ring-best/20"
      />
      <button
        type="submit"
        className="rounded-xl bg-best px-6 py-3 text-base font-semibold text-white transition hover:bg-best/90"
      >
        Buscar
      </button>
    </form>
  );
}
