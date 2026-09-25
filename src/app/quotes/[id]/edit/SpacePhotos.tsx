"use client";

import { useActionState } from "react";
import Image from "next/image";
import { uploadBeforePhotoAction, generateAfterPhotoAction, ActionResult } from "@/lib/quotes/actions";

const initial: ActionResult = { error: null };

export function SpacePhotos({
  quoteId,
  spaceId,
  beforeUrl,
  afterUrl,
  afterIsDemo,
}: {
  quoteId: string;
  spaceId: string;
  beforeUrl: string | null;
  afterUrl: string | null;
  afterIsDemo: boolean;
}) {
  const [uploadState, uploadFormAction, uploadPending] = useActionState(uploadBeforePhotoAction, initial);
  const [genState, genFormAction, genPending] = useActionState(generateAfterPhotoAction, initial);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Before</p>
        {beforeUrl ? (
          <div className="relative mt-1 aspect-video overflow-hidden rounded-md border border-stone-200">
            <Image src={beforeUrl} alt="Before" fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="mt-1 flex aspect-video items-center justify-center rounded-md border border-dashed border-stone-300 text-xs text-stone-400">
            No photo yet
          </div>
        )}
        <form action={uploadFormAction} className="mt-2 flex items-center gap-2">
          <input type="hidden" name="quoteId" value={quoteId} />
          <input type="hidden" name="spaceId" value={spaceId} />
          <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required className="text-xs" />
          <button
            type="submit"
            disabled={uploadPending}
            className="rounded-md bg-stone-800 px-2 py-1 text-xs font-semibold text-white hover:bg-stone-900 disabled:opacity-60"
          >
            {uploadPending ? "Uploading..." : "Upload"}
          </button>
        </form>
        {uploadState.error && <p className="mt-1 text-xs text-red-600">{uploadState.error}</p>}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">After (AI render)</p>
        {afterUrl ? (
          <div className="relative mt-1 aspect-video overflow-hidden rounded-md border border-stone-200">
            <Image src={afterUrl} alt="After" fill className="object-cover" unoptimized />
            {afterIsDemo && (
              <span className="absolute left-1 top-1 rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
                DEMO PREVIEW — not a real render
              </span>
            )}
          </div>
        ) : (
          <div className="mt-1 flex aspect-video items-center justify-center rounded-md border border-dashed border-stone-300 text-xs text-stone-400">
            Not generated yet
          </div>
        )}
        <form action={genFormAction} className="mt-2">
          <input type="hidden" name="quoteId" value={quoteId} />
          <input type="hidden" name="spaceId" value={spaceId} />
          <button
            type="submit"
            disabled={genPending || !beforeUrl}
            className="rounded-md bg-brand-600 px-2 py-1 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {genPending ? "Generating..." : afterUrl ? "Regenerate After Photo" : "Generate After Photo"}
          </button>
        </form>
        {genState.error && <p className="mt-1 text-xs text-red-600">{genState.error}</p>}
      </div>
    </div>
  );
}
