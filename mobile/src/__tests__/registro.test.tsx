import { fireEvent, render, waitFor } from "@testing-library/react-native";
import RegistroScreen from "../app/registro";
import { signUpWithPassword } from "@/lib/sessionManager";

jest.mock("@/lib/sessionManager", () => ({
  signUpWithPassword: jest.fn(),
}));

jest.mock("@/lib/authNavigation", () => ({
  goToLogin: jest.fn(),
  returnFromAuth: jest.fn(),
}));

const mockSignUp = signUpWithPassword as jest.MockedFunction<typeof signUpWithPassword>;

beforeEach(() => {
  mockSignUp.mockReset();
});

// `render` está tipado como asíncrono en esta versión de @testing-library/
// react-native — de ahí el `Awaited<...>` (el resto de los tests de Mobile ya
// hace `await render(...)` por la misma razón).
async function submitRegistro(view: Awaited<ReturnType<typeof render>>, email: string) {
  await fireEvent.changeText(view.getByPlaceholderText("Email"), email);
  await fireEvent.changeText(view.getByPlaceholderText("Contraseña (mínimo 6 caracteres)"), "secreta123");
  await fireEvent.press(view.getByLabelText("Crear cuenta"));
}

describe("RegistroScreen", () => {
  // ACCOUNT-UX-01, problema 2.
  it("explica para qué sirve una cuenta antes del formulario", async () => {
    const view = await render(<RegistroScreen />);
    expect(view.getByText("¿Para qué sirve crear una cuenta?")).toBeTruthy();
  });

  // ACCOUNT-UX-01, problema 3.
  it("muestra el email real al que se envió la verificación", async () => {
    mockSignUp.mockResolvedValue("check-email");
    const view = await render(<RegistroScreen />);

    await submitRegistro(view, "persona@example.com");

    await waitFor(() => expect(view.getByText("Revisa tu correo")).toBeTruthy());
    expect(view.getByText("persona@example.com")).toBeTruthy();
  });

  it("muestra el email ya normalizado (sin espacios), igual al que recibió el registro", async () => {
    mockSignUp.mockResolvedValue("check-email");
    const view = await render(<RegistroScreen />);

    await submitRegistro(view, "  persona@example.com  ");

    await waitFor(() => expect(view.getByText("persona@example.com")).toBeTruthy());
    expect(mockSignUp).toHaveBeenCalledWith("persona@example.com", "secreta123");
  });

  it("no muestra la pantalla de verificación si el registro falla", async () => {
    mockSignUp.mockResolvedValue("error");
    const view = await render(<RegistroScreen />);

    await submitRegistro(view, "persona@example.com");

    await waitFor(() => expect(view.getByText("No se pudo crear la cuenta. Intenta de nuevo.")).toBeTruthy());
    expect(view.queryByText("Revisa tu correo")).toBeNull();
  });
});
