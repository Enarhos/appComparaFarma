import { describe, it, expect } from "vitest";
import { addRecipeItem, removeRecipeItem, MAX_RECIPE_ITEMS, type RecipeItem } from "./recipeList";

function item(matchKey: string): RecipeItem {
  return { matchKey, canonicalName: `Medicamento ${matchKey}`, imageUrl: null };
}

describe("addRecipeItem", () => {
  it("adds a new item to an empty list", () => {
    const { items, result } = addRecipeItem([], item("a"));
    expect(result).toBe("added");
    expect(items).toEqual([item("a")]);
  });

  it("does not duplicate an item with the same matchKey", () => {
    const existing = [item("a")];
    const { items, result } = addRecipeItem(existing, item("a"));
    expect(result).toBe("duplicate");
    expect(items).toBe(existing); // no muta ni reemplaza el array
    expect(items).toHaveLength(1);
  });

  it(`allows up to ${MAX_RECIPE_ITEMS} items`, () => {
    let items: RecipeItem[] = [];
    for (let i = 0; i < MAX_RECIPE_ITEMS; i++) {
      const outcome = addRecipeItem(items, item(`m${i}`));
      expect(outcome.result).toBe("added");
      items = outcome.items;
    }
    expect(items).toHaveLength(MAX_RECIPE_ITEMS);
  });

  it(`blocks adding a ${MAX_RECIPE_ITEMS + 1}th item instead of truncating silently`, () => {
    let items: RecipeItem[] = [];
    for (let i = 0; i < MAX_RECIPE_ITEMS; i++) {
      items = addRecipeItem(items, item(`m${i}`)).items;
    }
    const outcome = addRecipeItem(items, item("overflow"));
    expect(outcome.result).toBe("full");
    expect(outcome.items).toBe(items); // sin cambios
    expect(outcome.items).toHaveLength(MAX_RECIPE_ITEMS);
  });
});

describe("removeRecipeItem", () => {
  it("removes the item with the matching matchKey", () => {
    const items = [item("a"), item("b"), item("c")];
    expect(removeRecipeItem(items, "b")).toEqual([item("a"), item("c")]);
  });

  it("returns the same list (by value) if the matchKey is not present", () => {
    const items = [item("a")];
    expect(removeRecipeItem(items, "nope")).toEqual(items);
  });
});
