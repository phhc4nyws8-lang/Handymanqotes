import { MaterialCategory, ProjectType } from "@prisma/client";

export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  BATHROOM_REMODEL: "Bathroom Remodel",
  KITCHEN_REMODEL: "Kitchen Remodel",
  FLOORING: "Flooring",
  CUSTOM: "Custom Project",
};

export const CATEGORY_LABEL: Record<MaterialCategory, string> = {
  FLOORING: "Flooring",
  WALL_TILE: "Wall Tile",
  BACKSPLASH: "Backsplash",
  COUNTERTOP: "Countertop",
  CABINETRY: "Cabinetry",
  VANITY: "Vanity",
  PAINT: "Paint",
  TRIM: "Trim",
  TOILET: "Toilet",
  TUB_SHOWER: "Tub / Shower",
  FIXTURE: "Fixture",
};

/** Categories whose quantity can't be derived from room dimensions alone — the UI must collect an explicit quantity for these. */
export const CATEGORIES_REQUIRING_QUANTITY: MaterialCategory[] = ["BACKSPLASH", "COUNTERTOP", "CABINETRY", "FIXTURE"];

export const UNIT_LABEL: Record<string, string> = {
  SQFT: "sq ft",
  LINEAR_FT: "linear ft",
  EACH: "each",
  CUBIC_YARD: "cu yd",
};
