import { describe, it, expect, vi, afterEach } from "vitest";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test-utils";
import type { MedicationResult } from "@comparafarma/domain";
import { __resetRecipeListCacheForTests } from "@/lib/useRecipeList";
import { CommercialProductRow } from "./CommercialProductRow";

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

function medication(overrides: Partial<MedicationResult> = {}): MedicationResult {
  return {
    matchKey: "omeprazol|20mg|30",
    canonicalName: "Omeprazol 20 mg x 30 cápsulas. (Curae Spring)",
    laboratory: "CuraeSpring",
    isBioequivalent: false,
    bestPrice: 990,
    bestPharmacy: "araucomed",
    imageUrl: null,
    presentationKey: "omeprazol|20mg|30|bio:false|brand:curaespring",
    prices: [
      {
        pharmacySlug: "araucomed",
        pharmacyName: "AraucoMed",
        productName: "Omeprazol 20 mg x 30 cápsulas. (Curae Spring)",
        channels: { store: 990, online: null, cmr: null, sbpay: null, effective: 990 },
        hasStock: true,
        hasOnlineDelivery: true,
        onlineUrl: "https://farmacia.araucomed.com/producto",
        imageUrl: null,
        fetchedAt: "2026-08-19T00:00:00.000Z",
      },
      {
        pharmacySlug: "farmex",
        pharmacyName: "Farmex",
        productName: "Omeprazol 20 mg x 30 cápsulas. (Curae Spring)",
        channels: { store: 1390, online: null, cmr: null, sbpay: null, effective: 1390 },
        hasStock: true,
        hasOnlineDelivery: false,
        onlineUrl: null,
        imageUrl: null,
        fetchedAt: "2026-08-19T00:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

describe("CommercialProductRow", () => {
  it("muestra la marca/laboratorio, la cobertura y el precio desde", () => {
    render(<CommercialProductRow medication={medication()} />);
    expect(screen.getByText("CuraeSpring")).toBeTruthy();
    expect(screen.getByText("2 farmacias")).toBeTruthy();
    expect(screen.getByText(/desde \$990/)).toBeTruthy();
  });

  it('muestra "Marca no identificada" cuando laboratory es null', () => {
    render(<CommercialProductRow medication={medication({ laboratory: null })} />);
    expect(screen.getByText("Marca no identificada")).toBeTruthy();
  });

  it('muestra "Marca no identificada" cuando laboratory es una cadena en blanco', () => {
    render(<CommercialProductRow medication={medication({ laboratory: "   " })} />);
    expect(screen.getByText("Marca no identificada")).toBeTruthy();
  });

  it("muestra el badge Bioequivalente solo cuando isBioequivalent es true", () => {
    render(<CommercialProductRow medication={medication({ isBioequivalent: true })} />);
    expect(screen.getByText(/Bioequivalente/)).toBeTruthy();
  });

  it("NO muestra badge Bioequivalente cuando es false o null", () => {
    render(<CommercialProductRow medication={medication({ isBioequivalent: false })} />);
    expect(screen.queryByText(/Bioequivalente/)).toBeNull();
  });

  it("no muestra la lista de farmacias hasta expandir, y la oculta de nuevo al colapsar", async () => {
    const user = userEvent.setup();
    render(<CommercialProductRow medication={medication()} />);
    expect(screen.queryByText("AraucoMed")).toBeNull();

    const toggle = screen.getByRole("button", { name: /Ver precios/ });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    await user.click(toggle);
    expect(screen.getByText("AraucoMed")).toBeTruthy();
    expect(screen.getByText("Farmex")).toBeTruthy();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    await user.click(toggle);
    expect(screen.queryByText("AraucoMed")).toBeNull();
  });

  it("el link de detalle usa el slug del MedicationResult individual (no del grupo)", async () => {
    const user = userEvent.setup();
    render(<CommercialProductRow medication={medication()} />);
    await user.click(screen.getByRole("button", { name: /Ver precios/ }));
    const link = screen.getByText("Ver detalle e histórico →");
    expect(link.closest("a")?.getAttribute("href")).toMatch(/^\/medicamento\/omeprazol-20-mg-x-30-capsulas-curae-spring-/);
  });

  it('"Agregar a mi receta" agrega el matchKey/canonicalName/imageUrl de ESTE producto comercial (no el del grupo)', async () => {
    const user = userEvent.setup();
    render(
      <CommercialProductRow
        medication={medication({ matchKey: "omeprazol|20mg|30", canonicalName: "Omeprazol CuraeSpring", imageUrl: "https://img/curaespring.jpg" })}
      />
    );
    await user.click(screen.getByRole("button", { name: /Ver precios/ }));

    await user.click(screen.getByRole("button", { name: "Agregar a mi receta" }));

    const stored = JSON.parse(window.localStorage.getItem("recipe-list-v1") ?? "[]");
    expect(stored).toEqual([
      { matchKey: "omeprazol|20mg|30", canonicalName: "Omeprazol CuraeSpring", imageUrl: "https://img/curaespring.jpg" },
    ]);
  });

  it("no mezcla precios de otro producto: solo renderiza las farmacias de medication.prices", async () => {
    const user = userEvent.setup();
    render(<CommercialProductRow medication={medication()} />);
    await user.click(screen.getByRole("button", { name: /Ver precios/ }));
    expect(screen.getByText("AraucoMed")).toBeTruthy();
    expect(screen.getByText("Farmex")).toBeTruthy();
    expect(screen.queryByText("EasyFarma")).toBeNull();
  });
});
