import { fireEvent, render } from "@testing-library/react-native";
import LoginScreen from "../app/login";

const AUTHENTICATED_STATE = {
  initialized: true,
  isAuthenticated: true,
  identity: { id: "u1", email: "persona@example.com" } as { id: string; email: string } | null,
  signOut: jest.fn(),
  signingOut: false,
};

// Mutable a propósito (ACCOUNT-UX-01): la pantalla se prueba en sus dos
// estados de sesión, no solo en el autenticado.
const mockAuthState = { ...AUTHENTICATED_STATE };
jest.mock("@/store/authStore", () => ({
  useAuthStore: (selector: (state: typeof mockAuthState) => unknown) => selector(mockAuthState),
}));

jest.mock("@/lib/sessionManager", () => ({
  signInWithPassword: jest.fn(),
}));

jest.mock("@/lib/authNavigation", () => ({
  goToRegistro: jest.fn(),
  goToRecuperarClave: jest.fn(),
  returnFromAuth: jest.fn(),
}));

let lastSheetProps: { visible: boolean; onClose: () => void } | null = null;
jest.mock("@/components/DeleteAccountSheet", () => ({
  DeleteAccountSheet: (props: { visible: boolean; onClose: () => void }) => {
    lastSheetProps = props;
    const { Text } = require("react-native");
    return props.visible ? <Text>DeleteAccountSheet visible</Text> : null;
  },
}));

beforeEach(() => {
  lastSheetProps = null;
  Object.assign(mockAuthState, AUTHENTICATED_STATE);
});

describe("LoginScreen (autenticado)", () => {
  it("muestra el CTA 'Eliminar cuenta' junto a Cerrar sesión", async () => {
    const view = await render(<LoginScreen />);
    expect(view.getByLabelText("Eliminar cuenta")).toBeTruthy();
    expect(view.getByLabelText("Cerrar sesión")).toBeTruthy();
  });

  it("el sheet de eliminar cuenta empieza oculto y se abre al presionar el CTA", async () => {
    const view = await render(<LoginScreen />);
    expect(view.queryByText("DeleteAccountSheet visible")).toBeNull();

    await fireEvent.press(view.getByLabelText("Eliminar cuenta"));

    expect(await view.findByText("DeleteAccountSheet visible")).toBeTruthy();
  });

  // ACCOUNT-UX-01, problema 1.
  it("declara la sesión iniciada y con qué cuenta", async () => {
    const view = await render(<LoginScreen />);
    expect(view.getByText("Sesión iniciada")).toBeTruthy();
    expect(view.getByText("persona@example.com")).toBeTruthy();
  });

  it("no muestra la explicación de para qué sirve una cuenta (ya la tiene)", async () => {
    const view = await render(<LoginScreen />);
    expect(view.queryByText("La cuenta es opcional")).toBeNull();
  });
});

describe("LoginScreen (sin sesión)", () => {
  beforeEach(() => {
    Object.assign(mockAuthState, { isAuthenticated: false, identity: null });
  });

  // ACCOUNT-UX-01, problema 1: la señal aparece/desaparece con el estado real.
  it("no declara sesión iniciada y muestra el formulario", async () => {
    const view = await render(<LoginScreen />);
    expect(view.queryByText("Sesión iniciada")).toBeNull();
    expect(view.queryByText("persona@example.com")).toBeNull();
    expect(view.getByLabelText("Entrar")).toBeTruthy();
  });

  // ACCOUNT-UX-01, problema 2.
  it("explica para qué sirve una cuenta antes de ofrecer crearla", async () => {
    const view = await render(<LoginScreen />);
    expect(view.getByText("La cuenta es opcional")).toBeTruthy();
    expect(view.getByLabelText("Crear cuenta")).toBeTruthy();
  });

  // ACCOUNT-UX-01 (revisión Mario): la recuperación de contraseña ya
  // funcionaba (`recuperar-clave.tsx` + `sessionManager.sendPasswordReset`),
  // pero solo era alcanzable por deep link. Esta Task la expone desde Login.
  it("ofrece recuperar la contraseña y navega a la pantalla existente", async () => {
    const { goToRecuperarClave } = jest.requireMock("@/lib/authNavigation") as {
      goToRecuperarClave: jest.Mock;
    };
    const view = await render(<LoginScreen />);

    const link = view.getByLabelText("¿Olvidaste tu contraseña?");
    expect(link).toBeTruthy();

    await fireEvent.press(link);

    expect(goToRecuperarClave).toHaveBeenCalledTimes(1);
  });
});
