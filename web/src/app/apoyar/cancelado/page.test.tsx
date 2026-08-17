import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@/test-utils";

// next/link trae su propia copia anidada de react (node_modules/next/node_modules/react),
// distinta de la que usa el resto del árbol en este monorepo — bajo Vitest eso
// dispara "Invalid hook call" al montar (mismo mock que MedicationCard.test.tsx).
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
import DonationCancelledPage from "./page";

describe("DonationCancelledPage (/apoyar/cancelado)", () => {
  it("indica que el aporte no fue completado, sin ambigüedad", () => {
    render(<DonationCancelledPage />);
    expect(screen.getByText("El aporte no fue completado")).toBeTruthy();
  });

  it("permite volver a PreciosFarma", () => {
    render(<DonationCancelledPage />);
    const link = screen.getByRole("link", { name: "Volver a PreciosFarma" });
    expect(link.getAttribute("href")).toBe("/");
  });
});
