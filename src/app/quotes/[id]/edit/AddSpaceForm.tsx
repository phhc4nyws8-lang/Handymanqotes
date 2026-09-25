import { addSpaceAction } from "@/lib/quotes/actions";

export function AddSpaceForm({ quoteId }: { quoteId: string }) {
  return (
    <form action={addSpaceAction} className="flex flex-wrap items-end gap-2 rounded-md border border-dashed border-stone-300 p-3">
      <input type="hidden" name="quoteId" value={quoteId} />
      <div>
        <label className="block text-xs font-medium text-stone-500">Room name</label>
        <input name="name" required placeholder="e.g. Kitchen" className="mt-1 w-40 rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500">Length (ft)</label>
        <input name="lengthFt" type="number" step="0.1" required className="mt-1 w-24 rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500">Width (ft)</label>
        <input name="widthFt" type="number" step="0.1" required className="mt-1 w-24 rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500">Height (ft)</label>
        <input name="heightFt" type="number" step="0.1" placeholder="8" className="mt-1 w-24 rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
      </div>
      <button type="submit" className="rounded-md bg-stone-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-stone-900">
        + Add Room
      </button>
    </form>
  );
}
