import { describe, expect, it } from "vitest";
import { buildQuoteEmailHtml, buildQuoteEmailText } from "./template";
import { QuoteEmailData } from "./types";

const baseData: QuoteEmailData = {
  toEmail: "customer@example.com",
  toName: "Jane Customer",
  quoteNumber: "Q-1001",
  projectTypeLabel: "Bathroom Remodel",
  region: "Northern California",
  contractorName: "Mike's Handyman Services",
  lineItems: [
    { phase: "DEMOLITION", description: "Demo & haul-out: Main Bathroom — Ceramic Tile", quantity: 100, unit: "SQFT", unitCost: 12.75, totalCost: 1275 },
    { phase: "MATERIALS", description: "Main Bathroom — Porcelain Wood-Look Tile", quantity: 112, unit: "SQFT", unitCost: 6, totalCost: 672 },
    { phase: "INSTALLATION", description: "Install: Main Bathroom — Porcelain Wood-Look Tile", quantity: 100, unit: "SQFT", unitCost: 25.5, totalCost: 2550 },
    { phase: "DISPOSAL", description: "Tile & concrete debris hauling & disposal", quantity: 1, unit: "CUBIC_YARD", unitCost: 95, totalCost: 270 },
  ],
  totals: { materials: 672, demolition: 1275, installation: 2550, disposal: 270, subtotal: 4767, overhead: 715.05, tax: 479.13, total: 5961.18 },
  laborHours: { demolition: 15, installation: 30, total: 45, estimatedDays: 6 },
  photos: [{ spaceName: "Main Bathroom", beforeUrl: "https://example.com/before.jpg", afterUrl: "https://example.com/after.jpg", afterIsDemo: true }],
  validUntil: new Date("2026-12-01"),
  notes: "Price assumes no hidden water damage found once demo starts.",
};

describe("buildQuoteEmailHtml", () => {
  it("groups line items under their phase headings", () => {
    const html = buildQuoteEmailHtml(baseData);
    expect(html).toContain("Demolition &amp; Haul-Out");
    expect(html).toContain("Materials");
    expect(html).toContain("Installation");
    expect(html).toContain("Debris Disposal");
    expect(html).toContain("Porcelain Wood-Look Tile");
  });

  it("shows the total and estimated labor hours", () => {
    const html = buildQuoteEmailHtml(baseData);
    expect(html).toContain("$5,961.18");
    expect(html).toContain("45 hours");
    expect(html).toContain("6 working days");
  });

  it("flags a demo-mode after photo instead of presenting it as a real render", () => {
    const html = buildQuoteEmailHtml(baseData);
    expect(html).toContain("Demo preview");
  });

  it("does not flag a real (non-demo) after photo", () => {
    const html = buildQuoteEmailHtml({ ...baseData, photos: [{ ...baseData.photos[0]!, afterIsDemo: false }] });
    expect(html).not.toContain("Demo preview");
  });

  it("escapes customer-controlled text to avoid HTML injection", () => {
    const html = buildQuoteEmailHtml({ ...baseData, toName: '<script>alert(1)</script>' });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("buildQuoteEmailText", () => {
  it("includes every line item and the total", () => {
    const text = buildQuoteEmailText(baseData);
    expect(text).toContain("Demolition & Haul-Out:");
    expect(text).toContain("Porcelain Wood-Look Tile");
    expect(text).toContain("Total: $5,961.18");
  });
});
