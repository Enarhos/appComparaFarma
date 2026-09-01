import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MedicationResult } from "@comparafarma/domain";

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
const permanentRedirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({
  notFound: () => notFoundMock(),
  permanentRedirect: (url: string) => permanentRedirectMock(url),
}));

const resolveMedicationBySlugMock = vi.fn();

vi.mock("@/lib/resolveMedication", () => ({
  resolveMedicationBySlug: (...args: unknown[]) => resolveMedicationBySlugMock(...args),
}));

const getPriceHistoryMock = vi.fn();

vi.mock("@/lib/priceHistory", () => ({
  getPriceHistory: (...args: unknown[]) => getPriceHistoryMock(...args),
}));

function emptyHistory(matchKey: string) {
  return {
    matchKey,
    canonicalName: null,
    from: "",
    to: "",
    series: [],
    summary: {
      latestBestPrice: null,
      latestBestPharmacy: null,
      lowestRecordedPrice: null,
      highestRecordedPrice: null,
      change7dPercent: null,
      change30dPercent: null,
    },
  };
}

import MedicationDetailPage, { generateMetadata } from "./page";

const CANONICAL_SLUG = "paracetamol-500-mg-16-comprimidos-realhash1234";

function makeMedication(overrides: Partial<MedicationResult> = {}): MedicationResult {
  return {
    matchKey: "paracetamol|500mg|16",
    canonicalName: "Paracetamol 500 mg 16 comprimidos",
    laboratory: "Andrómaco",
    brand: null,
    manufacturer: "Andrómaco",
    activeIngredient: null,
    brandSource: "unknown",
    isBioequivalent: true,
    bestPrice: 291,
    bestPharmacy: "easyfarma",
    imageUrl: null,
    presentationKey: "paracetamol|500mg|16|bio:true|brand:unknown",
    prices: [
      {
        pharmacySlug: "easyfarma",
        pharmacyName: "EasyFarma",
        productName: "Paracetamol 500 mg 16 comprimidos",
        channels: { store: 690, online: null, cmr: null, sbpay: null, effective: 291 },
        hasStock: true,
        hasOnlineDelivery: true,
        onlineUrl: "https://comparafarma-api.vercel.app/api/go?slug=easyfarma&matchKey=paracetamol%7C500mg%7C16",
        imageUrl: null,
        fetchedAt: "2026-07-20T00:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  resolveMedicationBySlugMock.mockReset();
  notFoundMock.mockClear();
  permanentRedirectMock.mockClear();
  getPriceHistoryMock.mockReset();
  getPriceHistoryMock.mockImplementation((matchKey: string) => Promise.resolve(emptyHistory(matchKey)));
});

describe("MedicationDetailPage", () => {
  it("calls notFound() when the slug does not resolve to any medication", async () => {
    resolveMedicationBySlugMock.mockResolvedValue({ status: "not-found" });

    await expect(
      MedicationDetailPage({ params: Promise.resolve({ slug: "no-existe-abc123" }) })
    ).rejects.toThrow();

    expect(notFoundMock).toHaveBeenCalled();
    expect(permanentRedirectMock).not.toHaveBeenCalled();
  });

  it("QA-01 — responde 404 (no un 500) y sin elegir un ganador cuando la resolución es ambigua", async () => {
    const medication = makeMedication();
    resolveMedicationBySlugMock.mockResolvedValue({ status: "ambiguous", matches: [medication, medication] });

    // notFound() de Next también corta el render lanzando (NEXT_NOT_FOUND), pero
    // es un 404 controlado: antes de este fix la página lanzaba un Error propio,
    // es decir un HTTP 500 en una URL potencialmente indexada.
    await expect(
      MedicationDetailPage({ params: Promise.resolve({ slug: CANONICAL_SLUG }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalled();
    expect(permanentRedirectMock).not.toHaveBeenCalled();
  });

  it("redirects (308/permanent) to the canonical slug when the requested slug uses a legacy hash scheme (needsRedirect: true)", async () => {
    const medication = makeMedication();
    resolveMedicationBySlugMock.mockResolvedValue({
      status: "ok",
      medication,
      canonicalSlug: CANONICAL_SLUG,
      needsRedirect: true,
    });

    await expect(
      MedicationDetailPage({ params: Promise.resolve({ slug: "paracetamol-500mg-nombre-viejo" }) })
    ).rejects.toThrow();

    expect(permanentRedirectMock).toHaveBeenCalledWith(`/medicamento/${CANONICAL_SLUG}`);
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("renders without redirecting when the requested slug is already canonical", async () => {
    const medication = makeMedication();
    resolveMedicationBySlugMock.mockResolvedValue({
      status: "ok",
      medication,
      canonicalSlug: CANONICAL_SLUG,
      needsRedirect: false,
    });

    const result = await MedicationDetailPage({ params: Promise.resolve({ slug: CANONICAL_SLUG }) });

    expect(permanentRedirectMock).not.toHaveBeenCalled();
    expect(notFoundMock).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it("bugfix OPKO_DETAIL_REDIRECT_LOOP — does NOT redirect when canonicalSlug differs from the requested slug but needsRedirect is false (cosmetic canonicalName drift, same Gen 3 hash)", async () => {
    const medication = makeMedication();
    // canonicalSlug distinto del slug pedido, pero needsRedirect: false ->
    // esto modela el caso real Omeprazol/OPKO (mismo presentationKey, texto
    // legible distinto entre búsquedas). Antes del fix, page.tsx comparaba
    // canonicalSlug !== slug y redirigía siempre, produciendo un loop infinito.
    resolveMedicationBySlugMock.mockResolvedValue({
      status: "ok",
      medication,
      canonicalSlug: "omeprazol-20-mg-x-30-comprimidos-opko-abcd1234",
      needsRedirect: false,
    });

    const result = await MedicationDetailPage({
      params: Promise.resolve({ slug: "omeprazol-20-mg-30-capsulas-opko-abcd1234" }),
    });

    expect(permanentRedirectMock).not.toHaveBeenCalled();
    expect(notFoundMock).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });
});

describe("generateMetadata", () => {
  it("sets alternates.canonical to the canonical slug, not the requested one", async () => {
    const medication = makeMedication();
    resolveMedicationBySlugMock.mockResolvedValue({ status: "ok", medication, canonicalSlug: CANONICAL_SLUG, needsRedirect: false });

    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "un-slug-viejo-distinto" }) });

    expect(metadata.alternates?.canonical).toContain(`/medicamento/${CANONICAL_SLUG}`);
    expect(String(metadata.alternates?.canonical)).not.toContain("un-slug-viejo-distinto");
  });

  it("sets robots to noindex,follow when the medication resolves", async () => {
    const medication = makeMedication();
    resolveMedicationBySlugMock.mockResolvedValue({ status: "ok", medication, canonicalSlug: CANONICAL_SLUG, needsRedirect: false });

    const metadata = await generateMetadata({ params: Promise.resolve({ slug: CANONICAL_SLUG }) });

    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it("sets robots to noindex,follow even when the medication is not found", async () => {
    resolveMedicationBySlugMock.mockResolvedValue({ status: "not-found" });

    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "no-existe-abc123" }) });

    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
