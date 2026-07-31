"use client";

import Link from "next/link";
import { useRecipeList } from "@/lib/useRecipeList";

export function RecipeLinkBadge() {
  const { items } = useRecipeList();

  return (
    <Link
      href="/mi-receta"
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-raised px-3 py-1.5 text-sm font-medium text-ink/80 hover:bg-paper"
    >
      Mi receta
      {items.length > 0 && (
        <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-xs font-semibold text-accent-ink">
          {items.length}
        </span>
      )}
    </Link>
  );
}
