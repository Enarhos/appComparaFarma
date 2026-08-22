import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({ signInWithPassword: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ auth: { signInWithPassword: mocks.signInWithPassword } })),
}));

import { reauthenticateWithPassword, decodeJwtIssuedAt } from "../lib/reauth.js";

beforeEach(() => {
  vi.resetAllMocks();
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
});

afterEach(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
});

describe("reauthenticateWithPassword", () => {
  it("sin SUPABASE_ANON_KEY configurado: not_configured, nunca lanza", async () => {
    process.env.SUPABASE_URL = "https://x.supabase.co";
    await expect(reauthenticateWithPassword("a@b.cl", "x")).resolves.toBe("not_configured");
  });

  it("credenciales correctas: ok", async () => {
    process.env.SUPABASE_URL = "https://x.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key";
    mocks.signInWithPassword.mockResolvedValue({ data: { session: { access_token: "tok" } }, error: null });

    await expect(reauthenticateWithPassword("a@b.cl", "correcta")).resolves.toBe("ok");
  });

  it("credenciales incorrectas: invalid_credentials", async () => {
    process.env.SUPABASE_URL = "https://x.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key";
    mocks.signInWithPassword.mockResolvedValue({ data: { session: null }, error: { message: "Invalid login credentials" } });

    await expect(reauthenticateWithPassword("a@b.cl", "mala")).resolves.toBe("invalid_credentials");
  });

  it("si signInWithPassword lanza, se trata como invalid_credentials (nunca propaga la excepción)", async () => {
    process.env.SUPABASE_URL = "https://x.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key";
    mocks.signInWithPassword.mockRejectedValue(new Error("network down"));

    await expect(reauthenticateWithPassword("a@b.cl", "x")).resolves.toBe("invalid_credentials");
  });
});

describe("decodeJwtIssuedAt", () => {
  function makeJwt(payload: Record<string, unknown>): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${header}.${body}.signature-no-importa-no-se-reverifica`;
  }

  it("lee iat de un JWT bien formado", () => {
    const token = makeJwt({ iat: 1700000000, sub: "u1" });
    expect(decodeJwtIssuedAt(token)).toBe(1700000000);
  });

  it("null si el token está malformado", () => {
    expect(decodeJwtIssuedAt("no-es-un-jwt")).toBeNull();
  });

  it("null si no tiene iat", () => {
    const token = makeJwt({ sub: "u1" });
    expect(decodeJwtIssuedAt(token)).toBeNull();
  });
});
