import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

export class UploadValidationError extends Error {}

/**
 * Saves an uploaded photo (from a <form action> File field) under
 * public/uploads/<subdir>/, with a random filename — never trusting the
 * original filename beyond its validated content type. Returns the public
 * URL path to store on the Photo record.
 *
 * Note: this writes to local disk, which only works for a single
 * long-running server process (not serverless/edge deployments with an
 * ephemeral filesystem). See README for swapping in object storage (S3/R2)
 * for a multi-instance or serverless deployment.
 */
export async function saveUploadedPhoto(file: File, subdir: string): Promise<{ url: string; mimeType: string; buffer: Buffer }> {
  if (file.size === 0) {
    throw new UploadValidationError("No file was uploaded.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadValidationError("Photo is too large (max 10MB).");
  }
  const ext = ALLOWED_MIME_TO_EXT[file.type];
  if (!ext) {
    throw new UploadValidationError(`Unsupported file type "${file.type}". Upload a JPEG, PNG, or WebP photo.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dir = path.join(UPLOADS_ROOT, safeSegment(subdir));
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, filename), buffer);

  return { url: `/uploads/${safeSegment(subdir)}/${filename}`, mimeType: file.type, buffer };
}

/** Saves an AI-generated image buffer the same way uploaded photos are saved. */
export async function saveGeneratedPhoto(buffer: Buffer, mimeType: string, subdir: string): Promise<{ url: string }> {
  const ext = ALLOWED_MIME_TO_EXT[mimeType] ?? "png";
  const dir = path.join(UPLOADS_ROOT, safeSegment(subdir));
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, filename), buffer);

  return { url: `/uploads/${safeSegment(subdir)}/${filename}` };
}

function safeSegment(segment: string): string {
  const cleaned = segment.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!cleaned) throw new UploadValidationError("Invalid storage path.");
  return cleaned;
}
