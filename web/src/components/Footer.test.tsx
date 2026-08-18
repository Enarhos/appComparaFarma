import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@/test-utils";

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/donationsConfig");
});

describe("Footer — donaciones deshabilitadas (Production Closure, 2026-08-16)", () => {
  it("con WEB_DONATIONS_PAUSED=true (default real de producción) no muestra CTA ni mensaje público de pausa", async () => {
    const { Footer } = await import("./Footer");
    render(<Footer />);

    expect(screen.queryByRole("button", { name: "Apoya PreciosFarma" })).toBeNull();
    expect(screen.queryByText(/aportes están temporalmente pausados/i)).toBeNull();
    expect(screen.queryByText(/donaciones están pausadas/i)).toBeNull();
    expect(screen.queryByText(/donaciones temporalmente pausadas/i)).toBeNull();
  });

  it("con WEB_DONATIONS_PAUSED=false monta el DonationWidget normal (CTA visible)", async () => {
    vi.doMock("@/lib/donationsConfig", () => ({ WEB_DONATIONS_PAUSED: false }));
    vi.resetModules();
    const { Footer } = await import("./Footer");
    render(<Footer />);

    expect(screen.getByRole("button", { name: "Apoya PreciosFarma" })).toBeTruthy();
    expect(screen.queryByText(/aportes están temporalmente pausados/i)).toBeNull();
  });
});
