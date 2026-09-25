// Pure domain types for the estimation engine — deliberately decoupled from
// Prisma's generated types so the engine can be unit-tested with plain
// objects and reused outside a request/DB context.

export type MaterialCategory =
  | "FLOORING"
  | "WALL_TILE"
  | "BACKSPLASH"
  | "COUNTERTOP"
  | "CABINETRY"
  | "VANITY"
  | "PAINT"
  | "TRIM"
  | "TOILET"
  | "TUB_SHOWER"
  | "FIXTURE";

export type PriceUnit = "SQFT" | "LINEAR_FT" | "EACH" | "CUBIC_YARD";

export type LaborTaskType =
  | "DEMO_FLOORING"
  | "DEMO_TILE"
  | "DEMO_DRYWALL"
  | "DEMO_CABINETRY"
  | "DEMO_COUNTERTOP"
  | "DEMO_VANITY"
  | "DEMO_TOILET"
  | "DEMO_TUB_SHOWER"
  | "DEMO_FIXTURE"
  | "INSTALL_FLOORING"
  | "INSTALL_TILE"
  | "INSTALL_DRYWALL"
  | "INSTALL_PAINT"
  | "INSTALL_TRIM"
  | "INSTALL_CABINETRY"
  | "INSTALL_COUNTERTOP"
  | "INSTALL_VANITY"
  | "INSTALL_TOILET"
  | "INSTALL_TUB_SHOWER"
  | "INSTALL_FIXTURE";

export type DebrisType = "GENERAL_CONSTRUCTION" | "TILE_CONCRETE" | "MIXED";

export type EstimatePhase = "DEMOLITION" | "MATERIALS" | "INSTALLATION" | "DISPOSAL" | "OTHER";

export interface SpaceInput {
  id: string;
  name: string;
  lengthFt: number;
  widthFt: number;
  heightFt: number;
}

export interface MaterialPriceInput {
  id: string;
  category: MaterialCategory;
  name: string;
  unit: PriceUnit;
  unitCost: number;
  wasteFactorPercent: number;
  installLaborTask: LaborTaskType;
  demoLaborTask: LaborTaskType | null;
  debrisType: DebrisType | null;
}

export interface MaterialSelectionInput {
  id: string;
  spaceId: string | null;
  category: MaterialCategory;
  materialPrice: MaterialPriceInput;
  /** Overrides the auto-computed quantity (from space measurements) when set. */
  quantityOverride: number | null;
}

export interface LaborRateInput {
  taskType: LaborTaskType;
  unit: PriceUnit;
  hoursPerUnit: number;
  hourlyRate: number;
  debrisCubicYardsPerUnit: number;
}

export interface DisposalRateInput {
  debrisType: DebrisType;
  costPerCubicYard: number;
  dumpsterFlatFee: number;
}

export interface EstimateInput {
  spaces: SpaceInput[];
  selections: MaterialSelectionInput[];
  laborRates: LaborRateInput[];
  disposalRates: DisposalRateInput[];
  /** Contractor overhead/profit margin, as a percent of the materials+labor+disposal subtotal. */
  overheadPercent: number;
  /** Sales tax percent, applied to the whole subtotal (materials are taxable in CA; labor generally isn't, but we keep this simple and configurable — see README). */
  taxPercent: number;
}

export interface EstimateLineItemResult {
  phase: EstimatePhase;
  description: string;
  quantity: number;
  unit: PriceUnit;
  unitCost: number;
  totalCost: number;
}

export interface EstimateTotals {
  materials: number;
  demolition: number;
  installation: number;
  disposal: number;
  subtotal: number;
  overhead: number;
  tax: number;
  total: number;
}

export interface EstimateLaborHours {
  demolition: number;
  installation: number;
  total: number;
  /** total hours / 8, rounded up — a rough "working days on site" figure. */
  estimatedDays: number;
}

export interface EstimateResult {
  lineItems: EstimateLineItemResult[];
  totals: EstimateTotals;
  laborHours: EstimateLaborHours;
}

export class EstimateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EstimateValidationError";
  }
}
