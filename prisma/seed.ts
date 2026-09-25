import { PrismaClient, MaterialCategory, PriceUnit, LaborTaskType, DebrisType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Northern California price book (seed data)
//
// These are realistic mid-2020s Northern California averages for mid-grade
// materials, meant as a sane starting point — NOT a live feed (no public API
// for retailer/supplier pricing exists). The contractor should update
// `unitCost` here whenever real supplier quotes move, and `lastUpdated`
// tracks how stale a number is. Edit this file (or, once built out, the
// admin UI) rather than expecting these numbers to update themselves.
//
// `installLaborTask`/`demoLaborTask`/`debrisType` tie each specific material
// to the right labor rate and disposal category — set per material (not
// derived from `category` alone) since, e.g., LVP vs. tile flooring have very
// different demo/install labor and debris profiles.
// ---------------------------------------------------------------------------

const materialPrices: Array<{
  category: MaterialCategory;
  name: string;
  description: string;
  unit: PriceUnit;
  unitCost: number;
  wasteFactorPercent: number;
  imageDescriptor: string;
  installLaborTask: LaborTaskType;
  demoLaborTask: LaborTaskType | null;
  debrisType: DebrisType | null;
}> = [
  // Flooring
  {
    category: MaterialCategory.FLOORING,
    name: "Luxury Vinyl Plank (mid-grade)",
    description: "Waterproof click-lock LVP, 20mil wear layer",
    unit: PriceUnit.SQFT,
    unitCost: 4.5,
    wasteFactorPercent: 10,
    imageDescriptor: "warm mid-toned oak-look luxury vinyl plank flooring, matte finish, laid in a straight running pattern",
    installLaborTask: LaborTaskType.INSTALL_FLOORING,
    demoLaborTask: LaborTaskType.DEMO_FLOORING,
    debrisType: DebrisType.GENERAL_CONSTRUCTION,
  },
  {
    category: MaterialCategory.FLOORING,
    name: "Porcelain Wood-Look Tile",
    description: "6x36 porcelain plank tile, rectified edge",
    unit: PriceUnit.SQFT,
    unitCost: 6.0,
    wasteFactorPercent: 12,
    imageDescriptor: "matte porcelain wood-look plank tile flooring, light walnut tone, tight grout lines",
    installLaborTask: LaborTaskType.INSTALL_TILE,
    demoLaborTask: LaborTaskType.DEMO_TILE,
    debrisType: DebrisType.TILE_CONCRETE,
  },
  {
    category: MaterialCategory.FLOORING,
    name: "Engineered Hardwood",
    description: "3/4in engineered white oak, site-finished",
    unit: PriceUnit.SQFT,
    unitCost: 8.5,
    wasteFactorPercent: 10,
    imageDescriptor: "natural white oak engineered hardwood flooring, satin finish, wide plank",
    installLaborTask: LaborTaskType.INSTALL_FLOORING,
    demoLaborTask: LaborTaskType.DEMO_FLOORING,
    debrisType: DebrisType.GENERAL_CONSTRUCTION,
  },
  {
    category: MaterialCategory.FLOORING,
    name: "Ceramic Tile (basic)",
    description: "12x24 ceramic floor tile",
    unit: PriceUnit.SQFT,
    unitCost: 3.5,
    wasteFactorPercent: 12,
    imageDescriptor: "light gray ceramic floor tile, 12x24 modern layout, matte finish",
    installLaborTask: LaborTaskType.INSTALL_TILE,
    demoLaborTask: LaborTaskType.DEMO_TILE,
    debrisType: DebrisType.TILE_CONCRETE,
  },

  // Wall tile
  {
    category: MaterialCategory.WALL_TILE,
    name: "Ceramic Subway Tile",
    description: "3x6 white ceramic subway, classic offset",
    unit: PriceUnit.SQFT,
    unitCost: 5.0,
    wasteFactorPercent: 12,
    imageDescriptor: "crisp white 3x6 ceramic subway tile, glossy finish, classic brick offset pattern, thin gray grout lines",
    installLaborTask: LaborTaskType.INSTALL_TILE,
    demoLaborTask: LaborTaskType.DEMO_TILE,
    debrisType: DebrisType.TILE_CONCRETE,
  },
  {
    category: MaterialCategory.WALL_TILE,
    name: "Porcelain Large-Format",
    description: "24x48 porcelain wall tile, minimal grout",
    unit: PriceUnit.SQFT,
    unitCost: 7.5,
    wasteFactorPercent: 12,
    imageDescriptor: "large-format light gray porcelain wall tile with subtle veining, minimal grout lines, modern",
    installLaborTask: LaborTaskType.INSTALL_TILE,
    demoLaborTask: LaborTaskType.DEMO_TILE,
    debrisType: DebrisType.TILE_CONCRETE,
  },
  {
    category: MaterialCategory.WALL_TILE,
    name: "Natural Stone Look Marble",
    description: "12x24 marble-look porcelain, polished",
    unit: PriceUnit.SQFT,
    unitCost: 12.0,
    wasteFactorPercent: 15,
    imageDescriptor: "polished white marble-look porcelain tile with soft gray veining, luxurious bathroom wall finish",
    installLaborTask: LaborTaskType.INSTALL_TILE,
    demoLaborTask: LaborTaskType.DEMO_TILE,
    debrisType: DebrisType.TILE_CONCRETE,
  },

  // Backsplash
  {
    category: MaterialCategory.BACKSPLASH,
    name: "Ceramic Subway Backsplash",
    description: "3x6 ceramic backsplash tile",
    unit: PriceUnit.SQFT,
    unitCost: 6.0,
    wasteFactorPercent: 15,
    imageDescriptor: "white 3x6 ceramic subway tile backsplash, glossy, classic offset pattern behind the counter",
    installLaborTask: LaborTaskType.INSTALL_TILE,
    demoLaborTask: LaborTaskType.DEMO_TILE,
    debrisType: DebrisType.TILE_CONCRETE,
  },
  {
    category: MaterialCategory.BACKSPLASH,
    name: "Glass Mosaic Backsplash",
    description: "1x1 glass mosaic sheet",
    unit: PriceUnit.SQFT,
    unitCost: 14.0,
    wasteFactorPercent: 15,
    imageDescriptor: "iridescent glass mosaic tile backsplash, small 1x1 tiles, subtle blue-green shimmer",
    installLaborTask: LaborTaskType.INSTALL_TILE,
    demoLaborTask: LaborTaskType.DEMO_TILE,
    debrisType: DebrisType.TILE_CONCRETE,
  },

  // Countertop
  {
    category: MaterialCategory.COUNTERTOP,
    name: "Laminate Countertop",
    description: "Post-form laminate, standard edge",
    unit: PriceUnit.SQFT,
    unitCost: 22.0,
    wasteFactorPercent: 10,
    imageDescriptor: "light gray woodgrain-pattern laminate countertop, standard bullnose edge",
    installLaborTask: LaborTaskType.INSTALL_COUNTERTOP,
    demoLaborTask: LaborTaskType.DEMO_COUNTERTOP,
    debrisType: DebrisType.GENERAL_CONSTRUCTION,
  },
  {
    category: MaterialCategory.COUNTERTOP,
    name: "Quartz Countertop (mid-grade)",
    description: "2cm engineered quartz slab, eased edge",
    unit: PriceUnit.SQFT,
    unitCost: 65.0,
    wasteFactorPercent: 15,
    imageDescriptor: "white quartz countertop with fine gray veining, polished finish, eased edge",
    installLaborTask: LaborTaskType.INSTALL_COUNTERTOP,
    demoLaborTask: LaborTaskType.DEMO_COUNTERTOP,
    debrisType: DebrisType.TILE_CONCRETE,
  },
  {
    category: MaterialCategory.COUNTERTOP,
    name: "Granite Countertop",
    description: "2cm natural granite slab, polished",
    unit: PriceUnit.SQFT,
    unitCost: 55.0,
    wasteFactorPercent: 15,
    imageDescriptor: "speckled dark granite countertop, polished natural stone finish",
    installLaborTask: LaborTaskType.INSTALL_COUNTERTOP,
    demoLaborTask: LaborTaskType.DEMO_COUNTERTOP,
    debrisType: DebrisType.TILE_CONCRETE,
  },
  {
    category: MaterialCategory.COUNTERTOP,
    name: "Butcher Block",
    description: "1.5in solid maple butcher block",
    unit: PriceUnit.SQFT,
    unitCost: 40.0,
    wasteFactorPercent: 10,
    imageDescriptor: "warm solid maple butcher block countertop, satin oil finish",
    installLaborTask: LaborTaskType.INSTALL_COUNTERTOP,
    demoLaborTask: LaborTaskType.DEMO_COUNTERTOP,
    debrisType: DebrisType.GENERAL_CONSTRUCTION,
  },

  // Cabinetry
  {
    category: MaterialCategory.CABINETRY,
    name: "Stock Cabinets",
    description: "RTA shaker-style stock cabinetry",
    unit: PriceUnit.LINEAR_FT,
    unitCost: 150.0,
    wasteFactorPercent: 5,
    imageDescriptor: "white shaker-style stock kitchen cabinets, brushed nickel hardware",
    installLaborTask: LaborTaskType.INSTALL_CABINETRY,
    demoLaborTask: LaborTaskType.DEMO_CABINETRY,
    debrisType: DebrisType.GENERAL_CONSTRUCTION,
  },
  {
    category: MaterialCategory.CABINETRY,
    name: "Semi-Custom Cabinets",
    description: "Semi-custom shaker cabinetry, soft-close",
    unit: PriceUnit.LINEAR_FT,
    unitCost: 300.0,
    wasteFactorPercent: 5,
    imageDescriptor: "navy blue semi-custom shaker cabinets with soft-close hinges, matte black hardware",
    installLaborTask: LaborTaskType.INSTALL_CABINETRY,
    demoLaborTask: LaborTaskType.DEMO_CABINETRY,
    debrisType: DebrisType.GENERAL_CONSTRUCTION,
  },

  // Vanity
  {
    category: MaterialCategory.VANITY,
    name: "30in Single Vanity",
    description: "30in vanity with cultured marble top",
    unit: PriceUnit.EACH,
    unitCost: 650.0,
    wasteFactorPercent: 0,
    imageDescriptor: "30 inch white shaker single-sink bathroom vanity with cultured marble top, matte black faucet",
    installLaborTask: LaborTaskType.INSTALL_VANITY,
    demoLaborTask: LaborTaskType.DEMO_VANITY,
    debrisType: DebrisType.GENERAL_CONSTRUCTION,
  },
  {
    category: MaterialCategory.VANITY,
    name: "60in Double Vanity",
    description: "60in double-sink vanity with quartz top",
    unit: PriceUnit.EACH,
    unitCost: 1600.0,
    wasteFactorPercent: 0,
    imageDescriptor: "60 inch double-sink bathroom vanity, warm wood-tone cabinet, white quartz top, brushed gold faucets",
    installLaborTask: LaborTaskType.INSTALL_VANITY,
    demoLaborTask: LaborTaskType.DEMO_VANITY,
    debrisType: DebrisType.GENERAL_CONSTRUCTION,
  },

  // Paint
  {
    category: MaterialCategory.PAINT,
    name: "Interior Paint (mid-grade, 2 coats)",
    description: "Eggshell interior paint + primer, 2 coats",
    unit: PriceUnit.SQFT,
    unitCost: 0.75,
    wasteFactorPercent: 5,
    imageDescriptor: "freshly painted warm white eggshell walls, smooth even finish, crisp cut lines at ceiling and trim",
    installLaborTask: LaborTaskType.INSTALL_PAINT,
    demoLaborTask: null,
    debrisType: null,
  },

  // Trim
  {
    category: MaterialCategory.TRIM,
    name: "Baseboard Trim",
    description: "3.25in MDF baseboard, primed",
    unit: PriceUnit.LINEAR_FT,
    unitCost: 2.5,
    wasteFactorPercent: 10,
    imageDescriptor: "crisp white painted MDF baseboard trim, clean caulked lines",
    installLaborTask: LaborTaskType.INSTALL_TRIM,
    demoLaborTask: null,
    debrisType: null,
  },

  // Toilet
  {
    category: MaterialCategory.TOILET,
    name: "Elongated Toilet (mid-grade)",
    description: "Comfort-height elongated 1-piece toilet",
    unit: PriceUnit.EACH,
    unitCost: 350.0,
    wasteFactorPercent: 0,
    imageDescriptor: "white comfort-height elongated one-piece toilet, modern low-profile design",
    installLaborTask: LaborTaskType.INSTALL_TOILET,
    demoLaborTask: LaborTaskType.DEMO_TOILET,
    debrisType: DebrisType.GENERAL_CONSTRUCTION,
  },

  // Tub/Shower
  {
    category: MaterialCategory.TUB_SHOWER,
    name: "Alcove Tub/Shower Combo",
    description: "60in fiberglass alcove tub/shower unit",
    unit: PriceUnit.EACH,
    unitCost: 650.0,
    wasteFactorPercent: 0,
    imageDescriptor: "white fiberglass alcove tub and shower combo unit, clean modern surround",
    installLaborTask: LaborTaskType.INSTALL_TUB_SHOWER,
    demoLaborTask: LaborTaskType.DEMO_TUB_SHOWER,
    debrisType: DebrisType.GENERAL_CONSTRUCTION,
  },
  {
    category: MaterialCategory.TUB_SHOWER,
    name: "Walk-In Tile Shower Package",
    description: "Shower pan, glass enclosure, niche kit",
    unit: PriceUnit.EACH,
    unitCost: 1800.0,
    wasteFactorPercent: 0,
    imageDescriptor: "frameless glass walk-in shower enclosure with a built-in tile niche, modern spa-like design",
    installLaborTask: LaborTaskType.INSTALL_TUB_SHOWER,
    demoLaborTask: LaborTaskType.DEMO_TUB_SHOWER,
    debrisType: DebrisType.TILE_CONCRETE,
  },

  // Fixtures
  {
    category: MaterialCategory.FIXTURE,
    name: "Kitchen Faucet (mid-grade)",
    description: "Single-handle pull-down kitchen faucet",
    unit: PriceUnit.EACH,
    unitCost: 220.0,
    wasteFactorPercent: 0,
    imageDescriptor: "matte black single-handle pull-down kitchen faucet, modern arc design",
    installLaborTask: LaborTaskType.INSTALL_FIXTURE,
    demoLaborTask: LaborTaskType.DEMO_FIXTURE,
    debrisType: DebrisType.GENERAL_CONSTRUCTION,
  },
  {
    category: MaterialCategory.FIXTURE,
    name: "Bathroom Faucet (mid-grade)",
    description: "Single-handle widespread bath faucet",
    unit: PriceUnit.EACH,
    unitCost: 150.0,
    wasteFactorPercent: 0,
    imageDescriptor: "brushed nickel single-handle bathroom faucet, contemporary design",
    installLaborTask: LaborTaskType.INSTALL_FIXTURE,
    demoLaborTask: LaborTaskType.DEMO_FIXTURE,
    debrisType: DebrisType.GENERAL_CONSTRUCTION,
  },
  {
    category: MaterialCategory.FIXTURE,
    name: "Vanity Light Bar",
    description: "3-light LED vanity bar",
    unit: PriceUnit.EACH,
    unitCost: 120.0,
    wasteFactorPercent: 0,
    imageDescriptor: "modern matte black 3-light LED vanity light bar mounted above the mirror",
    installLaborTask: LaborTaskType.INSTALL_FIXTURE,
    demoLaborTask: LaborTaskType.DEMO_FIXTURE,
    debrisType: DebrisType.GENERAL_CONSTRUCTION,
  },
  {
    category: MaterialCategory.FIXTURE,
    name: "Bathroom Exhaust Fan",
    description: "Quiet 110 CFM exhaust fan",
    unit: PriceUnit.EACH,
    unitCost: 95.0,
    wasteFactorPercent: 0,
    imageDescriptor: "white ceiling-mounted bathroom exhaust fan grille, low profile",
    installLaborTask: LaborTaskType.INSTALL_FIXTURE,
    demoLaborTask: LaborTaskType.DEMO_FIXTURE,
    debrisType: DebrisType.GENERAL_CONSTRUCTION,
  },
];

// ---------------------------------------------------------------------------
// NorCal labor production-rate benchmarks.
//
// `hoursPerUnit` figures are common contractor rate-of-production
// benchmarks (industry rules of thumb), not pulled from a paid estimating
// database like RSMeans. `hourlyRate` is a standardized NorCal
// handyman/contractor crew rate. Tune both to match the actual crew.
// ---------------------------------------------------------------------------

const NORCAL_HOURLY_RATE = 85;

const laborRates: Array<{
  taskType: LaborTaskType;
  unit: PriceUnit;
  hoursPerUnit: number;
  hourlyRate: number;
  debrisCubicYardsPerUnit: number;
  notes: string;
}> = [
  { taskType: LaborTaskType.DEMO_FLOORING, unit: PriceUnit.SQFT, hoursPerUnit: 0.05, hourlyRate: NORCAL_HOURLY_RATE, debrisCubicYardsPerUnit: 0.006, notes: "Remove existing resilient/laminate/wood flooring" },
  { taskType: LaborTaskType.DEMO_TILE, unit: PriceUnit.SQFT, hoursPerUnit: 0.15, hourlyRate: NORCAL_HOURLY_RATE, debrisCubicYardsPerUnit: 0.01, notes: "Remove tile + thinset/mortar bed (wall or floor)" },
  { taskType: LaborTaskType.DEMO_DRYWALL, unit: PriceUnit.SQFT, hoursPerUnit: 0.04, hourlyRate: NORCAL_HOURLY_RATE, debrisCubicYardsPerUnit: 0.008, notes: "Remove drywall down to studs" },
  { taskType: LaborTaskType.DEMO_CABINETRY, unit: PriceUnit.LINEAR_FT, hoursPerUnit: 0.4, hourlyRate: NORCAL_HOURLY_RATE, debrisCubicYardsPerUnit: 0.15, notes: "Remove existing cabinet runs" },
  { taskType: LaborTaskType.DEMO_COUNTERTOP, unit: PriceUnit.LINEAR_FT, hoursPerUnit: 0.3, hourlyRate: NORCAL_HOURLY_RATE, debrisCubicYardsPerUnit: 0.08, notes: "Disconnect sink/faucet, remove existing countertop" },
  { taskType: LaborTaskType.DEMO_VANITY, unit: PriceUnit.EACH, hoursPerUnit: 1.0, hourlyRate: NORCAL_HOURLY_RATE, debrisCubicYardsPerUnit: 0.5, notes: "Disconnect plumbing, remove vanity cabinet + top" },
  { taskType: LaborTaskType.DEMO_TOILET, unit: PriceUnit.EACH, hoursPerUnit: 0.75, hourlyRate: NORCAL_HOURLY_RATE, debrisCubicYardsPerUnit: 0.15, notes: "Disconnect and remove toilet" },
  { taskType: LaborTaskType.DEMO_TUB_SHOWER, unit: PriceUnit.EACH, hoursPerUnit: 4.0, hourlyRate: NORCAL_HOURLY_RATE, debrisCubicYardsPerUnit: 1.5, notes: "Break out surround, disconnect plumbing, remove tub/shower unit" },
  { taskType: LaborTaskType.DEMO_FIXTURE, unit: PriceUnit.EACH, hoursPerUnit: 0.5, hourlyRate: NORCAL_HOURLY_RATE, debrisCubicYardsPerUnit: 0.05, notes: "Remove faucet/light/exhaust fan" },

  { taskType: LaborTaskType.INSTALL_FLOORING, unit: PriceUnit.SQFT, hoursPerUnit: 0.08, hourlyRate: NORCAL_HOURLY_RATE, debrisCubicYardsPerUnit: 0, notes: "Install LVP/engineered wood, incl. underlayment" },
  { taskType: LaborTaskType.INSTALL_TILE, unit: PriceUnit.SQFT, hoursPerUnit: 0.3, hourlyRate: NORCAL_HOURLY_RATE, debrisCubicYardsPerUnit: 0, notes: "Set + grout floor or wall tile, incl. layout/cuts" },
  { taskType: LaborTaskType.INSTALL_DRYWALL, unit: PriceUnit.SQFT, hoursPerUnit: 0.1, hourlyRate: NORCAL_HOURLY_RATE, debrisCubicYardsPerUnit: 0, notes: "Hang, tape, mud, sand" },
  { taskType: LaborTaskType.INSTALL_PAINT, unit: PriceUnit.SQFT, hoursPerUnit: 0.03, hourlyRate: NORCAL_HOURLY_RATE, debrisCubicYardsPerUnit: 0, notes: "Prep, prime if needed, 2 coats" },
  { taskType: LaborTaskType.INSTALL_TRIM, unit: PriceUnit.LINEAR_FT, hoursPerUnit: 0.15, hourlyRate: NORCAL_HOURLY_RATE, debrisCubicYardsPerUnit: 0, notes: "Cut, cope, nail, caulk baseboard/trim" },
  { taskType: LaborTaskType.INSTALL_CABINETRY, unit: PriceUnit.LINEAR_FT, hoursPerUnit: 1.0, hourlyRate: NORCAL_HOURLY_RATE, debrisCubicYardsPerUnit: 0, notes: "Set, level, secure, hang doors/hardware" },
  { taskType: LaborTaskType.INSTALL_COUNTERTOP, unit: PriceUnit.LINEAR_FT, hoursPerUnit: 0.5, hourlyRate: NORCAL_HOURLY_RATE, debrisCubicYardsPerUnit: 0, notes: "Template, cut, set, seam, seal" },
  { taskType: LaborTaskType.INSTALL_VANITY, unit: PriceUnit.EACH, hoursPerUnit: 2.5, hourlyRate: NORCAL_HOURLY_RATE, debrisCubicYardsPerUnit: 0, notes: "Set, level, connect supply/drain, caulk" },
  { taskType: LaborTaskType.INSTALL_TOILET, unit: PriceUnit.EACH, hoursPerUnit: 1.0, hourlyRate: NORCAL_HOURLY_RATE, debrisCubicYardsPerUnit: 0, notes: "Set wax ring, mount, connect supply" },
  { taskType: LaborTaskType.INSTALL_TUB_SHOWER, unit: PriceUnit.EACH, hoursPerUnit: 8.0, hourlyRate: NORCAL_HOURLY_RATE, debrisCubicYardsPerUnit: 0, notes: "Set unit/pan, plumb, surround, seal" },
  { taskType: LaborTaskType.INSTALL_FIXTURE, unit: PriceUnit.EACH, hoursPerUnit: 0.75, hourlyRate: NORCAL_HOURLY_RATE, debrisCubicYardsPerUnit: 0, notes: "Faucet/light/exhaust fan install" },
];

// ---------------------------------------------------------------------------
// NorCal debris disposal — C&D (construction & demolition) tipping fees run
// roughly $70-95/cubic yard at Northern California transfer stations, plus a
// flat haul fee for the dumpster/truck run.
// ---------------------------------------------------------------------------

const disposalRates: Array<{
  debrisType: DebrisType;
  costPerCubicYard: number;
  dumpsterFlatFee: number;
  notes: string;
}> = [
  { debrisType: DebrisType.GENERAL_CONSTRUCTION, costPerCubicYard: 75, dumpsterFlatFee: 150, notes: "Drywall, wood, packaging, fixtures" },
  { debrisType: DebrisType.TILE_CONCRETE, costPerCubicYard: 95, dumpsterFlatFee: 175, notes: "Tile, thinset, mortar bed, stone — heavier, higher tipping fee" },
  { debrisType: DebrisType.MIXED, costPerCubicYard: 85, dumpsterFlatFee: 160, notes: "Mixed demo debris across multiple material types" },
];

async function main() {
  console.log("Seeding NorCal price book...");

  for (const m of materialPrices) {
    await prisma.materialPrice.create({ data: m });
  }

  for (const l of laborRates) {
    await prisma.laborRate.upsert({
      where: { taskType: l.taskType },
      update: l,
      create: l,
    });
  }

  for (const d of disposalRates) {
    await prisma.disposalRate.upsert({
      where: { debrisType: d.debrisType },
      update: d,
      create: d,
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      passwordHash,
    },
  });

  console.log(`Seeded ${materialPrices.length} materials, ${laborRates.length} labor rates, ${disposalRates.length} disposal rates.`);
  console.log(`Admin login: ${adminEmail} / ${adminPassword} (change this — see README).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
