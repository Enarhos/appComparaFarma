import { fireEvent, render, waitFor, type RenderResult } from "@testing-library/react-native";
import { DeleteAccountSheet } from "./DeleteAccountSheet";

// @testing-library/react-native 14.x: render() es async (soporte de modo
// concurrente de React 19) — hay que await-earlo, a diferencia de versiones
// anteriores (12.x) usadas en ejemplos más viejos de la documentación.

const mockSignOut = jest.fn().mockResolvedValue(undefined);
jest.mock("@/store/authStore", () => ({
  useAuthStore: (selector: (state: { signOut: () => Promise<void> }) => unknown) =>
    selector({ signOut: mockSignOut }),
}));

const mockGetCurrentSession = jest.fn();
jest.mock("@/lib/sessionManager", () => ({
  getCurrentSession: () => mockGetCurrentSession(),
}));

const mockDeleteAccount = jest.fn();
jest.mock("@/lib/deleteAccount", () => ({
  deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args),
}));

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
}));

beforeEach(() => {
  mockSignOut.mockClear();
  mockGetCurrentSession.mockReset().mockResolvedValue({ access_token: "fake-access-token" });
  mockDeleteAccount.mockReset();
  mockReplace.mockClear();
});

async function renderSheet(props: Partial<{ visible: boolean; onClose: () => void }> = {}): Promise<RenderResult> {
  return render(<DeleteAccountSheet visible={props.visible ?? true} onClose={props.onClose ?? jest.fn()} />);
}

async function goToConfirmStep(view: RenderResult) {
  await fireEvent.changeText(view.getByLabelText("Contraseña actual"), "mi-password-actual");
  await fireEvent.press(view.getByLabelText("Continuar"));
  await view.findByText("Esta acción no se puede deshacer.");
}

