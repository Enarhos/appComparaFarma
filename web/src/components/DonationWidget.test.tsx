import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test-utils";
import { DonationWidget } from "./DonationWidget";
import { createDonationPayment } from "@/lib/actions/createDonationPayment";

vi.mock("@/lib/actions/createDonationPayment", () => ({
  createDonationPayment: vi.fn(),
}));

beforeEach(() => {
  // Reemplaza window.location por un objeto simple y escribible: evita el
  // "Not implemented: navigation" de jsdom al asignar window.location.href.
  Object.defineProperty(window, "location", {
    writable: true,
    value: { href: "" },
  });
});

afterEach(() => {
  vi.mocked(createDonationPayment).mockReset();
});

describe("DonationWidget", () => {
  it("muestra el CTA colapsado inicialmente, sin selector de monto", () => {
    render(<DonationWidget />);
    expect(screen.getByRole("button", { name: "Apoya PreciosFarma" })).toBeTruthy();
    expect(screen.queryByText(/1\.000/)).toBeNull();
  });

  it("al hacer clic abre el selector con los 3 montos y el texto explicativo", async () => {
    const user = userEvent.setup();
    render(<DonationWidget />);

    await user.click(screen.getByRole("button", { name: "Apoya PreciosFarma" }));

    expect(
      screen.getByText(/PreciosFarma es gratuito\. Si te resulta útil, puedes ayudarnos/)
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /1\.000/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /3\.000/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /5\.000/ })).toBeTruthy();
  });

  it.each([1000, 3000, 5000])("llama a createDonationPayment con el monto %d elegido", async (amount) => {
    vi.mocked(createDonationPayment).mockResolvedValue({
      ok: true,
      paymentUrl: `https://khipu.com/payment/info/${amount}`,
    });
    const user = userEvent.setup();
    render(<DonationWidget />);

    await user.click(screen.getByRole("button", { name: "Apoya PreciosFarma" }));
    await user.click(screen.getByRole("button", { name: new RegExp(`${amount / 1000}\\.000`) }));

    expect(createDonationPayment).toHaveBeenCalledWith(amount);
  });

  it("no envía ninguna credencial — el componente solo pasa el monto numérico a la acción", async () => {
    vi.mocked(createDonationPayment).mockResolvedValue({ ok: true, paymentUrl: "https://khipu.com/payment/info/x" });
    const user = userEvent.setup();
    render(<DonationWidget />);

    await user.click(screen.getByRole("button", { name: "Apoya PreciosFarma" }));
    await user.click(screen.getByRole("button", { name: /1\.000/ }));

    const args = vi.mocked(createDonationPayment).mock.calls[0];
    expect(args).toEqual([1000]);
  });

  it("muestra 'Preparando pago…' y deshabilita los botones mientras se crea el pago", async () => {
    let resolvePromise!: (value: { ok: true; paymentUrl: string }) => void;
    vi.mocked(createDonationPayment).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );
    const user = userEvent.setup();
    render(<DonationWidget />);

    await user.click(screen.getByRole("button", { name: "Apoya PreciosFarma" }));
    await user.click(screen.getByRole("button", { name: /1\.000/ }));

    expect(await screen.findByText("Preparando pago…")).toBeTruthy();
    expect(screen.getByRole("button", { name: /1\.000/ })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: /3\.000/ })).toHaveProperty("disabled", true);

    resolvePromise({ ok: true, paymentUrl: "https://khipu.com/payment/info/x" });
  });

  it("redirige a payment_url en la misma pestaña cuando la respuesta es válida", async () => {
    vi.mocked(createDonationPayment).mockResolvedValue({
      ok: true,
      paymentUrl: "https://khipu.com/payment/info/abc123",
    });
    const user = userEvent.setup();
    render(<DonationWidget />);

    await user.click(screen.getByRole("button", { name: "Apoya PreciosFarma" }));
    await user.click(screen.getByRole("button", { name: /1\.000/ }));

    await vi.waitFor(() => {
      expect(window.location.href).toBe("https://khipu.com/payment/info/abc123");
    });
  });

  it("muestra un error simple y permite reintentar si la acción falla", async () => {
    vi.mocked(createDonationPayment).mockResolvedValue({
      ok: false,
      error: "No pudimos iniciar el pago. Intenta nuevamente en unos momentos.",
    });
    const user = userEvent.setup();
    render(<DonationWidget />);

    await user.click(screen.getByRole("button", { name: "Apoya PreciosFarma" }));
    await user.click(screen.getByRole("button", { name: /1\.000/ }));

    expect(await screen.findByText("No pudimos iniciar el pago. Intenta nuevamente en unos momentos.")).toBeTruthy();
    // El selector de monto sigue disponible para reintentar.
    expect(screen.getByRole("button", { name: /1\.000/ })).toHaveProperty("disabled", false);
    expect(window.location.href).toBe("");
  });

  it("nunca muestra stack traces, respuestas crudas ni datos de infraestructura en el error", async () => {
    vi.mocked(createDonationPayment).mockResolvedValue({
      ok: false,
      error: "No pudimos iniciar el pago. Intenta nuevamente en unos momentos.",
    });
    const user = userEvent.setup();
    render(<DonationWidget />);

    await user.click(screen.getByRole("button", { name: "Apoya PreciosFarma" }));
    await user.click(screen.getByRole("button", { name: /1\.000/ }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).not.toMatch(/error|stack|khipu\.com\/api|500|401|undefined/i);
  });

  it("previene doble envío: dos clics rápidos en el mismo monto solo llaman a la acción una vez", async () => {
    let resolvePromise!: (value: { ok: true; paymentUrl: string }) => void;
    vi.mocked(createDonationPayment).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );
    const user = userEvent.setup();
    render(<DonationWidget />);

    await user.click(screen.getByRole("button", { name: "Apoya PreciosFarma" }));
    const button1000 = screen.getByRole("button", { name: /1\.000/ });

    // Dos clics disparados sin esperar a que React vuelva a renderizar.
    await Promise.all([user.click(button1000), user.click(button1000)]);

    expect(createDonationPayment).toHaveBeenCalledTimes(1);
    resolvePromise({ ok: true, paymentUrl: "https://khipu.com/payment/info/x" });
  });

  it("el botón Cerrar vuelve al estado colapsado", async () => {
    const user = userEvent.setup();
    render(<DonationWidget />);

    await user.click(screen.getByRole("button", { name: "Apoya PreciosFarma" }));
    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(screen.getByRole("button", { name: "Apoya PreciosFarma" })).toBeTruthy();
    expect(screen.queryByText(/1\.000/)).toBeNull();
  });
});
