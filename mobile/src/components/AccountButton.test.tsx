import { fireEvent, render } from "@testing-library/react-native";
import { AccountButton } from "./AccountButton";
import { goToLogin } from "@/lib/authNavigation";

const mockAuthState = { isAuthenticated: false };
jest.mock("@/store/authStore", () => ({
  useAuthStore: (selector: (state: typeof mockAuthState) => unknown) => selector(mockAuthState),
}));

jest.mock("@/lib/authNavigation", () => ({
  goToLogin: jest.fn(),
}));

beforeEach(() => {
  mockAuthState.isAuthenticated = false;
  (goToLogin as jest.Mock).mockClear();
});

// ACCOUNT-UX-01, problema 1: la señal de sesión del header de Home debe
// aparecer y desaparecer con el estado real de autenticación.
describe("AccountButton", () => {
  it("sin sesión, invita a iniciar sesión", async () => {
    const view = await render(<AccountButton />);
    expect(view.getByLabelText("Iniciar sesión")).toBeTruthy();
    expect(view.queryByLabelText("Mi cuenta, sesión iniciada")).toBeNull();
  });

  it("con sesión, declara que la sesión está iniciada", async () => {
    mockAuthState.isAuthenticated = true;
    const view = await render(<AccountButton />);
    expect(view.getByLabelText("Mi cuenta, sesión iniciada")).toBeTruthy();
    expect(view.queryByLabelText("Iniciar sesión")).toBeNull();
  });

  it("lleva a la pantalla de cuenta en ambos estados", async () => {
    const view = await render(<AccountButton />);
    await fireEvent.press(view.getByLabelText("Iniciar sesión"));
    expect(goToLogin).toHaveBeenCalledTimes(1);
  });
});
