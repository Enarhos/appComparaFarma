import { describe, it, expect } from "vitest";
import { render, screen } from "@/test-utils";
import type { PharmacyPrice } from "@comparafarma/domain";
import { PharmacyPriceCard } from "./PharmacyPriceCard";

function makePrice(overrides: Partial<PharmacyPrice> = {}): PharmacyPrice {
  return {
    pharmacySlug: "cruz-verde",
    pharmacyName: "Cruz Verde",
    productName: "Paracetamol 500 mg",
    channels: { store: 2990, online: null, cmr: null, sbpay: null, effective: 2990 },
    hasStock: true,
    hasOnlineDelivery: true,
    onlineUrl: "https://cruzverde.cl/producto",
    imageUrl: null,
    fetchedAt: "2026-07-20T00:00:00.000Z",
    ...overrides,
  };
}

describe("PharmacyPriceCard", () => {
  it("shows the pharmacy name and formatted price", () => {
    render(<PharmacyPriceCard price={makePrice()} isBestPrice={false} />);

    expect(screen.getByText("Cruz Verde")).toBeTruthy();
    expect(screen.getByText("$2.990")).toBeTruthy();
  });

  it("shows the 'Mejor precio' badge when isBestPrice is true", () => {
    render(<PharmacyPriceCard price={makePrice()} isBestPrice={true} />);
    expect(screen.getByText("Mejor precio")).toBeTruthy();
  });

  it("does not show the 'Mejor precio' badge when isBestPrice is false", () => {
    render(<PharmacyPriceCard price={makePrice()} isBestPrice={false} />);
    expect(screen.queryByText("Mejor precio")).toBeNull();
  });

  it("shows a 'Sin stock' label when the pharmacy has no stock", () => {
    render(<PharmacyPriceCard price={makePrice({ hasStock: false })} isBestPrice={false} />);
    expect(screen.getByText("Sin stock")).toBeTruthy();
  });

  it("renders a button-style link to the pharmacy when onlineUrl is present", () => {
    render(<PharmacyPriceCard price={makePrice()} isBestPrice={false} />);

    const link = screen.getByText("Ir a la farmacia →").closest("a");
    expect(link?.getAttribute("href")).toBe("https://cruzverde.cl/producto");
    expect(link?.getAttribute("target")).toBe("_blank");
  });

  it("does not render the CTA when there is no onlineUrl", () => {
    render(<PharmacyPriceCard price={makePrice({ onlineUrl: null })} isBestPrice={false} />);
    expect(screen.queryByText("Ir a la farmacia →")).toBeNull();
  });

  it("shows channel chips when there is more than one price channel", () => {
    render(
      <PharmacyPriceCard
        price={makePrice({ channels: { store: 3290, online: null, cmr: 2199, sbpay: null, effective: 2199 } })}
        isBestPrice={false}
      />
    );

    // "$2.199" aparece dos veces a propósito: como precio destacado y en el
    // chip "Tarjeta: $2.199" — ambas apariciones son correctas.
    expect(screen.getAllByText(/2\.199/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Tarjeta/)).toBeTruthy();
  });
});
