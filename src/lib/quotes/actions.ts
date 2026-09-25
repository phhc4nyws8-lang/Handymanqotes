"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { computeEstimate } from "@/lib/estimate/engine";
import { EstimateValidationError } from "@/lib/estimate/types";
import { getImageGenerator, buildAfterPhotoPrompt } from "@/lib/ai-photo";
import { getEmailSender } from "@/lib/email";
import { QuoteEmailData, QuotePhotoPair } from "@/lib/email/types";
import { saveGeneratedPhoto, saveUploadedPhoto, UploadValidationError } from "@/lib/uploads/storage";
import { totalsFromLineItems } from "@/lib/estimate/totals-from-line-items";
import { loadEstimateInput } from "./queries";
import { PROJECT_TYPE_LABEL } from "./labels";
import { MaterialCategory, ProjectType } from "@prisma/client";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

async function nextQuoteNumber(): Promise<string> {
  const count = await prisma.quote.count();
  const year = new Date().getFullYear();
  return `Q-${year}-${String(count + 1).padStart(4, "0")}`;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function num(formData: FormData, key: string): number {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : 0;
}

// ---------------------------------------------------------------------------
// Quote creation
// ---------------------------------------------------------------------------

export async function createQuoteAction(formData: FormData): Promise<never> {
  const user = await requireUser();

  const customerName = str(formData, "customerName");
  const customerEmail = str(formData, "customerEmail");
  const customerPhone = str(formData, "customerPhone") || null;
  const customerAddress = str(formData, "customerAddress") || null;
  const projectType = str(formData, "projectType") as ProjectType;
  const spaceName = str(formData, "spaceName") || "Main Space";
  const lengthFt = num(formData, "lengthFt");
  const widthFt = num(formData, "widthFt");
  const heightFt = num(formData, "heightFt") || 8;

  if (!customerName || !customerEmail || !projectType || lengthFt <= 0 || widthFt <= 0) {
    throw new Error("Missing required fields to create a quote.");
  }

  const customer = await prisma.customer.create({
    data: { name: customerName, email: customerEmail, phone: customerPhone, address: customerAddress },
  });

  const quote = await prisma.quote.create({
    data: {
      number: await nextQuoteNumber(),
      projectType,
      customerId: customer.id,
      createdById: user.userId,
      spaces: {
        create: [{ name: spaceName, lengthFt, widthFt, heightFt }],
      },
    },
  });

  revalidatePath("/quotes");
  redirect(`/quotes/${quote.id}/edit`);
}

// ---------------------------------------------------------------------------
// Spaces
// ---------------------------------------------------------------------------

export async function addSpaceAction(formData: FormData): Promise<void> {
  await requireUser();
  const quoteId = str(formData, "quoteId");
  const name = str(formData, "name") || "Additional Space";
  const lengthFt = num(formData, "lengthFt");
  const widthFt = num(formData, "widthFt");
  const heightFt = num(formData, "heightFt") || 8;

  if (lengthFt <= 0 || widthFt <= 0) throw new Error("Length and width must be greater than zero.");

  await prisma.space.create({ data: { quoteId, name, lengthFt, widthFt, heightFt } });
  revalidatePath(`/quotes/${quoteId}/edit`);
}

export async function removeSpaceAction(formData: FormData): Promise<void> {
  await requireUser();
  const quoteId = str(formData, "quoteId");
  const spaceId = str(formData, "spaceId");
  await prisma.space.delete({ where: { id: spaceId } });
  revalidatePath(`/quotes/${quoteId}/edit`);
}

// ---------------------------------------------------------------------------
// Material selections
// ---------------------------------------------------------------------------

export async function addSelectionAction(formData: FormData): Promise<void> {
  await requireUser();
  const quoteId = str(formData, "quoteId");
  const spaceId = str(formData, "spaceId") || null;
  const category = str(formData, "category") as MaterialCategory;
  const materialPriceId = str(formData, "materialPriceId");
  const quantityRaw = str(formData, "quantityOverride");
  const quantityOverride = quantityRaw ? Number(quantityRaw) : null;

  if (!category || !materialPriceId) throw new Error("Choose a category and a material.");

  await prisma.materialSelection.create({
    data: { quoteId, spaceId, category, materialPriceId, quantityOverride },
  });
  revalidatePath(`/quotes/${quoteId}/edit`);
}

export async function removeSelectionAction(formData: FormData): Promise<void> {
  await requireUser();
  const quoteId = str(formData, "quoteId");
  const selectionId = str(formData, "selectionId");
  await prisma.materialSelection.delete({ where: { id: selectionId } });
  revalidatePath(`/quotes/${quoteId}/edit`);
}

// ---------------------------------------------------------------------------
// Quote settings (overhead/tax/notes/valid-until)
// ---------------------------------------------------------------------------

export async function updateQuoteSettingsAction(formData: FormData): Promise<void> {
  await requireUser();
  const quoteId = str(formData, "quoteId");
  const overheadPercent = num(formData, "overheadPercent");
  const taxPercent = num(formData, "taxPercent");
  const notes = str(formData, "notes") || null;
  const validUntilRaw = str(formData, "validUntil");

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      overheadPercent,
      taxPercent,
      notes,
      validUntil: validUntilRaw ? new Date(validUntilRaw) : null,
    },
  });
  revalidatePath(`/quotes/${quoteId}/edit`);
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

