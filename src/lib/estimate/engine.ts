import {
  DisposalRateInput,
  EstimateInput,
  EstimateLaborHours,
  EstimateLineItemResult,
  EstimateResult,
  EstimateTotals,
  EstimateValidationError,
  LaborRateInput,
  MaterialCategory,
  SpaceInput,
} from "./types";

/**
 * Fraction of gross wall area (perimeter * height) assumed to be openable
 * surface after deducting a typical door + window allowance. This is a
 * blended estimate, not a per-room takeoff — the contractor can always
 * override a selection's quantity directly for an exact number.
 */
export const WALL_OPENINGS_DEDUCTION = 0.85;

function floorAreaSqFt(space: SpaceInput): number {
  return space.lengthFt * space.widthFt;
}

function wallAreaSqFt(space: SpaceInput): number {
  const perimeter = 2 * (space.lengthFt + space.widthFt);
  return perimeter * space.heightFt * WALL_OPENINGS_DEDUCTION;
}

function perimeterLinearFt(space: SpaceInput): number {
  return 2 * (space.lengthFt + space.widthFt);
}

/**
 * Categories where a quantity can be reasonably derived from room
 * measurements alone. Categories left out (BACKSPLASH, COUNTERTOP,
 * CABINETRY, FIXTURE) vary too much by layout to guess safely — those
 * selections require an explicit `quantityOverride`, and the engine throws
 * a clear validation error if one is missing rather than silently guessing.
 */
function computeAutoQuantity(category: MaterialCategory, space: SpaceInput | null): number | null {
  if (!space) return null;
  switch (category) {
    case "FLOORING":
      return floorAreaSqFt(space);
    case "WALL_TILE":
    case "PAINT":
      return wallAreaSqFt(space);
    case "TRIM":
      return perimeterLinearFt(space);
    case "VANITY":
    case "TOILET":
    case "TUB_SHOWER":
      return 1;
    case "BACKSPLASH":
    case "COUNTERTOP":
    case "CABINETRY":
    case "FIXTURE":
      return null;
  }
}

function findLaborRate(laborRates: LaborRateInput[], taskType: string): LaborRateInput {
  const rate = laborRates.find((r) => r.taskType === taskType);
  if (!rate) {
    throw new EstimateValidationError(`No labor rate configured for task "${taskType}". Add one to the price book.`);
  }
  return rate;
}

