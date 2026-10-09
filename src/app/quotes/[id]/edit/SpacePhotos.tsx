"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  uploadBeforePhotoAction,
  startGenerateAfterPhotoAction,
  checkAfterPhotoStatusAction,
  ActionResult,
} from "@/lib/quotes/actions";

const initial: ActionResult = { error: null };
const POLL_INTERVAL_MS = 3000;

export function SpacePhotos({
  quoteId,
  spaceId,
  beforeUrl,
  afterUrl,
  afterIsDemo,
  initiallyPending,
}: {
  quoteId: string;
  spaceId: string;
  beforeUrl: string | null;
  afterUrl: string | null;
  afterIsDemo: boolean;
  initiallyPending: boolean;
}) {
  const router = useRouter();
  const [uploadState, uploadFormAction, uploadPending] = useActionState(uploadBeforePhotoAction, initial);

  const [starting, setStarting] = useState(false);
  const [polling, setPolling] = useState(initiallyPending);
  const [genError, setGenError] = useState<string | null>(null);

  // Image generation takes 30-90+ seconds, which proved unreliable to hold
  // open as a single request/response — see startGenerateAfterPhotoAction.
  // Instead we poll every few seconds until the background job finishes.
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(async () => {
      const status = await checkAfterPhotoStatusAction(spaceId);
      if (status.error) {
        setGenError(status.error);
        setPolling(false);
      } else if (!status.pending) {
        setPolling(false);
        router.refresh();
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [polling, spaceId, router]);

  async function handleGenerateClick() {
    setStarting(true);
    setGenError(null);
    const formData = new FormData();
    formData.set("quoteId", quoteId);
    formData.set("spaceId", spaceId);
    const result = await startGenerateAfterPhotoAction(initial, formData);
    setStarting(false);
    if (result.error) {
      setGenError(result.error);
    } else {
      setPolling(true);
    }
  }

  const genButtonLabel = starting
    ? "Starting..."
    : polling
      ? "Generating... (up to a minute)"
      : afterUrl
        ? "Regenerate After Photo"
        : "Generate After Photo";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <form action={uploadFormAction} className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input type="hidden" name="quoteId" value={quoteId} />
          <input type="hidden" name="spaceId" value={spaceId} />
          <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required className="min-w-0 flex-1 text-xs" />
          <button
            type="submit"
            disabled={uploadPending}
            className="shrink-0 rounded-md bg-stone-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-900 disabled:opacity-60"
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
            {polling ? "Generating..." : "Not generated yet"}
          </div>
        )}
        <button
          type="button"
          onClick={handleGenerateClick}
          disabled={starting || polling || !beforeUrl}
          className="mt-2 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {genButtonLabel}
        </button>
        {genError && <p className="mt-1 text-xs text-red-600">{genError}</p>}
      </div>
    </div>
  );
}
