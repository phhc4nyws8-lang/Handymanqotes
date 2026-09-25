"use client";

import { useActionState } from "react";
import { computeEstimateAction, ActionResult } from "@/lib/quotes/actions";
import { UNIT_LABEL } from "@/lib/quotes/labels";
import type { EstimateLineItem } from "@prisma/client";
import { totalsFromLineItems } from "@/lib/estimate/totals-from-line-items";

const initial: ActionResult = { error: null };

const PHASE_ORDER = ["DEMOLITION", "MATERIALS", "INSTALLATION", "DISPOSAL", "OTHER"] as const;
const PHASE_LABEL: Record<string, string> = {
  DEMOLITION: "Demolition & Haul-Out",
  MATERIALS: "Materials",
  INSTALLATION: "Installation",
  DISPOSAL: "Debris Disposal",
  OTHER: "Other",
};

export function EstimatePanel({
  quoteId,
  lineItems,
  overheadPercent,
  taxPercent,
  laborHoursTotal,
  estimatedDays,
}: {
  quoteId: string;
  lineItems: EstimateLineItem[];
  overheadPercent: number;
  taxPercent: number;
  laborHoursTotal: number;
  estimatedDays: number;
}) {
  const [state, formAction, pending] = useActionState(computeEstimateAction, initial);
  const totals = totalsFromLineItems(lineItems, overheadPercent, taxPercent);

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="quoteId" value={quoteId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-stone-800 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-900 disabled:opacity-60"
        >
          {pending ? "Calculating..." : lineItems.length > 0 ? "Recalculate Estimate" : "Calculate Estimate"}
        </button>
      </form>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}

      {lineItems.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">No estimate yet — add rooms and materials, then calculate.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {PHASE_ORDER.map((phase) => {
            const items = lineItems.filter((li) => li.phase === phase);
            if (items.length === 0) return null;
            return (
              <div key={phase} className="overflow-hidden rounded-md border border-stone-200">
                <div className="bg-stone-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
                  {PHASE_LABEL[phase]}
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {items.map((li) => (
                      <tr key={li.id} className="border-t border-stone-100">
                        <td className="px-3 py-1.5 text-stone-700">{li.description}</td>
                        <td className="px-3 py-1.5 text-right text-stone-500 whitespace-nowrap">
                          {li.quantity} {UNIT_LABEL[li.unit]}
                        </td>
                        <td className="px-3 py-1.5 text-right text-stone-500 whitespace-nowrap">${li.unitCost}</td>
                        <td className="px-3 py-1.5 text-right font-semibold text-stone-900 whitespace-nowrap">
                          ${li.totalCost.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
            <Row label="Subtotal" value={totals.subtotal} />
            <Row label={`Overhead (${overheadPercent}%)`} value={totals.overhead} />
            <Row label={`Tax (${taxPercent}%)`} value={totals.tax} />
            <div className="mt-1 flex justify-between border-t border-stone-300 pt-1 text-base font-bold text-stone-900">
              <span>Total</span>
              <span>${totals.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="rounded-md bg-brand-50 p-3 text-sm text-brand-900">
            Estimated on-site labor: <strong>{laborHoursTotal} hours</strong> (~{estimatedDays} working day{estimatedDays === 1 ? "" : "s"})
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-stone-600">
      <span>{label}</span>
      <span>${value.toLocaleString()}</span>
    </div>
  );
}
