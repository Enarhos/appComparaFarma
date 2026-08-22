import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@/test-utils";

// next/link trae su propia copia anidada de react — mismo mock que
// src/app/apoyar/cancelado/page.test.tsx.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const getCurrentProfileMock = vi.fn();
vi.mock("@/lib/profile", () => ({
  getCurrentProfile: () => getCurrentProfileMock(),
}));

vi.mock("@/lib/plans", () => ({
  getAvailablePlans: vi.fn().mockResolvedValue([]),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/cuenta",
}));

import CuentaPage from "./page";

describe("CuentaPage", () => {
  it("muestra el CTA 'Eliminar cuenta' dentro de la sección de zona de peligro, apuntando a /cuenta/eliminar", async () => {
    getCurrentProfileMock.mockResolvedValue({ email: "persona@example.com", plan: "premium" });

    const result = await CuentaPage({ searchParams: Promise.resolve({}) });
    render(result);

    const link = screen.getByRole("link", { name: "Eliminar cuenta" }) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/cuenta/eliminar");
  });
});
