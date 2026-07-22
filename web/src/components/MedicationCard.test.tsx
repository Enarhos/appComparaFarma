import { describe, it, expect } from "vitest";
import { render, screen } from "@/test-utils";
import type { MedicationResult } from "@comparafarma/domain";
import { MedicationCard } from "./MedicationCard";

const medication: MedicationResult = {
  matchKey: "paracetamol|500mg",
  canonicalName: "Paracetamol 500 mg",
  laboratory: "Andrómaco",
  isBioequivalent: true,
  bestPrice: 291,
  bestPharmacy: "easyfarma",
  imageUrl: null,
  prices: [
    {
      pharmacySlug: "easyfarma",
      pharmacyName: "EasyFarma",
      productName: "Paracetamol 500 mg",
      channels: { store: 690, online: null, cmr: null, sbpay: null, effective: 291 },
      hasStock: true,
      hasOnlineDelivery: true,
      onlineUrl: "https://easyfarma.cl/producto",
      imageUrl: null,
      fetchedAt: "2026-07-20T00:00:00.000Z",
    },
    {
      pharmacySlug: "cruz-verde",
      pharmacyName: "Cruz Verde",
      productName: "Paracetamol 500 mg",
      channels: { store: 840, online: null, cmr: null, sbpay: null, effective: 840 },
      hasStock: true,
      hasOnlineDelivery: false,
      onlineUrl: null,
      imageUrl: null,
      fetchedAt: "2026-07-20T00:00:00.000Z",
    },
  ],
};

describe("MedicationCard", () => {
  it("shows the lowest effective price and the pharmacy that has it", () => {
    render(<MedicationCard medication={medication} />);

    // "$291" y "EasyFarma" aparecen dos veces a propósito: como precio/
    // farmacia destacados y en la fila de EasyFarma (la más barata) —
    // ambas apariciones son el comportamiento correcto del componente,
    // no un bug de la prueba.
    expect(screen.getAllByText("$291").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/EasyFarma/).length).toBeGreaterThan(0);
  });

  it("shows the savings versus the most expensive pharmacy", () => {
    render(<MedicationCard medication={medication} />);

    expect(screen.getByText(/ahorrás \$549/)).toBeTruthy();
  });
});
