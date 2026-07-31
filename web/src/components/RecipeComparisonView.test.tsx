import { describe, it, expect, vi, afterEach } from "vitest";
import type { ReactNode } from "react";
import type { MedicationResult, PharmacyPrice } from "@comparafarma/domain";
import { render, screen, waitFor } from "@/test-utils";
import { RecipeComparisonView } from "./RecipeComparisonView";
import { getRecipePrices } from "@/lib/actions/getRecipePrices";
import { __resetRecipeListCacheForTests } from "@/lib/useRecipeList";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/actions/getRecipePrices", () => ({
  getRecipePrices: vi.fn(),
}));

function price(pharmacySlug: PharmacyPrice["pharmacySlug"], pharmacyName: string, effective: number): PharmacyPrice {
  return {
    pharmacySlug,
    pharmacyName,
    productName: "producto de prueba",
    channels: { store: effective, online: null, cmr: null, sbpay: null, effective },
    hasStock: true,
    hasOnlineDelivery: false,
    onlineUrl: null,
    imageUrl: null,
    fetchedAt: "2026-07-31T00:00:00.000Z",
  };
}

function medication(matchKey: string, canonicalName: string, prices: PharmacyPrice[]): MedicationResult {
  return {
    matchKey,
    canonicalName,
    laboratory: null,
    isBioequivalent: false,
    prices,
    bestPrice: prices[0]?.channels.effective ?? 0,
    bestPharmacy: prices[0]?.pharmacySlug ?? "",
    imageUrl: null,
  };
}

afterEach(() => {
  window.localStorage.clear();
  __resetRecipeListCacheForTests();
  vi.mocked(getRecipePrices).mockReset();
});

describe("RecipeComparisonView", () => {
  it("shows an empty state when the recipe list has no items", () => {
    render(<RecipeComparisonView />);
    expect(screen.getByText("Todavía no agregaste medicamentos a tu receta.")).toBeTruthy();
  });

  it("fetches fresh prices and shows both comparison alternatives", async () => {
    window.localStorage.setItem(
      "recipe-list-v1",
      JSON.stringify([
        { matchKey: "a", canonicalName: "Paracetamol", imageUrl: null },
        { matchKey: "b", canonicalName: "Ibuprofeno", imageUrl: null },
      ])
    );
    vi.mocked(getRecipePrices).mockResolvedValue([
      medication("a", "Paracetamol", [price("cruz-verde", "Cruz Verde", 1000), price("salcobrand", "Salcobrand", 700)]),
      medication("b", "Ibuprofeno", [price("cruz-verde", "Cruz Verde", 200), price("salcobrand", "Salcobrand", 300)]),
    ]);

    render(<RecipeComparisonView />);

    await waitFor(() => expect(screen.getByText("Repartido al mejor precio")).toBeTruthy());

    // Todo en una farmacia: cruz-verde 1200, salcobrand 1000 (gana salcobrand).
    // Repartido: 700 (salcobrand, item a) + 200 (cruz-verde, item b) = 900.
    // Ahorro repartiendo = 1000 (mejor "todo en una") - 900 (repartido) = 100.
    expect(screen.getByText(/Total: \$900/)).toBeTruthy();
    expect(screen.getByText(/Ahorras \$100/)).toBeTruthy();
  });

  it("warns about medications that no longer have a price without breaking the rest", async () => {
    window.localStorage.setItem(
      "recipe-list-v1",
      JSON.stringify([{ matchKey: "gone", canonicalName: "Descontinuado", imageUrl: null }])
    );
    vi.mocked(getRecipePrices).mockResolvedValue([null]);

    render(<RecipeComparisonView />);

    await waitFor(() =>
      expect(screen.getByText(/No encontramos precios vigentes para: Descontinuado/)).toBeTruthy()
    );
  });
});
