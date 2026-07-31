/**
 * Lista personal de "mi receta" — versión simple sin cuenta de usuario ni
 * link para compartir (Sprint E, ver docs/prompt/claude/PROMPT_CLAUDE_SPRINT_E_RECETA_COMPLETA.md).
 * Vive solo en localStorage del navegador (ver useRecipeList.ts). Este
 * archivo contiene únicamente lógica pura sobre arrays, sin React ni
 * localStorage, para que sea trivial de testear.
 */

export const MAX_RECIPE_ITEMS = 8;

export interface RecipeItem {
  matchKey: string;
  canonicalName: string;
  imageUrl: string | null;
}

export type AddRecipeItemResult = "added" | "duplicate" | "full";

export function addRecipeItem(
  items: RecipeItem[],
  newItem: RecipeItem
): { items: RecipeItem[]; result: AddRecipeItemResult } {
  if (items.some((item) => item.matchKey === newItem.matchKey)) {
    return { items, result: "duplicate" };
  }
  if (items.length >= MAX_RECIPE_ITEMS) {
    return { items, result: "full" };
  }
  return { items: [...items, newItem], result: "added" };
}

export function removeRecipeItem(items: RecipeItem[], matchKey: string): RecipeItem[] {
  return items.filter((item) => item.matchKey !== matchKey);
}
