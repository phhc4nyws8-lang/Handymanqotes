import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveUploadsRoot } from "./root";

const UPLOADS_ROOT = resolveUploadsRoot();

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_UPLOAD_BYTES = 30 * 1024 * 1024; // 30MB — covers full-resolution phone camera photos

export class UploadValidationError extends Error {}

/**
 * Saves an uploaded photo (from a <form action> File field) under
 * <uploads root>/<subdir>/, with a random filename — never trusting the
 * original filename beyond its validated content type. Returns the public
 * URL path to store on the Photo record (always `/uploads/...` — see the
 * route handler at src/app/uploads/[...path]/route.ts for how that URL maps
 * back to wherever UPLOADS_DIR actually points).
 *
 * Note: this writes to local/mounted disk, which only works for a single
 * long-running server process with a persistent filesystem (a plain VM or a
 * host like Render with an attached disk) — not a serverless/edge
 * deployment with an ephemeral filesystem. See README for swapping in
 * object storage (S3/R2) if you ever move to one of those instead.
 */
export async function saveUploadedPhoto(file: File, subdir: string): Promise<{ url: string; mimeType: string; buffer: Buffer }> {
  if (file.size === 0) {
    throw new UploadValidationError("No file was uploaded.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadValidationError("Photo is too large (max 30MB).");
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
