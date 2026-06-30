import { describe, expect, it } from "vitest";
import { matchKey } from "../matching.js";

const FIXTURES = [
  "Paracetamol 500 mg x 16",
  "Trio-Val 80mg x 30",
  "Co-Amoxiclav 500mg 21 Cápsulas",
  "Tri Fen 10mg",
  "Tapsin Plus Día 16 Comprimidos",
  "Tapsin Plus Noche 16 Comprimidos",
  "Amoxicilina Potásica 0.5g Cápsulas",
  "Salbutamol 100mcg Inhalador",
] as const;

describe("matchKey — contract snapshots", () => {
  it("produce claves estables para nombres de medicamentos reales", () => {
    const result = FIXTURES.map((name) => ({ name, key: matchKey(name) }));
    expect(result).toMatchSnapshot();
  });
});
