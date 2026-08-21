import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  findActiveSubscription: vi.fn(),
  markDeletionPending: vi.fn(),
  clearDeletionPending: vi.fn(),
  markDeletionFailed: vi.fn(),
  deleteAccountData: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock("../lib/subscriptionsDb.js", () => ({
  findActiveSubscription: mocks.findActiveSubscription,
}));
vi.mock("../lib/accountDeletionDb.js", () => ({
  markDeletionPending: mocks.markDeletionPending,
  clearDeletionPending: mocks.clearDeletionPending,
  markDeletionFailed: mocks.markDeletionFailed,
  deleteAccountData: mocks.deleteAccountData,
}));
vi.mock("../lib/supabaseClient.js", () => ({
  supabase: { auth: { admin: { deleteUser: mocks.deleteUser } } },
}));

import { deleteAccount } from "../services/accountDeletionService.js";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.deleteAccountData.mockResolvedValue({ ok: true });
  mocks.deleteUser.mockResolvedValue({ error: null });
  mocks.findActiveSubscription.mockResolvedValue(null);
});

describe("deleteAccount — transición ACTIVE -> DELETION_PENDING", () => {
  it("siempre marca pending antes de cualquier otro paso", async () => {
    await deleteAccount("u1", "a@b.cl");
    expect(mocks.markDeletionPending).toHaveBeenCalledWith("u1", "a@b.cl");
  });
});

describe("deleteAccount — suscripciones (sección 9)", () => {
  it("bloquea y revierte pending si hay suscripción activa de google_play", async () => {
    mocks.findActiveSubscription.mockResolvedValue({ id: 1, userId: "u1", planId: "p", status: "active", provider: "google_play", providerReference: "tok", startedAt: null, currentPeriodEnd: null, canceledAt: null });

    const outcome = await deleteAccount("u1", "a@b.cl");

    expect(outcome).toEqual({ status: "blocked_active_subscription", provider: "google_play" });
    expect(mocks.clearDeletionPending).toHaveBeenCalledWith("u1");
    expect(mocks.deleteAccountData).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("bloquea también para flow", async () => {
    mocks.findActiveSubscription.mockResolvedValue({ id: 1, userId: "u1", planId: "p", status: "active", provider: "flow", providerReference: "tok", startedAt: null, currentPeriodEnd: null, canceledAt: null });
    const outcome = await deleteAccount("u1", "a@b.cl");
    expect(outcome.status).toBe("blocked_active_subscription");
  });

  it("NO bloquea para una suscripción manual (cortesía) — se cierra localmente", async () => {
    mocks.findActiveSubscription.mockResolvedValue({ id: 1, userId: "u1", planId: "cortesia", status: "active", provider: "manual", providerReference: null, startedAt: null, currentPeriodEnd: null, canceledAt: null });

    const outcome = await deleteAccount("u1", "a@b.cl");

    expect(outcome.status).toBe("deleted");
    expect(mocks.deleteAccountData).toHaveBeenCalled();
  });

  it("sin suscripción alguna, procede directo", async () => {
    const outcome = await deleteAccount("u1", "a@b.cl");
    expect(outcome.status).toBe("deleted");
  });
});

describe("deleteAccount — fallo de limpieza SQL", () => {
  it("si falla la limpieza pública, Auth NO se elimina y la cuenta queda retryable", async () => {
    mocks.deleteAccountData.mockResolvedValue({ ok: false, error: "constraint violation" });

    const outcome = await deleteAccount("u1", "a@b.cl");

    expect(outcome).toEqual({ status: "cleanup_failed_retryable", error: "constraint violation" });
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(mocks.markDeletionFailed).toHaveBeenCalledWith("u1", "constraint violation", []);
    // La fila de control NO se borra en este camino — debe quedar pending para permitir retry.
    expect(mocks.clearDeletionPending).not.toHaveBeenCalled();
  });
});

describe("deleteAccount — fallo de Auth Admin API tras limpieza exitosa", () => {
  it("queda DELETION_PENDING/retryable, marcando que public_cleanup ya se completó", async () => {
    mocks.deleteUser.mockResolvedValue({ error: { message: "internal_error" } });

    const outcome = await deleteAccount("u1", "a@b.cl");

    expect(outcome).toEqual({ status: "auth_deletion_failed_retryable", error: "internal_error" });
    expect(mocks.markDeletionFailed).toHaveBeenCalledWith("u1", "internal_error", ["public_cleanup"]);
    expect(mocks.clearDeletionPending).not.toHaveBeenCalled();
  });

  it("reintenta la llamada a Admin API hasta 3 veces antes de darse por vencido", async () => {
    mocks.deleteUser
      .mockResolvedValueOnce({ error: { message: "timeout" } })
      .mockResolvedValueOnce({ error: { message: "timeout" } })
      .mockResolvedValueOnce({ error: null });

    const outcome = await deleteAccount("u1", "a@b.cl");

    expect(mocks.deleteUser).toHaveBeenCalledTimes(3);
    expect(outcome.status).toBe("deleted");
  });
});

describe("deleteAccount — idempotencia: usuario ya eliminado", () => {
  it("un error 'User not found' de Admin API se trata como éxito, no como fallo", async () => {
    mocks.deleteUser.mockResolvedValue({ error: { message: "User not found" } });

    const outcome = await deleteAccount("u1", "a@b.cl");

    expect(outcome).toEqual({ status: "deleted" });
    expect(mocks.clearDeletionPending).toHaveBeenCalledWith("u1");
  });
});

describe("deleteAccount — éxito completo", () => {
  it("llama a Admin API con el user_id correcto y borra el registro de control al final", async () => {
    const outcome = await deleteAccount("u1", "a@b.cl");

    expect(mocks.deleteUser).toHaveBeenCalledWith("u1");
    expect(outcome).toEqual({ status: "deleted" });
    expect(mocks.clearDeletionPending).toHaveBeenCalledWith("u1");
  });

  it("un retry después de un éxito previo completa correctamente (idempotente de punta a punta)", async () => {
    const first = await deleteAccount("u1", "a@b.cl");
    // Simula que en el segundo intento el usuario ya no existe en ningún lado.
    mocks.deleteAccountData.mockResolvedValue({ ok: true });
    mocks.deleteUser.mockResolvedValue({ error: { message: "User not found" } });
    const second = await deleteAccount("u1", "a@b.cl");

    expect(first).toEqual({ status: "deleted" });
    expect(second).toEqual({ status: "deleted" });
  });
});
