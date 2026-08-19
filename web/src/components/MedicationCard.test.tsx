import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { cleanup, render, screen } from "@/test-utils";
import type { MedicationResult } from "@comparafarma/domain";
import { MedicationCard } from "./MedicationCard";

// next/link trae su propia copia anidada de react (node_modules/next/node_modules/react),
// distinta de la que usa el resto del árbol en este monorepo — bajo Vitest eso
// dispara "Invalid hook call" al montar. Se mockea por un <a> simple, igual que
// ya se mockea next/navigation en otros tests de este proyecto.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const medication: MedicationResult = {
  matchKey: "paracetamol|500mg",
  canonicalName: "Paracetamol 500 mg",
  laboratory: "Andrómaco",
  isBioequivalent: true,
  bestPrice: 291,
  bestPharmacy: "easyfarma",
  imageUrl: null,
  presentationKey: "paracetamol|500mg|bio:true|brand:unknown",
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

    expect(screen.getByText(/ahorras \$549/)).toBeTruthy();
  });

  it("links to the detail/history page for the medication's slug", () => {
    render(<MedicationCard medication={medication} />);

    const link = screen.getByText("Ver detalle e histórico →");
    expect(link.closest("a")?.getAttribute("href")).toMatch(/^\/medicamento\/paracetamol-500-mg-/);
  });

  it("shows the bioequivalent badge only when isBioequivalent is true", () => {
    render(<MedicationCard medication={{ ...medication, isBioequivalent: true }} />);

    expect(screen.getByText(/Bioequivalente/)).toBeTruthy();

    cleanup();
    render(<MedicationCard medication={{ ...medication, isBioequivalent: false }} />);
    expect(screen.queryByText(/Bioequivalente/)).toBeNull();

    cleanup();
    render(<MedicationCard medication={{ ...medication, isBioequivalent: null }} />);
    expect(screen.queryByText(/Bioequivalente/)).toBeNull();
  });
});