function findDisposalRate(disposalRates: DisposalRateInput[], debrisType: string): DisposalRateInput {
  const rate = disposalRates.find((r) => r.debrisType === debrisType);
  if (!rate) {
    throw new EstimateValidationError(`No disposal rate configured for debris type "${debrisType}". Add one to the price book.`);
  }
  return rate;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Turns a set of rooms/spaces + selected materials into an itemized,
 * phase-by-phase cost breakdown (demolition, materials, installation,
 * disposal) plus total labor hours — the core of every quote.
 */
export function computeEstimate(input: EstimateInput): EstimateResult {
  const spacesById = new Map(input.spaces.map((s) => [s.id, s]));
  const lineItems: EstimateLineItemResult[] = [];

  let demolitionHours = 0;
  let installationHours = 0;
  const debrisCubicYardsByType = new Map<string, number>();

  for (const selection of input.selections) {
    const space = selection.spaceId ? (spacesById.get(selection.spaceId) ?? null) : null;
    if (selection.spaceId && !space) {
      throw new EstimateValidationError(`Selection "${selection.materialPrice.name}" references a space that isn't in this quote.`);
    }

    const quantity = selection.quantityOverride ?? computeAutoQuantity(selection.category, space);
    if (quantity === null || quantity <= 0) {
      throw new EstimateValidationError(
        `"${selection.materialPrice.name}" (${selection.category}) needs an explicit quantity — it can't be derived from room measurements alone. Set quantityOverride on this selection.`,
      );
    }

    const label = space ? `${space.name} — ${selection.materialPrice.name}` : selection.materialPrice.name;
    const mp = selection.materialPrice;

    // Materials
    const materialQuantity = quantity * (1 + mp.wasteFactorPercent / 100);
    lineItems.push({
      phase: "MATERIALS",
      description: label,
      quantity: round2(materialQuantity),
      unit: mp.unit,
      unitCost: mp.unitCost,
      totalCost: round2(materialQuantity * mp.unitCost),
    });

    // Demolition (only if this material is replacing something)
    if (mp.demoLaborTask) {
      const demoRate = findLaborRate(input.laborRates, mp.demoLaborTask);
      const hours = quantity * demoRate.hoursPerUnit;
      demolitionHours += hours;
      lineItems.push({
        phase: "DEMOLITION",
        description: `Demo & haul-out: ${label}`,
        quantity: round2(quantity),
        unit: mp.unit,
        unitCost: round2(demoRate.hoursPerUnit * demoRate.hourlyRate),
        totalCost: round2(hours * demoRate.hourlyRate),
      });

      if (mp.debrisType) {
        const cubicYards = quantity * demoRate.debrisCubicYardsPerUnit;
        debrisCubicYardsByType.set(mp.debrisType, (debrisCubicYardsByType.get(mp.debrisType) ?? 0) + cubicYards);
      }
    }

    // Installation
    const installRate = findLaborRate(input.laborRates, mp.installLaborTask);
    const installHours = quantity * installRate.hoursPerUnit;
    installationHours += installHours;
    lineItems.push({
      phase: "INSTALLATION",
      description: `Install: ${label}`,
      quantity: round2(quantity),
      unit: mp.unit,
      unitCost: round2(installRate.hoursPerUnit * installRate.hourlyRate),
      totalCost: round2(installHours * installRate.hourlyRate),
    });
  }

  // Disposal — one line per debris stream actually generated, each carrying
  // its own dumpster/haul flat fee (different debris types often can't share
  // a bin at NorCal transfer stations).
  for (const [debrisType, cubicYardsRaw] of debrisCubicYardsByType.entries()) {
    if (cubicYardsRaw <= 0) continue;
    const disposalRate = findDisposalRate(input.disposalRates, debrisType);
    const cubicYards = round2(cubicYardsRaw);
    lineItems.push({
      phase: "DISPOSAL",
      description: `${debrisTypeLabel(debrisType)} debris hauling & disposal`,
      quantity: cubicYards,
      unit: "CUBIC_YARD",
      unitCost: disposalRate.costPerCubicYard,
      totalCost: round2(cubicYards * disposalRate.costPerCubicYard + disposalRate.dumpsterFlatFee),
    });
  }

  const totals = computeTotals(lineItems, input.overheadPercent, input.taxPercent);
  const laborHours = computeLaborHours(demolitionHours, installationHours);

  return { lineItems, totals, laborHours };
}

function debrisTypeLabel(debrisType: string): string {
  switch (debrisType) {
    case "GENERAL_CONSTRUCTION":
      return "General construction";
    case "TILE_CONCRETE":
      return "Tile & concrete";
    case "MIXED":
      return "Mixed";
    default:
      return debrisType;
  }
}

function computeTotals(lineItems: EstimateLineItemResult[], overheadPercent: number, taxPercent: number): EstimateTotals {
  const sum = (phase: EstimateLineItemResult["phase"]) =>
    round2(lineItems.filter((li) => li.phase === phase).reduce((acc, li) => acc + li.totalCost, 0));

  const materials = sum("MATERIALS");
  const demolition = sum("DEMOLITION");
  const installation = sum("INSTALLATION");
  const disposal = sum("DISPOSAL");

  const subtotal = round2(materials + demolition + installation + disposal);
  const overhead = round2(subtotal * (overheadPercent / 100));
  const tax = round2((subtotal + overhead) * (taxPercent / 100));
  const total = round2(subtotal + overhead + tax);

  return { materials, demolition, installation, disposal, subtotal, overhead, tax, total };
}

function computeLaborHours(demolitionHours: number, installationHours: number): EstimateLaborHours {
  const total = demolitionHours + installationHours;
  return {
    demolition: round2(demolitionHours),
    installation: round2(installationHours),
    total: round2(total),
    estimatedDays: Math.ceil(total / 8),
  };
}
