import { describe, it, expect, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test-utils";
import { AddToRecipeButton } from "./AddToRecipeButton";
import { MAX_RECIPE_ITEMS } from "@/lib/recipeList";
import { __resetRecipeListCacheForTests } from "@/lib/useRecipeList";

afterEach(() => {
  window.localStorage.clear();
  __resetRecipeListCacheForTests();
});

describe("AddToRecipeButton", () => {
  it("shows the add label when the medication is not in the list", () => {
    render(<AddToRecipeButton matchKey="a" canonicalName="Paracetamol" imageUrl={null} />);
    expect(screen.getByRole("button", { name: "Agregar a mi receta" })).toBeTruthy();
  });

  it("toggles to the in-list label after adding, and persists it in localStorage", async () => {
    const user = userEvent.setup();
    render(<AddToRecipeButton matchKey="a" canonicalName="Paracetamol" imageUrl={null} />);

    await user.click(screen.getByRole("button", { name: "Agregar a mi receta" }));

    expect(screen.getByRole("button", { name: "✓ En tu receta" })).toBeTruthy();
    const stored = JSON.parse(window.localStorage.getItem("recipe-list-v1") ?? "[]");
    expect(stored).toEqual([{ matchKey: "a", canonicalName: "Paracetamol", imageUrl: null }]);
  });

  it("removes the item when clicked again", async () => {
    const user = userEvent.setup();
    render(<AddToRecipeButton matchKey="a" canonicalName="Paracetamol" imageUrl={null} />);

    await user.click(screen.getByRole("button", { name: "Agregar a mi receta" }));
    await user.click(screen.getByRole("button", { name: "✓ En tu receta" }));

    expect(screen.getByRole("button", { name: "Agregar a mi receta" })).toBeTruthy();
    const stored = JSON.parse(window.localStorage.getItem("recipe-list-v1") ?? "[]");
    expect(stored).toEqual([]);
  });

  it(`shows a notice instead of adding once the list already has ${MAX_RECIPE_ITEMS} items`, async () => {
    const existing = Array.from({ length: MAX_RECIPE_ITEMS }, (_, i) => ({
      matchKey: `existing-${i}`,
      canonicalName: `Medicamento ${i}`,
      imageUrl: null,
    }));
    window.localStorage.setItem("recipe-list-v1", JSON.stringify(existing));

    const user = userEvent.setup();
    render(<AddToRecipeButton matchKey="overflow" canonicalName="Nuevo" imageUrl={null} />);

    await user.click(screen.getByRole("button", { name: "Agregar a mi receta" }));

    expect(screen.getByText(`Ya tienes ${MAX_RECIPE_ITEMS} medicamentos, el máximo por receta`)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Agregar a mi receta" })).toBeTruthy(); // no cambió a "en tu receta"
  });
});
