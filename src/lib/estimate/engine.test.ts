import { describe, expect, it } from "vitest";
import { computeEstimate, WALL_OPENINGS_DEDUCTION } from "./engine";
import {
  DisposalRateInput,
  EstimateValidationError,
  LaborRateInput,
  MaterialPriceInput,
  MaterialSelectionInput,
  SpaceInput,
} from "./types";

const HOURLY_RATE = 85;

const laborRates: LaborRateInput[] = [
  { taskType: "DEMO_FLOORING", unit: "SQFT", hoursPerUnit: 0.05, hourlyRate: HOURLY_RATE, debrisCubicYardsPerUnit: 0.006 },
  { taskType: "INSTALL_FLOORING", unit: "SQFT", hoursPerUnit: 0.08, hourlyRate: HOURLY_RATE, debrisCubicYardsPerUnit: 0 },
  { taskType: "DEMO_TILE", unit: "SQFT", hoursPerUnit: 0.15, hourlyRate: HOURLY_RATE, debrisCubicYardsPerUnit: 0.01 },
  { taskType: "INSTALL_TILE", unit: "SQFT", hoursPerUnit: 0.3, hourlyRate: HOURLY_RATE, debrisCubicYardsPerUnit: 0 },
  { taskType: "INSTALL_PAINT", unit: "SQFT", hoursPerUnit: 0.03, hourlyRate: HOURLY_RATE, debrisCubicYardsPerUnit: 0 },
  { taskType: "DEMO_COUNTERTOP", unit: "LINEAR_FT", hoursPerUnit: 0.3, hourlyRate: HOURLY_RATE, debrisCubicYardsPerUnit: 0.08 },
  { taskType: "INSTALL_COUNTERTOP", unit: "LINEAR_FT", hoursPerUnit: 0.5, hourlyRate: HOURLY_RATE, debrisCubicYardsPerUnit: 0 },
];

const disposalRates: DisposalRateInput[] = [
  { debrisType: "GENERAL_CONSTRUCTION", costPerCubicYard: 75, dumpsterFlatFee: 150 },
  { debrisType: "TILE_CONCRETE", costPerCubicYard: 95, dumpsterFlatFee: 175 },
];

const space = (overrides: Partial<SpaceInput> = {}): SpaceInput => ({
  id: "space-1",
  name: "Main Bathroom",
  lengthFt: 10,
  widthFt: 10,
  heightFt: 8,
  ...overrides,
});

const lvpFlooring: MaterialPriceInput = {
  id: "mat-lvp",
  category: "FLOORING",
  name: "Luxury Vinyl Plank",
  unit: "SQFT",
  unitCost: 4.5,
  wasteFactorPercent: 10,
  installLaborTask: "INSTALL_FLOORING",
  demoLaborTask: "DEMO_FLOORING",
  debrisType: "GENERAL_CONSTRUCTION",
};

const tileFlooring: MaterialPriceInput = {
  id: "mat-tile",
  category: "FLOORING",
  name: "Porcelain Tile",
  unit: "SQFT",
  unitCost: 6.0,
  wasteFactorPercent: 12,
  installLaborTask: "INSTALL_TILE",
  demoLaborTask: "DEMO_TILE",
  debrisType: "TILE_CONCRETE",
};

const paint: MaterialPriceInput = {
  id: "mat-paint",
  category: "PAINT",
  name: "Interior Paint",
  unit: "SQFT",
  unitCost: 0.75,
  wasteFactorPercent: 5,
  installLaborTask: "INSTALL_PAINT",
  demoLaborTask: null,
  debrisType: null,
};

const countertop: MaterialPriceInput = {
  id: "mat-counter",
  category: "COUNTERTOP",
  name: "Quartz Countertop",
  unit: "LINEAR_FT",
  unitCost: 65,
  wasteFactorPercent: 15,
  installLaborTask: "INSTALL_COUNTERTOP",
  demoLaborTask: "DEMO_COUNTERTOP",
  debrisType: "TILE_CONCRETE",
};

const selection = (overrides: Partial<MaterialSelectionInput> & { materialPrice: MaterialPriceInput }): MaterialSelectionInput => ({
  id: "sel-1",
  spaceId: "space-1",
  category: overrides.materialPrice.category,
  quantityOverride: null,
  ...overrides,
});

