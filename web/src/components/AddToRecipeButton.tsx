"use client";

import { useState } from "react";
import { useRecipeList } from "@/lib/useRecipeList";
import { MAX_RECIPE_ITEMS } from "@/lib/recipeList";

interface Props {
  matchKey: string;
  canonicalName: string;
  imageUrl: string | null;
}

export function AddToRecipeButton({ matchKey, canonicalName, imageUrl }: Props) {
  const { add, remove, isInList } = useRecipeList();
  const [fullNotice, setFullNotice] = useState(false);

  const inList = isInList(matchKey);

  function handleClick() {
    if (inList) {
      remove(matchKey);
      setFullNotice(false);
      return;
    }
    const result = add({ matchKey, canonicalName, imageUrl });
    setFullNotice(result === "full");
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        className={
          inList
            ? "rounded-md bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-ink"
            : "rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink/70 hover:bg-paper"
        }
      >
        {inList ? "✓ En tu receta" : "Agregar a mi receta"}
      </button>
      {fullNotice && (
        <span className="text-xs text-red-600">
          Ya tienes {MAX_RECIPE_ITEMS} medicamentos, el máximo por receta
        </span>
      )}
    </div>
  );
}
