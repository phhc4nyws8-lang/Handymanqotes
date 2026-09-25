import "server-only";
import { prisma } from "@/lib/db/client";
import { EstimateInput } from "@/lib/estimate/types";

export async function listQuotes() {
  return prisma.quote.findMany({
    include: { customer: true, lineItems: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getQuoteDetail(quoteId: string) {
  return prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      customer: true,
      createdBy: true,
      spaces: { include: { materialSelections: { include: { materialPrice: true } }, photos: true } },
      materialSelections: { include: { materialPrice: true } },
      photos: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      emailLogs: { orderBy: { sentAt: "desc" } },
    },
  });
}

export type QuoteDetail = NonNullable<Awaited<ReturnType<typeof getQuoteDetail>>>;

export async function listPriceBook() {
  return prisma.materialPrice.findMany({ where: { active: true }, orderBy: [{ category: "asc" }, { name: "asc" }] });
}

export async function loadEstimateInput(quoteId: string): Promise<EstimateInput> {
  const quote = await prisma.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: {
      spaces: true,
      materialSelections: {
        include: {
          materialPrice: {
            select: {
              id: true,
              category: true,
              name: true,
              unit: true,
              unitCost: true,
              wasteFactorPercent: true,
              installLaborTask: true,
              demoLaborTask: true,
              debrisType: true,
            },
          },
        },
      },
    },
  });

  const [laborRates, disposalRates] = await Promise.all([
    prisma.laborRate.findMany({
      select: { taskType: true, unit: true, hoursPerUnit: true, hourlyRate: true, debrisCubicYardsPerUnit: true },
    }),
    prisma.disposalRate.findMany({ select: { debrisType: true, costPerCubicYard: true, dumpsterFlatFee: true } }),
  ]);

  return {
    spaces: quote.spaces.map((s) => ({ id: s.id, name: s.name, lengthFt: s.lengthFt, widthFt: s.widthFt, heightFt: s.heightFt })),
    selections: quote.materialSelections.map((sel) => ({
      id: sel.id,
      spaceId: sel.spaceId,
      category: sel.category,
      materialPrice: sel.materialPrice,
      quantityOverride: sel.quantityOverride,
    })),
    laborRates,
    disposalRates,
    overheadPercent: quote.overheadPercent,
    taxPercent: quote.taxPercent,
  };
}