describe("computeEstimate", () => {
  it("computes floor area automatically from room dimensions", () => {
    const result = computeEstimate({
      spaces: [space()],
      selections: [selection({ materialPrice: lvpFlooring })],
      laborRates,
      disposalRates,
      overheadPercent: 15,
      taxPercent: 8.75,
    });

    const materialsLine = result.lineItems.find((li) => li.phase === "MATERIALS")!;
    // 10x10 = 100 sqft, +10% waste = 110 sqft
    expect(materialsLine.quantity).toBe(110);
    expect(materialsLine.totalCost).toBeCloseTo(110 * 4.5, 2);

    const demoLine = result.lineItems.find((li) => li.phase === "DEMOLITION")!;
    expect(demoLine.quantity).toBe(100); // no waste factor on labor quantity
    expect(demoLine.totalCost).toBeCloseTo(100 * 0.05 * HOURLY_RATE, 2);

    const installLine = result.lineItems.find((li) => li.phase === "INSTALLATION")!;
    expect(installLine.totalCost).toBeCloseTo(100 * 0.08 * HOURLY_RATE, 2);

    expect(result.laborHours.demolition).toBeCloseTo(100 * 0.05, 2);
    expect(result.laborHours.installation).toBeCloseTo(100 * 0.08, 2);
    expect(result.laborHours.total).toBeCloseTo(100 * 0.05 + 100 * 0.08, 2);
  });

  it("generates a disposal line item sized from demo debris factor + flat haul fee", () => {
    const result = computeEstimate({
      spaces: [space()],
      selections: [selection({ materialPrice: lvpFlooring })],
      laborRates,
      disposalRates,
      overheadPercent: 0,
      taxPercent: 0,
    });

    const disposalLine = result.lineItems.find((li) => li.phase === "DISPOSAL")!;
    // 100 sqft demo * 0.006 cy/sqft = 0.6 cy
    expect(disposalLine.quantity).toBeCloseTo(0.6, 2);
    expect(disposalLine.totalCost).toBeCloseTo(0.6 * 75 + 150, 2);
  });

  it("aggregates debris from multiple selections of the same debris type into one disposal line", () => {
    const result = computeEstimate({
      spaces: [space()],
      selections: [
        selection({ id: "sel-floor", materialPrice: tileFlooring }),
        selection({ id: "sel-counter", materialPrice: countertop, quantityOverride: 10 }),
      ],
      laborRates,
      disposalRates,
      overheadPercent: 0,
      taxPercent: 0,
    });

    const disposalLines = result.lineItems.filter((li) => li.phase === "DISPOSAL");
    // both selections produce TILE_CONCRETE debris -> should be merged into a single line
    expect(disposalLines).toHaveLength(1);
    expect(disposalLines[0]!.description).toContain("Tile & concrete");

    // flooring: 100 sqft * 0.01 = 1 cy; countertop: 10 linft * 0.08 = 0.8 cy => 1.8 cy total
    expect(disposalLines[0]!.quantity).toBeCloseTo(1.8, 2);
  });

  it("uses an explicit quantityOverride instead of deriving from the space", () => {
    const result = computeEstimate({
      spaces: [space()],
      selections: [selection({ materialPrice: lvpFlooring, quantityOverride: 42 })],
      laborRates,
      disposalRates,
      overheadPercent: 0,
      taxPercent: 0,
    });

    const materialsLine = result.lineItems.find((li) => li.phase === "MATERIALS")!;
    expect(materialsLine.quantity).toBeCloseTo(42 * 1.1, 2);
  });

  it("skips demolition and disposal entirely for materials with no demo task (e.g. paint)", () => {
    const result = computeEstimate({
      spaces: [space()],
      selections: [selection({ materialPrice: paint })],
      laborRates,
      disposalRates,
      overheadPercent: 0,
      taxPercent: 0,
    });

    expect(result.lineItems.some((li) => li.phase === "DEMOLITION")).toBe(false);
    expect(result.lineItems.some((li) => li.phase === "DISPOSAL")).toBe(false);

    const wallArea = 2 * (10 + 10) * 8 * WALL_OPENINGS_DEDUCTION;
    const materialsLine = result.lineItems.find((li) => li.phase === "MATERIALS")!;
    expect(materialsLine.quantity).toBeCloseTo(wallArea * 1.05, 2);
  });

  it("throws a clear validation error when a category with no sane default is missing a quantity", () => {
    expect(() =>
      computeEstimate({
        spaces: [space()],
        selections: [selection({ materialPrice: countertop })],
        laborRates,
        disposalRates,
        overheadPercent: 0,
        taxPercent: 0,
      }),
    ).toThrow(EstimateValidationError);
  });

  it("throws when a selection references a space not included in the quote", () => {
    expect(() =>
      computeEstimate({
        spaces: [],
        selections: [selection({ materialPrice: lvpFlooring, spaceId: "missing-space" })],
        laborRates,
        disposalRates,
        overheadPercent: 0,
        taxPercent: 0,
      }),
    ).toThrow(EstimateValidationError);
  });

  it("throws when no labor rate is configured for a required task", () => {
    expect(() =>
      computeEstimate({
        spaces: [space()],
        selections: [selection({ materialPrice: lvpFlooring })],
        laborRates: [],
        disposalRates,
        overheadPercent: 0,
        taxPercent: 0,
      }),
    ).toThrow(EstimateValidationError);
  });

  it("applies overhead on the subtotal and tax on subtotal+overhead, compounding correctly", () => {
    const result = computeEstimate({
      spaces: [space()],
      selections: [selection({ materialPrice: lvpFlooring })],
      laborRates,
      disposalRates,
      overheadPercent: 15,
      taxPercent: 10,
    });

    const { subtotal, overhead, tax, total } = result.totals;
    expect(overhead).toBeCloseTo(subtotal * 0.15, 2);
    expect(tax).toBeCloseTo((subtotal + overhead) * 0.1, 2);
    expect(total).toBeCloseTo(subtotal + overhead + tax, 2);
  });

  it("rounds estimated on-site days up to the nearest whole day", () => {
    const result = computeEstimate({
      spaces: [space({ lengthFt: 1, widthFt: 1, heightFt: 8 })],
      selections: [selection({ materialPrice: lvpFlooring })],
      laborRates,
      disposalRates,
      overheadPercent: 0,
      taxPercent: 0,
    });

    // tiny room => small fraction of an hour => still rounds up to 1 day
    expect(result.laborHours.total).toBeGreaterThan(0);
    expect(result.laborHours.total).toBeLessThan(8);
    expect(result.laborHours.estimatedDays).toBe(1);
  });
});