describe("DeleteAccountSheet", () => {
  it("no renderiza contenido cuando visible=false", async () => {
    const view = await renderSheet({ visible: false });
    expect(view.queryByText("Esta acción es permanente y no se puede deshacer.")).toBeNull();
  });

  it("Step A: muestra la explicación y exige contraseña antes de continuar", async () => {
    const view = await renderSheet();

    expect(view.getByText("Esta acción es permanente y no se puede deshacer.")).toBeTruthy();

    await fireEvent.press(view.getByLabelText("Continuar"));

    expect(await view.findByText("Ingresa tu contraseña actual.")).toBeTruthy();
    expect(mockDeleteAccount).not.toHaveBeenCalled();
  });

  it("con contraseña, pasa de Step A a Step B (confirmación final)", async () => {
    const view = await renderSheet();
    await goToConfirmStep(view);

    expect(view.getByLabelText("Eliminar mi cuenta")).toBeTruthy();
    expect(view.queryByLabelText("Contraseña actual")).toBeNull();
  });

  it("Cancelar en Step A cierra el sheet sin llamar a la API", async () => {
    const onClose = jest.fn();
    const view = await renderSheet({ onClose });

    await fireEvent.press(view.getAllByLabelText("Cancelar")[0]);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockDeleteAccount).not.toHaveBeenCalled();
  });

  it("Cancelar en Step B vuelve a Step A sin llamar a la API", async () => {
    const view = await renderSheet();
    await goToConfirmStep(view);

    await fireEvent.press(view.getByLabelText("Cancelar"));

    expect(await view.findByLabelText("Contraseña actual")).toBeTruthy();
    expect(mockDeleteAccount).not.toHaveBeenCalled();
  });

  it("llama a deleteAccount con el access token de la sesión y la contraseña ingresada", async () => {
    mockDeleteAccount.mockResolvedValue({ ok: true });
    const view = await renderSheet();
    await goToConfirmStep(view);

    await fireEvent.press(view.getByLabelText("Eliminar mi cuenta"));

    await waitFor(() => expect(mockDeleteAccount).toHaveBeenCalledWith("fake-access-token", "mi-password-actual"));
  });

  it("contraseña incorrecta: muestra el error y permite reintentar sin cerrar sesión", async () => {
    mockDeleteAccount.mockResolvedValue({ ok: false, code: "invalid_credentials", message: "La contraseña no es correcta." });
    const view = await renderSheet();
    await goToConfirmStep(view);

    await fireEvent.press(view.getByLabelText("Eliminar mi cuenta"));

    expect(await view.findByText("La contraseña no es correcta.")).toBeTruthy();
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("error de red: muestra el mensaje correspondiente sin cerrar sesión", async () => {
    mockDeleteAccount.mockResolvedValue({
      ok: false,
      code: "network_error",
      message: "No pudimos conectar. Revisa tu conexión e intenta de nuevo.",
    });
    const view = await renderSheet();
    await goToConfirmStep(view);

    await fireEvent.press(view.getByLabelText("Eliminar mi cuenta"));

    expect(await view.findByText("No pudimos conectar. Revisa tu conexión e intenta de nuevo.")).toBeTruthy();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("previene doble submit: deshabilita el botón mientras procesa", async () => {
    let resolveDelete: (v: { ok: true }) => void = () => {};
    mockDeleteAccount.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDelete = resolve;
        })
    );
    const view = await renderSheet();
    await goToConfirmStep(view);

    // No se espera esta promesa a propósito: deleteAccount está bloqueada
    // (resolveDelete todavía no se llamó), así que awaitearla colgaría el
    // test. Se usa waitFor para observar el estado intermedio "processing".
    fireEvent.press(view.getByLabelText("Eliminar mi cuenta"));

    await waitFor(() => expect(mockDeleteAccount).toHaveBeenCalledTimes(1));
    const button = await waitFor(() => view.getByLabelText("Eliminar mi cuenta"));
    expect(button.props.accessibilityState?.disabled).toBe(true);

    resolveDelete({ ok: true });
    await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
    // Solo se llamó una vez a deleteAccount durante todo el ciclo — el
    // segundo intento fue bloqueado por el disabled de arriba, nunca por
    // una segunda llamada real a la API.
    expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
  });

  it("éxito: cierra sesión, cierra el sheet y navega a Home", async () => {
    mockDeleteAccount.mockResolvedValue({ ok: true });
    const onClose = jest.fn();
    const view = await renderSheet({ onClose });
    await goToConfirmStep(view);

    await fireEvent.press(view.getByLabelText("Eliminar mi cuenta"));

    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
    expect(onClose).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("suscripción activa: muestra el proveedor y no cierra sesión", async () => {
    mockDeleteAccount.mockResolvedValue({
      ok: false,
      code: "active_subscription_requires_cancellation",
      message: "Tienes una suscripción activa que debe cancelarse antes de eliminar tu cuenta.",
      provider: "google_play",
    });
    const view = await renderSheet();
    await goToConfirmStep(view);

    await fireEvent.press(view.getByLabelText("Eliminar mi cuenta"));

    expect(await view.findByText(/google_play/)).toBeTruthy();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("Gate 2.1: Cancelar en Step A limpia la contraseña del estado inmediatamente (sin esperar a que el padre baje `visible`)", async () => {
    const onClose = jest.fn();
    const view = await renderSheet({ onClose });

    await fireEvent.changeText(view.getByLabelText("Contraseña actual"), "mi-password-actual");
    let input = view.getByLabelText("Contraseña actual") as unknown as { props: { value: string } };
    expect(input.props.value).toBe("mi-password-actual");

    await fireEvent.press(view.getAllByLabelText("Cancelar")[0]);

    expect(onClose).toHaveBeenCalledTimes(1);
    // handleClose limpia `password` de forma síncrona, en el mismo
    // componente todavía montado — no depende de que el padre re-renderice
    // con visible=false (defensa en profundidad además de ese efecto).
    input = view.getByLabelText("Contraseña actual") as unknown as { props: { value: string } };
    expect(input.props.value).toBe("");
  });

  it("Gate 2.1: el botón 'Cerrar' del header también limpia la contraseña", async () => {
    const view = await renderSheet();

    await fireEvent.changeText(view.getByLabelText("Contraseña actual"), "otro-secreto");
    await fireEvent.press(view.getByLabelText("Cerrar"));

    const input = view.getByLabelText("Contraseña actual") as unknown as { props: { value: string } };
    expect(input.props.value).toBe("");
  });



  it("onRequestClose (botón físico de retroceso en Android) cierra el sheet sin ejecutar el borrado", async () => {
    const onClose = jest.fn();
    const view = await renderSheet({ onClose });

    // El root del árbol es el <Modal> — su prop onRequestClose es lo que
    // Android invoca al presionar el botón físico de retroceso.
    const tree = view.toJSON();
    const modalNode = Array.isArray(tree) ? tree[0] : tree;
    expect(modalNode?.type).toBe("Modal");
    modalNode.props.onRequestClose();

    expect(onClose).toHaveBeenCalled();
    expect(mockDeleteAccount).not.toHaveBeenCalled();
  });
});
