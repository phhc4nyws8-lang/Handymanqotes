import { addSpaceAction } from "@/lib/quotes/actions";
import { FeetInchesField } from "@/app/quotes/FeetInchesField";
import type { ProjectType } from "@prisma/client";

export function AddSpaceForm({ quoteId, projectType }: { quoteId: string; projectType: ProjectType }) {
  const needsWallHeight = projectType !== "FLOORING";

  return (
    <form
      action={addSpaceAction}
      className="flex flex-col gap-3 rounded-md border border-dashed border-stone-300 p-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4"
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
      <FeetInchesField label="Length" feetName="lengthFt" inchesName="lengthIn" required />
      <FeetInchesField label="Width" feetName="widthFt" inchesName="widthIn" required />
      {needsWallHeight && <FeetInchesField label="Wall height" feetName="heightFt" inchesName="heightIn" defaultFeet={8} />}
      <button
        type="submit"
        className="w-full rounded-md bg-stone-800 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-900 sm:w-auto sm:py-1.5"
      >
        + Add Room
      </button>
    </form>
  );
}
