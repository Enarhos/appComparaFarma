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
});
