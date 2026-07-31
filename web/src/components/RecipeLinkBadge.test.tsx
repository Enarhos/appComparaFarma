import { describe, it, expect, afterEach } from "vitest";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { render, screen } from "@/test-utils";
import { RecipeLinkBadge } from "./RecipeLinkBadge";
import { __resetRecipeListCacheForTests } from "@/lib/useRecipeList";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  window.localStorage.clear();
  __resetRecipeListCacheForTests();
});

describe("RecipeLinkBadge", () => {
  it("links to /mi-receta without a count badge when the list is empty", () => {
    render(<RecipeLinkBadge />);
    const link = screen.getByText("Mi receta").closest("a");
    expect(link?.getAttribute("href")).toBe("/mi-receta");
    expect(screen.queryByText("0")).toBeNull();
  });

  it("shows the item count when the list has items", () => {
    window.localStorage.setItem(
      "recipe-list-v1",
      JSON.stringify([
        { matchKey: "a", canonicalName: "Paracetamol", imageUrl: null },
        { matchKey: "b", canonicalName: "Ibuprofeno", imageUrl: null },
      ])
    );
    render(<RecipeLinkBadge />);
    expect(screen.getByText("2")).toBeTruthy();
  });
});
