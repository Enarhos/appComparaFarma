import { describe, it, expect } from "vitest";
import { formatCLP, formatPercent, formatDateShort } from "./format";

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

describe("formatPercent", () => {
  it("prefixes a positive change with a plus sign", () => {
    expect(formatPercent(8.1)).toBe("+8.1%");
  });

  it("keeps the native minus sign for a negative change", () => {
    expect(formatPercent(-12.4)).toBe("-12.4%");
  });

  it("formats zero without a sign", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });

  it("rounds to one decimal place", () => {
    expect(formatPercent(8.149)).toBe("+8.1%");
  });
});

describe("formatDateShort", () => {
  it("formats a date-only string as day + short month, without shifting to the previous day", () => {
    // Regression: parsear "YYYY-MM-DD" como UTC (new Date("2026-07-20")) puede
    // mostrar 19 de julio en zonas horarias con offset negativo — por eso
    // formatDateShort agrega "T00:00:00" para forzar hora local.
    const formatted = formatDateShort("2026-07-20");
    expect(formatted).toContain("20");
    expect(formatted.toLowerCase()).toContain("jul");
  });
});
