import { render } from "@testing-library/react-native";
import { MedicationListItem } from "./MedicationListItem";
import type { MedicationResult, PharmacySlug } from "@/lib/types";

/**
 * `@comparafarma/domain` se resuelve en Mobile por el `resolveRequest` custom de
 * `metro.config.js` (los re-exports del paquete usan extensión `.js` por ESM
 * NodeNext y Metro no hace el mapeo `.js → .ts` solo). Jest no tiene ese
 * resolver, así que cualquier test que renderice un componente que importe del
 * dominio no resuelve el módulo. Se mockea acá lo único que este componente usa
 * —`sortByEffectivePrice`, ajeno a la bioequivalencia— con su implementación
 * real, en vez de tocar la configuración de Jest, que es infraestructura fuera
 * del alcance de este ticket (ver FOLLOW_UP del informe).
 */
jest.mock(
  "@comparafarma/domain",
  () => ({
    sortByEffectivePrice: (prices: { channels: { effective: number } }[]) =>
      [...prices].sort((a, b) => a.channels.effective - b.channels.effective),
  }),
  { virtual: true }
);

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/store/configStore", () => ({
  useConfigStore: (selector: (state: { isActive: (slug: string) => boolean }) => unknown) =>
    selector({ isActive: () => true }),
}));

jest.mock("@/store/locationStore", () => ({
  useLocationStore: (selector: (state: { selectedCommune: null }) => unknown) =>
    selector({ selectedCommune: null }),
}));

/**
 * BIOEQUIVALENCE-DATA-QUALITY-01 — la UI de Mobile nunca debe afirmar
 * bioequivalencia sin evidencia.
 *
 * La corrección de los adaptadores hace que `isBioequivalent` llegue mucho más
 * seguido como `null` ("la farmacia no informa") en vez de `false` ("no lo es").
 * Estos casos congelan que ambos se rendericen igual —sin badge— y que el badge
 * "Bio" aparezca únicamente con evidencia positiva real.
 *
 * No se agrega ningún indicador negativo: Product no tiene definida una UX para
 * "no bioequivalente" y, con `null` siendo hoy el estado mayoritario, inventarla
 * sería afirmar algo que la fuente tampoco dice.
 */
function card(isBioequivalent: boolean | null): MedicationResult {
  const slug: PharmacySlug = "cruz-verde";
  return {
    matchKey: "atorvastatina|20mg|30",
    canonicalName: "Atorvastatina 20 mg 30 Comprimidos",
    laboratory: null,
    isBioequivalent,
    presentationKey: `atorvastatina|20mg|30|bio:${
      isBioequivalent === true ? "true" : isBioequivalent === false ? "false" : "unknown"
    }|brand:unknown`,
    bestPrice: 3990,
    bestPharmacy: slug,
    imageUrl: null,
    prices: [
      {
        pharmacySlug: slug,
        pharmacyName: "Cruz Verde",
        productName: "Atorvastatina 20 mg 30 Comprimidos",
        channels: { store: 3990, online: null, cmr: null, sbpay: null, effective: 3990 },
        hasStock: true,
        hasOnlineDelivery: true,
        onlineUrl: null,
        imageUrl: null,
        fetchedAt: "2026-08-30T00:00:00.000Z",
      },
    ],
  };
}

describe("MedicationListItem — badge de bioequivalencia", () => {
  it("muestra el badge solo con evidencia positiva (`true`)", async () => {
    const view = await render(<MedicationListItem medication={card(true)} />);
    expect(view.getByText("Bio")).toBeTruthy();
  });

  it("`null` (no informado) no muestra badge y tampoco muestra nada negativo", async () => {
    const view = await render(<MedicationListItem medication={card(null)} />);
    expect(view.queryByText("Bio")).toBeNull();
    expect(view.queryByText(/No bioequivalente/i)).toBeNull();
  });

  it("`false` (evidencia negativa explícita) se renderiza igual que `null`: sin badge afirmativo", async () => {
    const view = await render(<MedicationListItem medication={card(false)} />);
    expect(view.queryByText("Bio")).toBeNull();
    expect(view.queryByText(/No bioequivalente/i)).toBeNull();
  });
});
