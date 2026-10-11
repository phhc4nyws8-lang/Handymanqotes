import "server-only";
import path from "node:path";

/**
 * Where uploaded/generated photos actually live on disk. Defaults to
 * public/uploads (what local dev and a same-directory persistent-disk mount
 * both want), but can be pointed anywhere via UPLOADS_DIR — e.g. a Render
 * disk mounted at /var/data. Shared by the upload/save functions and the
 * /uploads/[...path] route handler so they always agree on the real path.
 */
export function resolveUploadsRoot(): string {
  return process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.join(process.cwd(), "public", "uploads");
}
