import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { resolveUploadsRoot } from "@/lib/uploads/root";

const UPLOADS_ROOT = resolveUploadsRoot();

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/**
 * Serves uploaded/generated photos from wherever UPLOADS_DIR actually
 * points. When that's public/uploads (the default), Next's own static file
 * serving usually handles the request before it even reaches this route —
 * this only matters once the photos live somewhere else (e.g. a Render disk
 * mounted outside the project directory), which is exactly the case it's
 * built for.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  // Segments come straight from the URL — re-validate before touching disk.
  if (segments.length === 0 || segments.some((s) => s.includes("..") || s.includes("/") || s.includes("\\"))) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(UPLOADS_ROOT, ...segments);
  // Defense in depth: the resolved path must still be inside UPLOADS_ROOT.
  if (filePath !== UPLOADS_ROOT && !filePath.startsWith(UPLOADS_ROOT + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return new NextResponse("Not found", { status: 404 });

    const buffer = await readFile(filePath);
    const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        // Filenames are random and never overwritten, so this is safe to cache hard.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
