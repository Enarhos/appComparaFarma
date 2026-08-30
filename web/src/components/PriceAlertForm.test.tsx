import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test-utils";
import { PriceAlertForm } from "./PriceAlertForm";
import { createPriceAlert } from "@/lib/actions/createPriceAlert";

vi.mock("@/lib/actions/createPriceAlert", () => ({
  createPriceAlert: vi.fn(),
}));

afterEach(() => {
  vi.mocked(createPriceAlert).mockReset();
});

describe("PriceAlertForm", () => {
  it("muestra el botón colapsado inicialmente, sin formulario", () => {
    render(<PriceAlertForm matchKey="a" canonicalName="Paracetamol" currentBestPrice={1000} />);
    expect(screen.getByRole("button", { name: /Avisarme si baja de precio/ })).toBeTruthy();
    expect(screen.queryByLabelText("Tu email")).toBeNull();
  });

  it("al hacer clic abre el formulario con el precio objetivo sugerido (90% del actual)", async () => {
    const user = userEvent.setup();
    render(<PriceAlertForm matchKey="a" canonicalName="Paracetamol" currentBestPrice={1000} />);

    await user.click(screen.getByRole("button", { name: /Avisarme si baja de precio/ }));

    const targetInput = screen.getByLabelText("Avísame si baja de") as HTMLInputElement;
    expect(targetInput.value).toBe("900");
  });

  it("envía la alerta y muestra el mensaje de éxito", async () => {
    vi.mocked(createPriceAlert).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<PriceAlertForm matchKey="paracetamol|500mg" canonicalName="Paracetamol 500 mg" currentBestPrice={1000} />);

    await user.click(screen.getByRole("button", { name: /Avisarme si baja de precio/ }));
    await user.type(screen.getByLabelText("Tu email"), "a@b.com");
    await user.click(screen.getByRole("button", { name: "Crear alerta" }));

    expect(await screen.findByText(/Revisa tu email para confirmar la alerta/)).toBeTruthy();
    expect(createPriceAlert).toHaveBeenCalledWith({
      email: "a@b.com",
      matchKey: "paracetamol|500mg",
      canonicalName: "Paracetamol 500 mg",
      targetPrice: 900,
      currentPrice: 1000,
    });
  });

  it("con targetPrice === currentPrice muestra el error y no llama al backend", async () => {
    const user = userEvent.setup();
    render(<PriceAlertForm matchKey="a" canonicalName="Paracetamol" currentBestPrice={1000} />);

    await user.click(screen.getByRole("button", { name: /Avisarme si baja de precio/ }));
    await user.type(screen.getByLabelText("Tu email"), "a@b.com");
    await user.clear(screen.getByLabelText("Avísame si baja de"));
    await user.type(screen.getByLabelText("Avísame si baja de"), "1000");
    await user.click(screen.getByRole("button", { name: "Crear alerta" }));

    expect(await screen.findByText("El precio objetivo debe ser menor al precio actual.")).toBeTruthy();
    expect(createPriceAlert).not.toHaveBeenCalled();
  });

  it("con targetPrice > currentPrice muestra el error y no llama al backend", async () => {
    const user = userEvent.setup();
    render(<PriceAlertForm matchKey="a" canonicalName="Paracetamol" currentBestPrice={1000} />);

    await user.click(screen.getByRole("button", { name: /Avisarme si baja de precio/ }));
    await user.type(screen.getByLabelText("Tu email"), "a@b.com");
    await user.clear(screen.getByLabelText("Avísame si baja de"));
    await user.type(screen.getByLabelText("Avísame si baja de"), "1200");
    await user.click(screen.getByRole("button", { name: "Crear alerta" }));

    expect(await screen.findByText("El precio objetivo debe ser menor al precio actual.")).toBeTruthy();
    expect(createPriceAlert).not.toHaveBeenCalled();
  });

  it("con targetPrice < currentPrice sí llama al backend (permite continuar)", async () => {
    vi.mocked(createPriceAlert).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<PriceAlertForm matchKey="a" canonicalName="Paracetamol" currentBestPrice={1000} />);

    await user.click(screen.getByRole("button", { name: /Avisarme si baja de precio/ }));
    await user.type(screen.getByLabelText("Tu email"), "a@b.com");
    await user.clear(screen.getByLabelText("Avísame si baja de"));
    await user.type(screen.getByLabelText("Avísame si baja de"), "800");
    await user.click(screen.getByRole("button", { name: "Crear alerta" }));

    expect(await screen.findByText(/Revisa tu email para confirmar la alerta/)).toBeTruthy();
    expect(createPriceAlert).toHaveBeenCalledWith({
      email: "a@b.com",
      matchKey: "a",
      canonicalName: "Paracetamol",
      targetPrice: 800,
      currentPrice: 1000,
    });
  });

  it("muestra el error devuelto por la acción sin perder el formulario", async () => {
    vi.mocked(createPriceAlert).mockResolvedValue({ ok: false, error: "Demasiados intentos." });
    const user = userEvent.setup();
    render(<PriceAlertForm matchKey="a" canonicalName="Paracetamol" currentBestPrice={1000} />);

    await user.click(screen.getByRole("button", { name: /Avisarme si baja de precio/ }));
    await user.type(screen.getByLabelText("Tu email"), "a@b.com");
    await user.click(screen.getByRole("button", { name: "Crear alerta" }));

    expect(await screen.findByText("Demasiados intentos.")).toBeTruthy();
    expect(screen.getByLabelText("Tu email")).toBeTruthy();
  });

  it("el botón Cancelar vuelve al estado colapsado", async () => {
    const user = userEvent.setup();
    render(<PriceAlertForm matchKey="a" canonicalName="Paracetamol" currentBestPrice={1000} />);

    await user.click(screen.getByRole("button", { name: /Avisarme si baja de precio/ }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByRole("button", { name: /Avisarme si baja de precio/ })).toBeTruthy();
    expect(screen.queryByLabelText("Tu email")).toBeNull();
  });

  // CF-WEB-001 — con `flex-1` (flex-basis 0) el grupo del email se encogía a
  // ~3-18px a ≤390px: el input quedaba inutilizable y su label se superponía
  // con "Avísame si baja de". jsdom no mide layout, así que se blinda el
  // contrato CSS (la verificación visual real está en web/e2e/responsive.spec.ts).
  it("el grupo del email declara flex-basis real para poder hacer wrap en móvil (CF-WEB-001)", async () => {
    const user = userEvent.setup();
    render(<PriceAlertForm matchKey="a" canonicalName="Paracetamol" currentBestPrice={1000} />);

    await user.click(screen.getByRole("button", { name: /Avisarme si baja de precio/ }));

    const emailGroup = screen.getByLabelText("Tu email").parentElement;
    expect(emailGroup?.className).toContain("flex-[1_1_11rem]");
    expect(emailGroup?.className.split(/\s+/)).not.toContain("flex-1");
    // A partir de `sm` el layout de escritorio se mantiene tal cual estaba.
    expect(emailGroup?.className).toContain("sm:flex-none");
  });
});
