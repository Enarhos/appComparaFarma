/**
 * CF-SEARCH-011 S0 — determinismo e independencia de los identificadores v2.
 *
 * Estos tests son el contrato de identidad del motor v2 (§6 del ticket):
 * misma entidad → mismo ID; entidad distinta → ID distinto; independiente de la
 * consulta, del ranking, del precio, de la farmacia y del orden de llegada.
 */
import { describe, expect, it } from "vitest";
import { canonicalize, conceptSignature, offerSignature } from "../searchV2/canonicalize.js";
import { canonicalizeOffer } from "../searchV2/canonicalAttributes.js";
import {
  provisionalKey,
  resolveBySubsumption,
  signatureText,
  subsumes,
  type Signature,
} from "../searchV2/canonicalIdentity.js";
import type { PharmacySlug } from "../types.js";
import type { RawOfferInput } from "../searchV2/canonicalTypes.js";

const offer = (
  rawName: string,
  pharmacy: PharmacySlug = "cruz-verde",
  extra: Partial<RawOfferInput> = {}
): RawOfferInput => ({
  pharmacy,
  rawName,
  price: { store: 1000, online: null, cmr: null, sbpay: null, effective: 1000 },
  stock: true,
  url: null,
  capturedAt: "2026-09-01T00:00:00.000Z",
  ...extra,
});

const conceptOf = (graph: ReturnType<typeof canonicalize>, name: string) =>
  graph.offers.find((o) => o.rawName === name)!.provisionalConceptKey;
const productOf = (graph: ReturnType<typeof canonicalize>, name: string) =>
  graph.offers.find((o) => o.rawName === name)!.provisionalProductKey;

// ---------------------------------------------------------------------------

describe("provisionalKey", () => {
  it("es determinista: la misma firma produce siempre el mismo ID", () => {
    expect(provisionalKey("C", "ing=ambroxol|conc=conc:ratio:6mg/ml|form=fluid-oral")).toBe(
      provisionalKey("C", "ing=ambroxol|conc=conc:ratio:6mg/ml|form=fluid-oral")
    );
  });

  it("firmas distintas producen IDs distintos", () => {
    expect(provisionalKey("C", "ing=ambroxol|conc=conc:ratio:6mg/ml|form=fluid-oral")).not.toBe(
      provisionalKey("C", "ing=ambroxol|conc=conc:ratio:3mg/ml|form=fluid-oral")
    );
  });

  it("el prefijo separa los espacios de identificadores del EDM", () => {
    expect(provisionalKey("C", "x").startsWith("PROV-C-")).toBe(true);
    expect(provisionalKey("P", "x").startsWith("PROV-P-")).toBe(true);
    expect(provisionalKey("M", "x").startsWith("PROV-M-")).toBe(true);
    expect(provisionalKey("O", "x").startsWith("PROV-O-")).toBe(true);
    // Los cuatro espacios son disjuntos incluso ignorando el prefijo textual:
    // el prefijo participa del hash.
    const body = (id: string) => id.slice("CFM-X-".length);
    expect(body(provisionalKey("C", "x"))).not.toBe(body(provisionalKey("P", "x")));
    expect(body(provisionalKey("M", "x"))).not.toBe(body(provisionalKey("O", "x")));
  });

  it("no colisiona sobre un volumen de firmas del orden del corpus real", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 20000; i++) ids.add(provisionalKey("C", `ing=molecula${i}|conc=conc:?|form=?`));
    expect(ids.size).toBe(20000);
  });
});

describe("subsumes — dirección y contradicción", () => {
  const axis = (name: string, segment: string, known: boolean) => ({ name, segment, known });
  const sig = (...axes: ReturnType<typeof axis>[]): Signature => ({ axes });

  it("una firma parcial se subsume bajo una completa compatible", () => {
    const weak = sig(axis("a", "x", true), axis("b", "?", false));
    const strong = sig(axis("a", "x", true), axis("b", "y", true));
    expect(subsumes(weak, strong)).toBe(true);
    expect(subsumes(strong, weak)).toBe(false);
  });

  it("una contradicción en cualquier eje impide la subsunción", () => {
    const weak = sig(axis("a", "x", true), axis("b", "?", false));
    const strong = sig(axis("a", "z", true), axis("b", "y", true));
    expect(subsumes(weak, strong)).toBe(false);
  });

  it("dos firmas idénticas no se subsumen mutuamente", () => {
    const one = sig(axis("a", "x", true), axis("b", "y", true));
    expect(subsumes(one, one)).toBe(false);
  });
});

