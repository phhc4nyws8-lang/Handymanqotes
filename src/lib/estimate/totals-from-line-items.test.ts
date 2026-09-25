import { describe, expect, it } from "vitest";
import { totalsFromLineItems } from "./totals-from-line-items";

describe("totalsFromLineItems", () => {
  it("sums each phase and compounds overhead then tax", () => {
    const lineItems = [
      { phase: "MATERIALS", totalCost: 500 },
      { phase: "DEMOLITION", totalCost: 200 },
      { phase: "INSTALLATION", totalCost: 300 },
      { phase: "DISPOSAL", totalCost: 100 },
    ];

    const totals = totalsFromLineItems(lineItems, 15, 10);

    expect(totals.subtotal).toBe(1100);
    expect(totals.overhead).toBeCloseTo(165, 2);
    expect(totals.tax).toBeCloseTo((1100 + 165) * 0.1, 2);
    expect(totals.total).toBeCloseTo(1100 + 165 + (1100 + 165) * 0.1, 2);
  });

  it("returns zeros for an empty line item list", () => {
    const totals = totalsFromLineItems([], 15, 8.75);
    expect(totals.total).toBe(0);
  });
});
