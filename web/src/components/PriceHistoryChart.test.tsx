import { describe, it, expect } from "vitest";
import { render, screen } from "@/test-utils";
import { PriceHistoryChart } from "./PriceHistoryChart";
import type { PriceHistorySeries } from "@/lib/priceHistory";

describe("PriceHistoryChart", () => {
  it("renders nothing when there are no series with points (empty state handled by the caller)", () => {
    const { container } = render(<PriceHistoryChart series={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when every series has zero points", () => {
    const series: PriceHistorySeries[] = [{ pharmacySlug: "cruz-verde", points: [] }];
    const { container } = render(<PriceHistoryChart series={series} />);
    expect(container.innerHTML).toBe("");
  });

  it("draws a single point as a circle, not a line, for a one-point series", () => {
    const series: PriceHistorySeries[] = [
      {
        pharmacySlug: "cruz-verde",
        points: [{ date: "2026-07-20", storePrice: 2990, effectivePrice: 2990, channels: [] }],
      },
    ];
    const { container } = render(<PriceHistoryChart series={series} />);

    expect(container.querySelector("circle")).toBeTruthy();
    expect(container.querySelector("polyline")).toBeFalsy();
  });

  it("draws a polyline for a series with multiple points", () => {
    const series: PriceHistorySeries[] = [
      {
        pharmacySlug: "cruz-verde",
        points: [
          { date: "2026-07-01", storePrice: 2990, effectivePrice: 2990, channels: [] },
          { date: "2026-07-20", storePrice: 2890, effectivePrice: 2890, channels: [] },
        ],
      },
    ];
    const { container } = render(<PriceHistoryChart series={series} />);

    expect(container.querySelector("polyline")).toBeTruthy();
  });

  it("renders a legend entry per pharmacy with points", () => {
    const series: PriceHistorySeries[] = [
      { pharmacySlug: "cruz-verde", points: [{ date: "2026-07-20", storePrice: 2990, effectivePrice: 2990, channels: [] }] },
      { pharmacySlug: "salcobrand", points: [{ date: "2026-07-20", storePrice: 3290, effectivePrice: 2290, channels: [] }] },
    ];
    render(<PriceHistoryChart series={series} />);

    expect(screen.getAllByText("Cruz Verde").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Salcobrand").length).toBeGreaterThan(0);
  });

  it("provides an accessible SVG role and an accessible textual table alternative", () => {
    const series: PriceHistorySeries[] = [
      {
        pharmacySlug: "cruz-verde",
        points: [
          { date: "2026-07-01", storePrice: 2990, effectivePrice: 2990, channels: [] },
          { date: "2026-07-20", storePrice: 2890, effectivePrice: 2890, channels: [] },
        ],
      },
    ];
    const { container } = render(<PriceHistoryChart series={series} />);

    expect(screen.getByRole("img")).toBeTruthy();
    expect(screen.getByText("Ver datos en formato de tabla")).toBeTruthy();

    const table = container.querySelector("table");
    expect(table).toBeTruthy();
    expect(table?.querySelectorAll("tbody tr").length).toBe(2);
  });

  it("omits series with zero points from the legend and table while still rendering the ones with data", () => {
    const series: PriceHistorySeries[] = [
      { pharmacySlug: "cruz-verde", points: [{ date: "2026-07-20", storePrice: 2990, effectivePrice: 2990, channels: [] }] },
      { pharmacySlug: "ahumada", points: [] },
    ];
    render(<PriceHistoryChart series={series} />);

    expect(screen.getAllByText("Cruz Verde").length).toBeGreaterThan(0);
    expect(screen.queryByText("Farmacias Ahumada")).toBeNull();
  });
});
