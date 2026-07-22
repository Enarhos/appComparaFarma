import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import { SearchBox } from "./SearchBox";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

beforeEach(() => {
  pushMock.mockClear();
});

describe("SearchBox", () => {
  it("does not navigate when the query has fewer than 2 characters", async () => {
    const user = userEvent.setup();
    render(<SearchBox />);

    await user.type(screen.getByLabelText("Buscar medicamento"), "a");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(pushMock).not.toHaveBeenCalled();
  });

  it("navigates to /buscar/{query} with a valid query", async () => {
    const user = userEvent.setup();
    render(<SearchBox />);

    await user.type(screen.getByLabelText("Buscar medicamento"), "Paracetamol");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(pushMock).toHaveBeenCalledWith("/buscar/Paracetamol");
  });

  it("pre-fills the input with initialQuery", () => {
    render(<SearchBox initialQuery="Ibuprofeno" />);

    const input = screen.getByLabelText("Buscar medicamento") as HTMLInputElement;
    expect(input.value).toBe("Ibuprofeno");
  });
});
