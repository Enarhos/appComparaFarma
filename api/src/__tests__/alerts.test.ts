import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  sendEmail: vi.fn(),
  createAlert: vi.fn(),
  confirmAlert: vi.fn(),
  unsubscribeAlert: vi.fn(),
  getActiveAlerts: vi.fn(),
  markTriggered: vi.fn(),
  touchLastChecked: vi.fn(),
  searchMedications: vi.fn(),
}));

vi.mock("../middleware/rateLimit.js", () => ({ consumeRateLimit: mocks.consumeRateLimit }));
vi.mock("../lib/email.js", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("../lib/emailAlertsDb.js", () => ({
  createAlert: mocks.createAlert,
  confirmAlert: mocks.confirmAlert,
  unsubscribeAlert: mocks.unsubscribeAlert,
  getActiveAlerts: mocks.getActiveAlerts,
  markTriggered: mocks.markTriggered,
  touchLastChecked: mocks.touchLastChecked,
}));
vi.mock("../services/searchService.js", () => ({ searchMedications: mocks.searchMedications }));

import { handleAlertsRoute } from "../routes/alerts.js";

function makeReq(overrides: Partial<{ method: string; url: string; body: unknown }> = {}) {
  return {
    method: overrides.method ?? "GET",
    url: overrides.url ?? "/api/alerts",
    body: overrides.body,
    headers: { host: "comparafarma-api.vercel.app" },
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

beforeEach(() => {
  vi.resetAllMocks();
  mocks.consumeRateLimit.mockResolvedValue(true);
  process.env.CRON_SECRET = "s3cr3t";
});

describe("handleAlertsRoute — crear alerta (POST)", () => {
  it("rechaza email inválido con 400", async () => {
    const req = makeReq({ method: "POST", body: { email: "no-es-email", matchKey: "x", canonicalName: "X", targetPrice: 100 } });
    const res = makeRes();

    await handleAlertsRoute(req, res);

    expect(res.statusCode).toBe(400);
    expect(mocks.createAlert).not.toHaveBeenCalled();
  });

  it("rechaza targetPrice <= 0 con 400", async () => {
    const req = makeReq({ method: "POST", body: { email: "a@b.com", matchKey: "x", canonicalName: "X", targetPrice: 0 } });
    const res = makeRes();

    await handleAlertsRoute(req, res);

    expect(res.statusCode).toBe(400);
  });

  it("respeta el rate limit y responde 429", async () => {
    mocks.consumeRateLimit.mockResolvedValue(false);
    const req = makeReq({ method: "POST", body: { email: "a@b.com", matchKey: "x", canonicalName: "X", targetPrice: 100 } });
    const res = makeRes();

    await handleAlertsRoute(req, res);

    expect(res.statusCode).toBe(429);
    expect(mocks.createAlert).not.toHaveBeenCalled();
  });

  it("crea la alerta y envía el email de confirmación con el link correcto", async () => {
    mocks.createAlert.mockResolvedValue({ token: "tok-123" });
    const req = makeReq({
      method: "POST",
      body: { email: "a@b.com", matchKey: "paracetamol|500mg", canonicalName: "Paracetamol 500 mg", targetPrice: 900 },
    });
    const res = makeRes();

    await handleAlertsRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(mocks.createAlert).toHaveBeenCalledWith({
      email: "a@b.com",
      matchKey: "paracetamol|500mg",
      canonicalName: "Paracetamol 500 mg",
      targetPrice: 900,
    });
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      "a@b.com",
      expect.stringContaining("Paracetamol 500 mg"),
      expect.stringContaining("https://comparafarma-api.vercel.app/api/alerts?action=confirm&token=tok-123")
    );
  });

  it("responde 503 si createAlert falla (Supabase caído)", async () => {
    mocks.createAlert.mockResolvedValue(null);
    const req = makeReq({ method: "POST", body: { email: "a@b.com", matchKey: "x", canonicalName: "X", targetPrice: 100 } });
    const res = makeRes();

    await handleAlertsRoute(req, res);

    expect(res.statusCode).toBe(503);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
});

describe("handleAlertsRoute — confirm / unsubscribe (GET)", () => {
  it("confirm sin token responde 400", async () => {
    const req = makeReq({ url: "/api/alerts?action=confirm" });
    const res = makeRes();
    await handleAlertsRoute(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("confirm con token válido responde 200 y delega a confirmAlert", async () => {
    mocks.confirmAlert.mockResolvedValue("confirmed");
    const req = makeReq({ url: "/api/alerts?action=confirm&token=tok-1" });
    const res = makeRes();

    await handleAlertsRoute(req, res);

    expect(mocks.confirmAlert).toHaveBeenCalledWith("tok-1");
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("Alerta confirmada");
  });

  it("confirm con token no encontrado responde 404", async () => {
    mocks.confirmAlert.mockResolvedValue("not_found");
    const req = makeReq({ url: "/api/alerts?action=confirm&token=tok-x" });
    const res = makeRes();
    await handleAlertsRoute(req, res);
    expect(res.statusCode).toBe(404);
  });

  it("unsubscribe con token válido responde 200 y delega a unsubscribeAlert", async () => {
    mocks.unsubscribeAlert.mockResolvedValue("unsubscribed");
    const req = makeReq({ url: "/api/alerts?action=unsubscribe&token=tok-1" });
    const res = makeRes();

    await handleAlertsRoute(req, res);

    expect(mocks.unsubscribeAlert).toHaveBeenCalledWith("tok-1");
    expect(res.body).toContain("Alerta cancelada");
  });
});

describe("handleAlertsRoute — check (cron)", () => {
  it("sin CRON_SECRET configurado, rechaza con 401 incluso con secret vacío", async () => {
    delete process.env.CRON_SECRET;
    const req = makeReq({ url: "/api/alerts?action=check&secret=" });
    const res = makeRes();
    await handleAlertsRoute(req, res);
    expect(res.statusCode).toBe(401);
  });

  it("con secret incorrecto responde 401", async () => {
    const req = makeReq({ url: "/api/alerts?action=check&secret=incorrecto" });
    const res = makeRes();
    await handleAlertsRoute(req, res);
    expect(res.statusCode).toBe(401);
    expect(mocks.getActiveAlerts).not.toHaveBeenCalled();
  });

  it("con secret correcto y sin alertas activas, responde checked:0", async () => {
    mocks.getActiveAlerts.mockResolvedValue([]);
    const req = makeReq({ url: "/api/alerts?action=check&secret=s3cr3t" });
    const res = makeRes();

    await handleAlertsRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body ?? "{}")).toEqual({ checked: 0, triggered: 0 });
  });

  it("agrupa alertas por canonicalName y busca una sola vez por grupo", async () => {
    mocks.getActiveAlerts.mockResolvedValue([
      { id: 1, email: "a@b.com", matchKey: "paracetamol|500mg", canonicalName: "Paracetamol", targetPrice: 1000, status: "active", token: "t1" },
      { id: 2, email: "c@d.com", matchKey: "paracetamol|500mg", canonicalName: "Paracetamol", targetPrice: 1000, status: "active", token: "t2" },
    ]);
    mocks.searchMedications.mockResolvedValue([
      { matchKey: "paracetamol|500mg", bestPrice: 900, bestPharmacy: "cruz-verde" },
    ]);

    const req = makeReq({ url: "/api/alerts?action=check&secret=s3cr3t" });
    const res = makeRes();

    await handleAlertsRoute(req, res);

    expect(mocks.searchMedications).toHaveBeenCalledTimes(1);
    expect(mocks.markTriggered).toHaveBeenCalledTimes(2);
    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
    expect(JSON.parse(res.body ?? "{}")).toEqual({ checked: 2, triggered: 2 });
  });

  it("no dispara la alerta si el precio no bajó lo suficiente", async () => {
    mocks.getActiveAlerts.mockResolvedValue([
      { id: 1, email: "a@b.com", matchKey: "paracetamol|500mg", canonicalName: "Paracetamol", targetPrice: 500, status: "active", token: "t1" },
    ]);
    mocks.searchMedications.mockResolvedValue([
      { matchKey: "paracetamol|500mg", bestPrice: 900, bestPharmacy: "cruz-verde" },
    ]);

    const req = makeReq({ url: "/api/alerts?action=check&secret=s3cr3t" });
    const res = makeRes();

    await handleAlertsRoute(req, res);

    expect(mocks.markTriggered).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.touchLastChecked).toHaveBeenCalledWith([1]);
  });

  it("no lanza si searchMedications falla para un grupo, y sigue con los demás", async () => {
    mocks.getActiveAlerts.mockResolvedValue([
      { id: 1, email: "a@b.com", matchKey: "x", canonicalName: "Roto", targetPrice: 100, status: "active", token: "t1" },
    ]);
    mocks.searchMedications.mockRejectedValue(new Error("boom"));

    const req = makeReq({ url: "/api/alerts?action=check&secret=s3cr3t" });
    const res = makeRes();

    await expect(handleAlertsRoute(req, res)).resolves.toBeUndefined();
    expect(res.statusCode).toBe(200);
  });
});
