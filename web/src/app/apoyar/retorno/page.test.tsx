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
import DonationReturnPage from "./page";

describe("DonationReturnPage (/apoyar/retorno)", () => {
  it("nunca afirma que el pago fue exitoso o confirmado solo por volver desde Khipu", () => {
    render(<DonationReturnPage />);
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/pago exitoso/i);
    expect(text).not.toMatch(/donaci[oó]n recibida/i);
    expect(text).not.toMatch(/gracias por tu pago/i);
    expect(text).not.toMatch(/pago confirmado/i);
  });

  it("deja explícito que la confirmación depende de Khipu, no de esta página", () => {
    render(<DonationReturnPage />);
    expect(
      screen.getByText(/Khipu puede tardar unos momentos en confirmarlo/)
    ).toBeTruthy();
  });

  it("permite volver a PreciosFarma", () => {
    render(<DonationReturnPage />);
    const link = screen.getByRole("link", { name: "Volver a PreciosFarma" });
    expect(link.getAttribute("href")).toBe("/");
  });
});