describe("resolveBySubsumption — reglas de asignación", () => {
  const axis = (name: string, segment: string, known: boolean) => ({ name, segment, known });

  it("asigna la firma parcial cuando hay EXACTAMENTE una anfitriona", () => {
    const resolved = resolveBySubsumption("C", [
      { signature: { axes: [axis("a", "x", true), axis("b", "y", true)] }, payload: "host" },
      { signature: { axes: [axis("a", "x", true), axis("b", "?", false)] }, payload: "weak" },
    ]);
    const host = resolved.find((r) => r.payload === "host")!;
    const weak = resolved.find((r) => r.payload === "weak")!;
    expect(weak.key).toBe(host.key);
    expect(weak.trace.kind).toBe("subsumed");
    expect(weak.trace.confidence).toBe("medium");
  });

  it("NO elige cuando hay dos anfitrionas compatibles: la ambigüedad se aísla", () => {
    const resolved = resolveBySubsumption("C", [
      { signature: { axes: [axis("a", "x", true), axis("b", "y1", true)] }, payload: "h1" },
      { signature: { axes: [axis("a", "x", true), axis("b", "y2", true)] }, payload: "h2" },
      { signature: { axes: [axis("a", "x", true), axis("b", "?", false)] }, payload: "weak" },
    ]);
    const weak = resolved.find((r) => r.payload === "weak")!;
    expect(weak.trace.kind).toBe("ambiguous");
    expect(weak.key).not.toBe(resolved.find((r) => r.payload === "h1")!.key);
    expect(weak.key).not.toBe(resolved.find((r) => r.payload === "h2")!.key);
  });

  it("una firma parcial sin anfitriona conserva identidad propia", () => {
    const resolved = resolveBySubsumption("C", [
      { signature: { axes: [axis("a", "x", true), axis("b", "?", false)] }, payload: "alone" },
    ]);
    expect(resolved[0]!.trace.kind).toBe("isolated");
    expect(resolved[0]!.trace.unknownAxes).toEqual(["b"]);
  });

  it("resuelve la cadena A ⊂ B ⊂ C al destino maximal, no a la ambigüedad", () => {
    const resolved = resolveBySubsumption("C", [
      { signature: { axes: [axis("a", "x", true), axis("b", "y", true)] }, payload: "full" },
      { signature: { axes: [axis("a", "x", true), axis("b", "?", false)] }, payload: "mid" },
      { signature: { axes: [axis("a", "?", false), axis("b", "?", false)] }, payload: "empty" },
    ]);
    const full = resolved.find((r) => r.payload === "full")!;
    expect(resolved.find((r) => r.payload === "mid")!.key).toBe(full.key);
    expect(resolved.find((r) => r.payload === "empty")!.key).toBe(full.key);
  });

  it("el resultado no depende del orden de entrada", () => {
    const items = [
      { signature: { axes: [axis("a", "x", true), axis("b", "y", true)] }, payload: "host" },
      { signature: { axes: [axis("a", "x", true), axis("b", "?", false)] }, payload: "weak" },
      { signature: { axes: [axis("a", "z", true), axis("b", "y", true)] }, payload: "other" },
    ];
    const forward = resolveBySubsumption("C", items);
    const backward = resolveBySubsumption("C", [...items].reverse());
    for (const payload of ["host", "weak", "other"]) {
      expect(forward.find((r) => r.payload === payload)!.key).toBe(
        backward.find((r) => r.payload === payload)!.key
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Contrato de identidad sobre nombres reales
// ---------------------------------------------------------------------------

describe("identidad v2 — independencia (§6 del ticket)", () => {
  const NAMES = [
    "Ambroxol 30mg/5ml Jarabe 100ml",
    "Ambroxol 15 mg/5mL Jarabe 100 mL",
    "Losartan Potasico 50 mg x 30 comprimidos",
    "Tapsin Forte x 30 comprimidos",
  ];

  it("misma entidad ⇒ mismo provisionalConceptKey, sin importar la farmacia", () => {
    const graph = canonicalize([
      offer("Ambroxol 30mg/5ml Jarabe 100ml", "cruz-verde"),
      offer("Ambroxol 30 mg/5 mL Jarabe 100 mL", "salcobrand"),
      offer("Ambroxol 600 mg / 100 ml Jarabe", "ahumada"),
    ]);
    const ids = new Set(graph.offers.map((o) => o.provisionalConceptKey));
    expect(ids.size).toBe(1);
  });

  it("entidad distinta ⇒ provisionalConceptKey distinto", () => {
    const graph = canonicalize([
      offer("Ambroxol 30mg/5ml Jarabe 100ml"),
      offer("Ambroxol 15 mg/5mL Jarabe 100 mL"),
    ]);
    expect(conceptOf(graph, "Ambroxol 30mg/5ml Jarabe 100ml")).not.toBe(
      conceptOf(graph, "Ambroxol 15 mg/5mL Jarabe 100 mL")
    );
  });

  it("el orden de llegada de las farmacias no altera ningún identificador", () => {
    const inputs = NAMES.map((n, i) =>
      offer(n, (["cruz-verde", "salcobrand", "ahumada", "farmex"] as PharmacySlug[])[i]!)
    );
    const forward = canonicalize(inputs);
    const backward = canonicalize([...inputs].reverse());
    for (const name of NAMES) {
      expect(conceptOf(forward, name)).toBe(conceptOf(backward, name));
      expect(productOf(forward, name)).toBe(productOf(backward, name));
    }
  });

  it("el precio no participa de ninguna identidad", () => {
    const cheap = canonicalize([offer("Ambroxol 30mg/5ml Jarabe 100ml")]);
    const expensive = canonicalize([
      {
        ...offer("Ambroxol 30mg/5ml Jarabe 100ml"),
        price: { store: 99999, online: 88888, cmr: 77777, sbpay: null, effective: 77777 },
      },
    ]);
    expect(cheap.offers[0]!.provisionalConceptKey).toBe(expensive.offers[0]!.provisionalConceptKey);
    expect(cheap.offers[0]!.provisionalProductKey).toBe(expensive.offers[0]!.provisionalProductKey);
    expect(cheap.offers[0]!.provisionalOfferKey).toBe(expensive.offers[0]!.provisionalOfferKey);
  });

  it("el stock y el instante de captura no participan de la identidad de la oferta", () => {
    const a = canonicalize([offer("Ambroxol 30mg/5ml Jarabe 100ml")]);
    const b = canonicalize([
      { ...offer("Ambroxol 30mg/5ml Jarabe 100ml"), stock: false, capturedAt: "2030-01-01T00:00:00Z" },
    ]);
    expect(a.offers[0]!.provisionalOfferKey).toBe(b.offers[0]!.provisionalOfferKey);
  });

  it("la firma del concepto NO contiene marca, laboratorio, farmacia ni consulta", () => {
    const withBrand = conceptSignature(
      canonicalizeOffer(offer("Muxol Ambroxol 30mg/5ml Jarabe 100ml", "cruz-verde"))
    );
    const generic = conceptSignature(
      canonicalizeOffer(
        offer("Ambroxol 30mg/5ml Jarabe 100ml", "farmex", { structuredManufacturer: "Eurolab" })
      )
    );
    expect(signatureText(withBrand)).toBe(signatureText(generic));
    expect(signatureText(withBrand)).not.toMatch(/muxol|eurolab|cruz-verde|farmex/i);
  });

  it("la identidad de la observación no depende del producto al que se resuelva", () => {
    const alone = canonicalize([offer("Ambroxol 30mg/5ml Jarabe 100ml", "ahumada")]);
    const withOthers = canonicalize([
      offer("Ambroxol 30mg/5ml Jarabe 100ml", "ahumada"),
      offer("Ambroxol 30 mg/5 mL Jarabe 100 mL", "cruz-verde"),
      offer("Muxol Adulto Ambroxol 30mg/5ml jarabe 100ml", "salcobrand"),
    ]);
    expect(alone.offers[0]!.provisionalOfferKey).toBe(
      withOthers.offers.find((o) => o.pharmacy === "ahumada")!.provisionalOfferKey
    );
  });

  it("dos ofertas distintas de la misma farmacia nunca comparten provisionalOfferKey", () => {
    expect(offerSignature(offer("Ambroxol 30mg/5ml Jarabe 100ml", "ahumada"))).not.toBe(
      offerSignature(offer("Ambroxol 15mg/5ml Jarabe 100ml", "ahumada"))
    );
  });
});