export interface ActionResult {
  error: string | null;
}

export async function uploadBeforePhotoAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireUser();
  const quoteId = str(formData, "quoteId");
  const spaceId = str(formData, "spaceId");
  const file = formData.get("file") as File | null;

  if (!file) return { error: "Choose a photo to upload." };

  try {
    const saved = await saveUploadedPhoto(file, quoteId);
    await prisma.photo.create({ data: { quoteId, spaceId, kind: "BEFORE", url: saved.url } });
  } catch (err) {
    if (err instanceof UploadValidationError) return { error: err.message };
    throw err;
  }

  revalidatePath(`/quotes/${quoteId}/edit`);
  return { error: null };
}

export async function generateAfterPhotoAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireUser();
  const quoteId = str(formData, "quoteId");
  const spaceId = str(formData, "spaceId");

  const [quote, space, beforePhoto, selections] = await Promise.all([
    prisma.quote.findUniqueOrThrow({ where: { id: quoteId } }),
    prisma.space.findUniqueOrThrow({ where: { id: spaceId } }),
    prisma.photo.findFirst({ where: { spaceId, kind: "BEFORE" }, orderBy: { createdAt: "desc" } }),
    prisma.materialSelection.findMany({ where: { spaceId }, include: { materialPrice: true } }),
  ]);

  if (!beforePhoto) return { error: "Upload a before photo of this space first." };
  if (selections.length === 0) return { error: "Add at least one material selection for this space first." };

  const prompt = buildAfterPhotoPrompt({
    spaceName: space.name,
    projectDescription: PROJECT_TYPE_LABEL[quote.projectType].toLowerCase(),
    materialDescriptors: selections.map((s) => s.materialPrice.imageDescriptor),
  });

  try {
    const beforeFilePath = beforePhoto.url.replace(/^\//, "");
    const { readFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const buffer = await readFile(path.join(process.cwd(), "public", beforeFilePath));
    const mimeType = beforeFilePath.endsWith(".png") ? "image/png" : beforeFilePath.endsWith(".webp") ? "image/webp" : "image/jpeg";

    const generator = await getImageGenerator();
    const result = await generator.generateAfterPhoto({ beforeImage: buffer, beforeImageMimeType: mimeType, prompt });
    const saved = await saveGeneratedPhoto(result.imageBuffer, result.mimeType, quoteId);

    await prisma.photo.create({
      data: { quoteId, spaceId, kind: "AFTER", url: saved.url, prompt, provider: result.provider },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to generate the after photo." };
  }

  revalidatePath(`/quotes/${quoteId}/edit`);
  return { error: null };
}

// ---------------------------------------------------------------------------
// Estimate
// ---------------------------------------------------------------------------

export async function computeEstimateAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireUser();
  const quoteId = str(formData, "quoteId");

  try {
    const input = await loadEstimateInput(quoteId);
    const result = computeEstimate(input);

    await prisma.$transaction([
      prisma.estimateLineItem.deleteMany({ where: { quoteId } }),
      prisma.estimateLineItem.createMany({
        data: result.lineItems.map((li, index) => ({
          quoteId,
          phase: li.phase,
          description: li.description,
          quantity: li.quantity,
          unit: li.unit,
          unitCost: li.unitCost,
          totalCost: li.totalCost,
          sortOrder: index,
        })),
      }),
      prisma.quote.update({
        where: { id: quoteId },
        data: {
          laborHoursDemolition: result.laborHours.demolition,
          laborHoursInstallation: result.laborHours.installation,
          laborHoursTotal: result.laborHours.total,
          estimatedDays: result.laborHours.estimatedDays,
        },
      }),
    ]);
  } catch (err) {
    if (err instanceof EstimateValidationError) return { error: err.message };
    throw err;
  }

  revalidatePath(`/quotes/${quoteId}/edit`);
  return { error: null };
}

// ---------------------------------------------------------------------------
// Send email
// ---------------------------------------------------------------------------

export async function sendQuoteEmailAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireUser();
  const quoteId = str(formData, "quoteId");

  const quote = await prisma.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: {
      customer: true,
      createdBy: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      spaces: { include: { photos: true } },
    },
  });

  if (quote.lineItems.length === 0) {
    return { error: "Compute the estimate before sending — there's nothing itemized yet." };
  }

  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const absoluteUrl = (url: string) => `${appUrl}${url}`;

  const photos: QuotePhotoPair[] = quote.spaces.map((space) => {
    const before = space.photos.find((p) => p.kind === "BEFORE");
    const after = [...space.photos].reverse().find((p) => p.kind === "AFTER");
    return {
      spaceName: space.name,
      beforeUrl: before ? absoluteUrl(before.url) : null,
      afterUrl: after ? absoluteUrl(after.url) : null,
      afterIsDemo: after?.provider === "mock",
    };
  });

  const totals = totalsFromLineItems(quote.lineItems, quote.overheadPercent, quote.taxPercent);

  const emailData: QuoteEmailData = {
    toEmail: quote.customer.email,
    toName: quote.customer.name,
    quoteNumber: quote.number,
    projectTypeLabel: PROJECT_TYPE_LABEL[quote.projectType],
    region: quote.region,
    contractorName: quote.createdBy.name,
    lineItems: quote.lineItems.map((li) => ({
      phase: li.phase,
      description: li.description,
      quantity: li.quantity,
      unit: li.unit,
      unitCost: li.unitCost,
      totalCost: li.totalCost,
    })),
    totals,
    laborHours: {
      demolition: quote.laborHoursDemolition,
      installation: quote.laborHoursInstallation,
      total: quote.laborHoursTotal,
      estimatedDays: quote.estimatedDays,
    },
    photos,
    validUntil: quote.validUntil,
    notes: quote.notes,
  };

  const sender = await getEmailSender();
  const result = await sender.sendQuote(emailData);

  await prisma.emailLog.create({
    data: {
      quoteId,
      toEmail: quote.customer.email,
      status: result.status,
      providerMessageId: result.providerMessageId,
      error: result.error,
    },
  });

  if (result.status !== "FAILED") {
    await prisma.quote.update({ where: { id: quoteId }, data: { status: "SENT", sentAt: new Date() } });
  } else {
    return { error: result.error ?? "Failed to send the email." };
  }

  revalidatePath(`/quotes/${quoteId}/edit`);
  revalidatePath("/quotes");
  return { error: null };
}
