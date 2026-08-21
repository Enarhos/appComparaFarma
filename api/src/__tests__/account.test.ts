import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  reauthenticateWithPassword: vi.fn(),
  decodeJwtIssuedAt: vi.fn(),
  deleteAccount: vi.fn(),
}));

vi.mock("../lib/supabaseClient.js", () => ({
  supabase: { auth: { getUser: mocks.getUser } },
}));
vi.mock("../lib/reauth.js", () => ({
  reauthenticateWithPassword: mocks.reauthenticateWithPassword,
  decodeJwtIssuedAt: mocks.decodeJwtIssuedAt,
}));
vi.mock("../services/accountDeletionService.js", () => ({
  deleteAccount: mocks.deleteAccount,
}));

import { handleAccountRoute } from "../routes/account.js";

function makeReq(overrides: Partial<{ method: string; url: string; body: unknown; headers: Record<string, string> }> = {}) {
  return {
    method: overrides.method ?? "GET",
    url: overrides.url ?? "/api/account",
    body: overrides.body,
    headers: overrides.headers ?? {},
    socket: { remoteAddress: "127.0.0.1" },
  };
}

function makeRes() {
  const res = {
    statusCode: 200,
    body: undefined as string | undefined,
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      res.headers[name] = value;
    },
    end(body?: string) {
      res.body = body;
    },
  };
  return res;
}

function jsonBody(res: ReturnType<typeof makeRes>) {
  return JSON.parse(res.body ?? "null");
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("action=delete — autenticación", () => {
  it("sin Authorization header devuelve 401", async () => {
    const req = makeReq({ method: "POST", url: "/api/account?action=delete", body: {} });
    const res = makeRes();

    await handleAccountRoute(req, res);

    expect(res.statusCode).toBe(401);
    expect(mocks.deleteAccount).not.toHaveBeenCalled();
  });

  it("JWT inválido (Supabase no lo reconoce) devuelve 401", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: "invalid" } });
    const req = makeReq({ method: "POST", url: "/api/account?action=delete", headers: { authorization: "Bearer bad" }, body: {} });
    const res = makeRes();

    await handleAccountRoute(req, res);

    expect(res.statusCode).toBe(401);
  });

  it("un userId enviado en el body es ignorado — la identidad viene siempre del JWT (sección 5)", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-real", email: "real@x.cl", app_metadata: { provider: "email" } } }, error: null });
    mocks.reauthenticateWithPassword.mockResolvedValue("ok");
    mocks.deleteAccount.mockResolvedValue({ status: "deleted" });

    const req = makeReq({
      method: "POST",
      url: "/api/account?action=delete",
      headers: { authorization: "Bearer good" },
      body: { password: "correcta", userId: "user-suplantado", email: "otro@x.cl" },
    });
    const res = makeRes();

    await handleAccountRoute(req, res);

    expect(mocks.deleteAccount).toHaveBeenCalledWith("user-real", "real@x.cl");
  });

  it("cuenta en DELETION_PENDING SÍ puede volver a llamar a este endpoint — es el retry (CTO fix, sección B)", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1", email: "a@b.cl", app_metadata: { provider: "email" } } }, error: null });
    mocks.reauthenticateWithPassword.mockResolvedValue("ok");
    mocks.deleteAccount.mockResolvedValue({ status: "deleted" });

    const req = makeReq({ method: "POST", url: "/api/account?action=delete", headers: { authorization: "Bearer good" }, body: { password: "x" } });
    const res = makeRes();

    await handleAccountRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(mocks.deleteAccount).toHaveBeenCalledWith("user-1", "a@b.cl");
  });
});

