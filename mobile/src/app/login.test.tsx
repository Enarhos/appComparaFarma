import { fireEvent, render } from "@testing-library/react-native";
import LoginScreen from "./login";

const mockAuthState = {
  initialized: true,
  isAuthenticated: true,
  identity: { id: "u1", email: "persona@example.com" },
  signOut: jest.fn(),
  signingOut: false,
};
jest.mock("@/store/authStore", () => ({
  useAuthStore: (selector: (state: typeof mockAuthState) => unknown) => selector(mockAuthState),
}));

jest.mock("@/lib/sessionManager", () => ({
  signInWithPassword: jest.fn(),
}));

jest.mock("@/lib/authNavigation", () => ({
  goToRegistro: jest.fn(),
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
});
