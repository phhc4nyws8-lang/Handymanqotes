import { addSpaceAction } from "@/lib/quotes/actions";

export function AddSpaceForm({ quoteId }: { quoteId: string }) {
  return (
    <form
      action={addSpaceAction}
      className="flex flex-col gap-3 rounded-md border border-dashed border-stone-300 p-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-2"
    >
      <input type="hidden" name="quoteId" value={quoteId} />
      <div className="w-full sm:w-40">
        <label className="block text-xs font-medium text-stone-500">Room name</label>
        <input
          name="name"
          required
          placeholder="e.g. Kitchen"
          className="mt-1 w-full rounded-md border border-stone-300 px-2 py-2 text-sm sm:py-1.5"
        />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:contents">
        <div>
          <label className="block text-xs font-medium text-stone-500">Length (ft)</label>
          <input
            name="lengthFt"
            type="number"
            step="0.1"
            required
            className="mt-1 w-full rounded-md border border-stone-300 px-2 py-2 text-sm sm:w-24 sm:py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500">Width (ft)</label>
          <input
            name="widthFt"
            type="number"
            step="0.1"
            required
            className="mt-1 w-full rounded-md border border-stone-300 px-2 py-2 text-sm sm:w-24 sm:py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500">Height (ft)</label>
          <input
            name="heightFt"
            type="number"
            step="0.1"
            placeholder="8"
            className="mt-1 w-full rounded-md border border-stone-300 px-2 py-2 text-sm sm:w-24 sm:py-1.5"
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-stone-800 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-900 sm:w-auto sm:py-1.5"
      >
        + Add Room
      </button>
    </form>
  );
}
