import { describe, expect, it } from "vitest";
import { parseAraucoMedResponse } from "../clients/araucomed.js";

const SAMPLE_RESPONSE = {
  products: [
    {
      id_product: 123,
      name: "Paracetamol 500mg x16",
      price_amount: 1490,
      manufacturer_name: "Laboratorio Chile",
      url: "https://farmacia.araucomed.com/medicamentos/paracetamol-500mg.html",
      description_short: "<p>Paracetamol 500 mg</p>",
      active: 1,
      cover: {
        bySize: {
          home_default: {
            url: "https://farmacia.araucomed.com/123-home_default/paracetamol.jpg",
          },
        },
      },
    },
    {
      id_product: 456,
      name: "Ibuprofeno 400mg x10",
      price_amount: 2990,
      manufacturer_name: "Seven Pharma",
      url: "https://farmacia.araucomed.com/medicamentos/ibuprofeno-400mg.html",
      description_short: "<p>Ibuprofeno 400 mg</p>",
      active: 0,
      cover: null,
    },
  ],
};

describe("parseAraucoMedResponse", () => {
  it("parses name, price, url, image, lab and stock from JSON", () => {
    const results = parseAraucoMedResponse(SAMPLE_RESPONSE);
    expect(results).toHaveLength(1); // active=0 is filtered out

    const [first] = results;
    expect(first.name).toBe("Paracetamol 500mg x16");
    expect(first.price).toBe(1490);
    expect(first.laboratory).toBe("Laboratorio Chile");
    expect(first.onlineUrl).toBe("https://farmacia.araucomed.com/medicamentos/paracetamol-500mg.html");
    expect(first.imageUrl).toContain("home_default");
    expect(first.hasStock).toBe(true);
  });

  it("ignores products with price 0", () => {
    const data = {
      products: [
        {
          id_product: 789,
          name: "Sin precio",
          price_amount: 0,
          manufacturer_name: null,
          url: "/x",
          description_short: "",
          active: 1,
          cover: null,
        },
      ],
    };
    expect(parseAraucoMedResponse(data)).toHaveLength(0);
  });

  it("detects bioequivalent from name", () => {
    const data = {
      products: [
        {
          id_product: 999,
          name: "Paracetamol Bioequivalente 500mg x20",
          price_amount: 800,
          manufacturer_name: null,
          url: "/bio",
          description_short: "",
          active: 1,
          cover: null,
        },
      ],
    };
    const [result] = parseAraucoMedResponse(data);
    expect(result.isBioequivalent).toBe(true);
  });

  it("handles missing cover gracefully", () => {
    const data = {
      products: [
        {
          id_product: 111,
          name: "Aspirina 100mg x20",
          price_amount: 600,
          manufacturer_name: null,
          url: "/aspirina",
          description_short: "",
          active: 1,
          cover: null,
        },
      ],
    };
    const [result] = parseAraucoMedResponse(data);
    expect(result.imageUrl).toBeNull();
  });
});