describe("action=delete — reautenticación (sección 6)", () => {
  function authedReq(body: unknown) {
    return makeReq({ method: "POST", url: "/api/account?action=delete", headers: { authorization: "Bearer good" }, body });
  }

  it("cuenta email/password sin password en el body: 400, rechaza", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.cl", app_metadata: { provider: "email" } } }, error: null });
    const res = makeRes();

    await handleAccountRoute(authedReq({}), res);

    expect(res.statusCode).toBe(400);
    expect(mocks.deleteAccount).not.toHaveBeenCalled();
  });

  it("password incorrecta: 401, rechaza, y no se llama a deleteAccount", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.cl", app_metadata: { provider: "email" } } }, error: null });
    mocks.reauthenticateWithPassword.mockResolvedValue("invalid_credentials");
    const res = makeRes();

    await handleAccountRoute(authedReq({ password: "mala" }), res);

    expect(res.statusCode).toBe(401);
    expect(mocks.deleteAccount).not.toHaveBeenCalled();
  });

  it("reautenticación no configurada (sin SUPABASE_ANON_KEY): 503, rechaza", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.cl", app_metadata: { provider: "email" } } }, error: null });
    mocks.reauthenticateWithPassword.mockResolvedValue("not_configured");
    const res = makeRes();

    await handleAccountRoute(authedReq({ password: "x" }), res);

    expect(res.statusCode).toBe(503);
    expect(mocks.deleteAccount).not.toHaveBeenCalled();
  });

  it("cuenta OAuth con sesión reciente: procede sin pedir password", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.cl", app_metadata: { provider: "google" } } }, error: null });
    mocks.decodeJwtIssuedAt.mockReturnValue(Math.floor(Date.now() / 1000) - 60);
    mocks.deleteAccount.mockResolvedValue({ status: "deleted" });
    const res = makeRes();

    await handleAccountRoute(authedReq({}), res);

    expect(res.statusCode).toBe(200);
    expect(mocks.reauthenticateWithPassword).not.toHaveBeenCalled();
  });

  it("cuenta OAuth con sesión vieja: 401, rechaza", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.cl", app_metadata: { provider: "google" } } }, error: null });
    mocks.decodeJwtIssuedAt.mockReturnValue(Math.floor(Date.now() / 1000) - 60 * 60);
    const res = makeRes();

    await handleAccountRoute(authedReq({}), res);

    expect(res.statusCode).toBe(401);
    expect(mocks.deleteAccount).not.toHaveBeenCalled();
  });
});

describe("action=delete — resultados del servicio", () => {
  function authedReq(body: unknown = { password: "x" }) {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.cl", app_metadata: { provider: "email" } } }, error: null });
    mocks.reauthenticateWithPassword.mockResolvedValue("ok");
    return makeReq({ method: "POST", url: "/api/account?action=delete", headers: { authorization: "Bearer good" }, body });
  }

  it("éxito: 200 { ok: true }, sin ningún dato adicional (sección 11 — no exponer info sensible)", async () => {
    mocks.deleteAccount.mockResolvedValue({ status: "deleted" });
    const res = makeRes();

    await handleAccountRoute(authedReq(), res);

    expect(res.statusCode).toBe(200);
    expect(jsonBody(res)).toEqual({ ok: true });
  });

  it("suscripción activa bloqueante: 409 con código estable, sin exponer detalles internos", async () => {
    mocks.deleteAccount.mockResolvedValue({ status: "blocked_active_subscription", provider: "google_play" });
    const res = makeRes();

    await handleAccountRoute(authedReq(), res);

    expect(res.statusCode).toBe(409);
    expect(jsonBody(res).code).toBe("active_subscription_requires_cancellation");
  });

  it("fallo retryable: 500 con código estable, nunca expone el mensaje interno del error", async () => {
    mocks.deleteAccount.mockResolvedValue({ status: "cleanup_failed_retryable", error: "postgres: constraint xyz violated at internal_table" });
    const res = makeRes();

    await handleAccountRoute(authedReq(), res);

    expect(res.statusCode).toBe(500);
    const body = jsonBody(res);
    expect(body.code).toBe("cleanup_failed_retryable");
    expect(JSON.stringify(body)).not.toContain("internal_table");
  });

  it("nunca incluye SUPABASE_SECRET_KEY/service role en ninguna respuesta", async () => {
    process.env.SUPABASE_SECRET_KEY = "srv_secret_value_should_never_leak";
    mocks.deleteAccount.mockResolvedValue({ status: "deleted" });
    const res = makeRes();

    await handleAccountRoute(authedReq(), res);

    expect(res.body ?? "").not.toContain("srv_secret_value_should_never_leak");
    delete process.env.SUPABASE_SECRET_KEY;
  });
});

describe("action inválida", () => {
  it("GET sin action devuelve 400", async () => {
    const req = makeReq({ url: "/api/account" });
    const res = makeRes();

    await handleAccountRoute(req, res);

    expect(res.statusCode).toBe(400);
  });
});

describe("sección 11 — nada sensible llega a los logs", () => {
  it("la contraseña y el JWT nunca aparecen en console.warn/console.error durante un flujo completo", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.cl", app_metadata: { provider: "email" } } }, error: null });
    mocks.reauthenticateWithPassword.mockResolvedValue("invalid_credentials");

    const req = makeReq({
      method: "POST",
      url: "/api/account?action=delete",
      headers: { authorization: "Bearer un.jwt.secreto-de-prueba" },
      body: { password: "contraseña-super-secreta" },
    });
    await handleAccountRoute(req, makeRes());

    const allLoggedText = [...warnSpy.mock.calls, ...errorSpy.mock.calls].map((args) => JSON.stringify(args)).join(" ");
    expect(allLoggedText).not.toContain("contraseña-super-secreta");
    expect(allLoggedText).not.toContain("un.jwt.secreto-de-prueba");

    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
