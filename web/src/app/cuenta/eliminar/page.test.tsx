import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test-utils";

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

const signOutMock = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signOut: signOutMock } }),
}));

import { deleteAccount } from "@/lib/actions/deleteAccount";
vi.mock("@/lib/actions/deleteAccount", () => ({
  deleteAccount: vi.fn(),
}));

import EliminarCuentaPage from "./page";

afterEach(() => {
  vi.mocked(deleteAccount).mockReset();
  pushMock.mockReset();
  refreshMock.mockReset();
  signOutMock.mockClear();
});

async function goToConfirmStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Confirma tu contraseña actual"), "mi-password-actual");
  await user.click(screen.getByRole("button", { name: "Continuar" }));
}

describe("EliminarCuentaPage", () => {
  it("explica que la acción es permanente y qué se elimina / qué se conserva", () => {
    render(<EliminarCuentaPage />);
    expect(screen.getByText("Esta acción es permanente y no se puede deshacer.")).toBeTruthy();
    expect(screen.getByText(/Se elimina tu perfil y acceso/)).toBeTruthy();
    expect(screen.getByText(/no se elimina, porque no son registros de tu cuenta/)).toBeTruthy();
  });

  it("exige contraseña antes de continuar a la confirmación final", async () => {
    const user = userEvent.setup();
    render(<EliminarCuentaPage />);

    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByText("Ingresa tu contraseña actual.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Eliminar mi cuenta" })).toBeNull();
  });

  it("con contraseña ingresada, pasa a un estado de confirmación final distinto", async () => {
    const user = userEvent.setup();
    render(<EliminarCuentaPage />);

    await goToConfirmStep(user);

    expect(screen.getByText("Esta acción no se puede deshacer.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Eliminar mi cuenta" })).toBeTruthy();
    expect(screen.queryByLabelText("Confirma tu contraseña actual")).toBeNull();
  });

  it("Cancelar en el paso de contraseña vuelve a /cuenta", async () => {
    const user = userEvent.setup();
    render(<EliminarCuentaPage />);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(pushMock).toHaveBeenCalledWith("/cuenta");
    expect(deleteAccount).not.toHaveBeenCalled();
  });

  it("Cancelar en la confirmación final vuelve al formulario sin llamar a la API", async () => {
    const user = userEvent.setup();
    render(<EliminarCuentaPage />);

    await goToConfirmStep(user);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByLabelText("Confirma tu contraseña actual")).toBeTruthy();
    expect(deleteAccount).not.toHaveBeenCalled();
  });

  it("llama a deleteAccount con la contraseña ingresada al confirmar", async () => {
    vi.mocked(deleteAccount).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<EliminarCuentaPage />);

    await goToConfirmStep(user);
    await user.click(screen.getByRole("button", { name: "Eliminar mi cuenta" }));

    expect(deleteAccount).toHaveBeenCalledWith("mi-password-actual");
    expect(deleteAccount).toHaveBeenCalledTimes(1);
  });

  it("contraseña incorrecta: muestra el mensaje mapeado y permite reintentar desde la confirmación", async () => {
    vi.mocked(deleteAccount).mockResolvedValue({
      ok: false,
      code: "invalid_credentials",
      message: "La contraseña no es correcta.",
    });
    const user = userEvent.setup();
    render(<EliminarCuentaPage />);

    await goToConfirmStep(user);
    await user.click(screen.getByRole("button", { name: "Eliminar mi cuenta" }));

    expect(await screen.findByText("La contraseña no es correcta.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Eliminar mi cuenta" })).toBeTruthy();
    expect(signOutMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("error de red: muestra el mensaje correspondiente sin cerrar sesión", async () => {
    vi.mocked(deleteAccount).mockResolvedValue({
      ok: false,
      code: "network_error",
      message: "No pudimos conectar. Revisa tu conexión e intenta de nuevo.",
    });
    const user = userEvent.setup();
    render(<EliminarCuentaPage />);

    await goToConfirmStep(user);
    await user.click(screen.getByRole("button", { name: "Eliminar mi cuenta" }));

    expect(await screen.findByText("No pudimos conectar. Revisa tu conexión e intenta de nuevo.")).toBeTruthy();
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("suscripción activa: muestra el proveedor y no cierra sesión", async () => {
    vi.mocked(deleteAccount).mockResolvedValue({
      ok: false,
      code: "active_subscription_requires_cancellation",
      message: "Tienes una suscripción activa que debe cancelarse antes de eliminar tu cuenta.",
      provider: "google_play",
    });
    const user = userEvent.setup();
    render(<EliminarCuentaPage />);

    await goToConfirmStep(user);
    await user.click(screen.getByRole("button", { name: "Eliminar mi cuenta" }));

    expect(await screen.findByText(/google_play/)).toBeTruthy();
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("previene doble submit: deshabilita el botón mientras procesa", async () => {
    let resolveDelete: (value: { ok: true }) => void = () => {};
    vi.mocked(deleteAccount).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDelete = resolve;
        })
    );
    const user = userEvent.setup();
    render(<EliminarCuentaPage />);

    await goToConfirmStep(user);
    const deleteButton = screen.getByRole("button", { name: "Eliminar mi cuenta" });
    await user.click(deleteButton);

    expect(screen.getByRole("button", { name: "Eliminando…" })).toHaveProperty("disabled", true);
    expect(deleteAccount).toHaveBeenCalledTimes(1);

    resolveDelete({ ok: true });
    await screen.findByText(/Tu cuenta fue eliminada/);
  });

  it("éxito: cierra sesión y navega a un destino no autenticado", async () => {
    vi.mocked(deleteAccount).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<EliminarCuentaPage />);

    await goToConfirmStep(user);
    await user.click(screen.getByRole("button", { name: "Eliminar mi cuenta" }));

    expect(await screen.findByText(/Tu cuenta fue eliminada/)).toBeTruthy();
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/");
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("Gate 2.1: la contraseña se limpia del estado después de cualquier intento (éxito o error) — un reintento exige volver a escribirla", async () => {
    vi.mocked(deleteAccount).mockResolvedValue({
      ok: false,
      code: "invalid_credentials",
      message: "La contraseña no es correcta.",
    });
    const user = userEvent.setup();
    render(<EliminarCuentaPage />);

    await goToConfirmStep(user);
    await user.click(screen.getByRole("button", { name: "Eliminar mi cuenta" }));
    await screen.findByText("La contraseña no es correcta.");

    // Cancelar vuelve al formulario — el campo de contraseña debe estar
    // vacío, no debe haber sobrevivido el intento fallido en memoria.
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    const passwordInput = screen.getByLabelText("Confirma tu contraseña actual") as HTMLInputElement;
    expect(passwordInput.value).toBe("");
  });

  it("accesibilidad: el campo de contraseña tiene un label asociado y el área de error es aria-live", () => {
    const { container } = render(<EliminarCuentaPage />);
    const input = screen.getByLabelText("Confirma tu contraseña actual");
    expect(input.getAttribute("type")).toBe("password");
    expect(input.getAttribute("autocomplete")).toBe("current-password");
    expect(container.querySelector('[aria-live="polite"]')).toBeTruthy();
  });
});
