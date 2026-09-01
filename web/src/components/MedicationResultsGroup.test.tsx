import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test-utils";
import type { MedicationResult, PharmacyPrice } from "@comparafarma/domain";
import { groupMedicationResultsByMatchKey } from "@/lib/groupMedicationResults";
import { MedicationResultsGroup } from "./MedicationResultsGroup";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function price(pharmacySlug: PharmacyPrice["pharmacySlug"]): PharmacyPrice {
  return {
    pharmacySlug,
    pharmacyName: pharmacySlug,
    productName: "Producto",
    channels: { store: 1000, online: null, cmr: null, sbpay: null, effective: 1000 },
    hasStock: true,
    hasOnlineDelivery: true,
    onlineUrl: null,
    imageUrl: null,
    fetchedAt: "2026-08-19T00:00:00.000Z",
  };
}

function makeProducts(count: number): MedicationResult[] {
  return Array.from({ length: count }, (_, i) => ({
    matchKey: "omeprazol|20mg|30",
    canonicalName: `Omeprazol 20 mg x 30 cápsulas. (Marca${i})`,
    laboratory: `Marca${i}`,
    brand: null,
    manufacturer: `Marca${i}`,
    activeIngredient: null,
    brandSource: "unknown",
    isBioequivalent: false,
    bestPrice: 900 + i * 10,
    bestPharmacy: "araucomed",
    imageUrl: null,
    presentationKey: `omeprazol|20mg|30|bio:false|brand:marca${i}`,
    prices: [price("araucomed")],
  }));
}

describe("MedicationResultsGroup", () => {
  it("muestra el título del grupo una sola vez y el contador de opciones", () => {
    const [group] = groupMedicationResultsByMatchKey(makeProducts(3));
    render(<MedicationResultsGroup group={group} />);

    expect(screen.getByText("Omeprazol 20 mg x 30 cápsulas.")).toBeTruthy();
    expect(screen.getByText("3 opciones encontradas")).toBeTruthy();
  });

  it("con 3 opciones o menos, no muestra botón de 'ver más'", () => {
    const [group] = groupMedicationResultsByMatchKey(makeProducts(3));
    render(<MedicationResultsGroup group={group} />);
    expect(screen.queryByText(/ver.*opci.*más/i)).toBeNull();
  });

  it("con más de 5 opciones, muestra los textos de 'ver más' para mobile y desktop con las cantidades correctas", () => {
    const [group] = groupMedicationResultsByMatchKey(makeProducts(8));
    render(<MedicationResultsGroup group={group} />);

    expect(screen.getByText(/Ver 5 opciones más/)).toBeTruthy();
    expect(screen.getByText(/Ver 3 opciones más/)).toBeTruthy();
  });

  it("al expandir, la fila 6ta+ pasa de oculta (clase hidden) a visible, y el botón cambia a 'Ver menos'", async () => {
    const user = userEvent.setup();
    const [group] = groupMedicationResultsByMatchKey(makeProducts(8));
    render(<MedicationResultsGroup group={group} />);

    // Índice 7 (8va opción) está oculta por CSS (clase "hidden") antes de
    // expandir, no removida del DOM — evita depender de detección de layout
    // real (jsdom no calcula display:none), pero sí verifica la clase que
    // controla la visibilidad, que es la lógica real del componente.
    const row7Before = screen.getByText("Marca7").closest("li");
    expect(row7Before?.className).toContain("hidden");

    await user.click(screen.getByText(/Ver 5 opciones más/));

    const row7After = screen.getByText("Marca7").closest("li");
    expect(row7After?.className).not.toContain("hidden");
    expect(screen.getByText("Ver menos ↑")).toBeTruthy();
  });

  it("todas las filas se renderizan igual sin importar la marca (no hay tarjeta gigante por producto)", () => {
    const [group] = groupMedicationResultsByMatchKey(makeProducts(2));
    render(<MedicationResultsGroup group={group} />);
    expect(screen.getByText("Marca0")).toBeTruthy();
    expect(screen.getByText("Marca1")).toBeTruthy();
  });

  // Bug real (2026-08-24, búsqueda "Ascenda"): la imagen del producto no se
  // mostraba en Web para resultados de esta vista agrupada, aunque la API
  // trajera una imageUrl válida.
  it("muestra la imagen del grupo cuando al menos un producto comercial la tiene", () => {
    const products = makeProducts(2);
    products[0].imageUrl = "https://example.com/ascenda.jpg";
    const [group] = groupMedicationResultsByMatchKey(products);

    const { container } = render(<MedicationResultsGroup group={group} />);

    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("https://example.com/ascenda.jpg");
  });

  it("no renderiza <img> si ningún producto del grupo tiene imagen", () => {
    const [group] = groupMedicationResultsByMatchKey(makeProducts(2));
    const { container } = render(<MedicationResultsGroup group={group} />);
    expect(container.querySelector("img")).toBeNull();
  });

  // CF-WEB-001 — a 320px el título convive con la miniatura de 48px y le
  // quedan ~196px. Nombres reales con tokens compuestos sin espacio
  // ("Vildagliptina/Metformina", "Clorhidrato/Paracetamol") no tenían punto
  // de corte y se salían de la tarjeta. jsdom no mide layout: se verifica el
  // contrato CSS que habilita el corte (la comprobación visual real está en
  // web/e2e/responsive.spec.ts).
  it("el título del grupo permite cortar tokens largos y encogerse (CF-WEB-001)", () => {
    const products = makeProducts(1);
    products[0].canonicalName = "Vildagliptina/Metformina Clorhidrato 50/850 Mg X 60 comprimidos recubiertos";
    const [group] = groupMedicationResultsByMatchKey(products);

    render(<MedicationResultsGroup group={group} />);
    const title = screen.getByRole("heading", {
      name: "Vildagliptina/Metformina Clorhidrato 50/850 Mg X 60 comprimidos recubiertos",
    });

    expect(title.className).toContain("break-words");
    expect(title.className).toContain("min-w-0");
  });
});
