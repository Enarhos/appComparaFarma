import { describe, it, expect } from "vitest";
import { formatCLP } from "./format";

describe("formatCLP", () => {
  it("formats a four-digit price with the Chilean thousands separator", () => {
    expect(formatCLP(2990)).toBe("$2.990");
  });

  it("formats small amounts without a thousands separator", () => {
    expect(formatCLP(291)).toBe("$291");
  });

  it("formats zero correctly", () => {
    expect(formatCLP(0)).toBe("$0");
  });
});
