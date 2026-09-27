import { updateQuoteSettingsAction } from "@/lib/quotes/actions";

export function QuoteSettingsForm({
  quoteId,
  overheadPercent,
  taxPercent,
  notes,
  validUntil,
}: {
  quoteId: string;
  overheadPercent: number;
  taxPercent: number;
  notes: string | null;
  validUntil: Date | null;
}) {
  const validUntilValue = validUntil ? validUntil.toISOString().slice(0, 10) : "";

  return (
    <form action={updateQuoteSettingsAction} className="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
      <input type="hidden" name="quoteId" value={quoteId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-stone-500">Overhead %</label>
          <input
            name="overheadPercent"
            type="number"
            step="0.1"
            defaultValue={overheadPercent}
            className="mt-1 w-full rounded-md border border-stone-300 px-2 py-2 text-sm sm:py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500">Tax %</label>
          <input
            name="taxPercent"
            type="number"
            step="0.01"
            defaultValue={taxPercent}
            className="mt-1 w-full rounded-md border border-stone-300 px-2 py-2 text-sm sm:py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500">Valid until</label>
          <input
            name="validUntil"
            type="date"
            defaultValue={validUntilValue}
            className="mt-1 w-full rounded-md border border-stone-300 px-2 py-2 text-sm sm:py-1.5"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500">Notes to customer</label>
        <textarea
          name="notes"
          defaultValue={notes ?? ""}
          rows={2}
          className="mt-1 w-full rounded-md border border-stone-300 px-2 py-2 text-sm sm:py-1.5"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-stone-800 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-900 sm:w-auto sm:py-1.5"
      >
        Save Settings
      </button>
    </form>
  );
}
