import { EstimatePhase, EstimateTotals } from "./types";

interface LineItemLike {
  phase: EstimatePhase | string;
  totalCost: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Recomputes dollar totals from already-persisted (snapshotted) line items
 * plus the quote's overhead/tax percentages. This does NOT re-derive
 * quantities or prices from the current price book — it only re-sums what
 * was already computed and stored, so it's safe to call anywhere a quote's
 * totals need to be displayed (dashboard list, email, PDF) without risking
 * drift from price-book changes made after the estimate was computed.
 */
export function totalsFromLineItems(lineItems: LineItemLike[], overheadPercent: number, taxPercent: number): EstimateTotals {
  const sum = (phase: string) => round2(lineItems.filter((li) => li.phase === phase).reduce((acc, li) => acc + li.totalCost, 0));

  const materials = sum("MATERIALS");
  const demolition = sum("DEMOLITION");
  const installation = sum("INSTALLATION");
  const disposal = sum("DISPOSAL");
  const subtotal = round2(materials + demolition + installation + disposal);
  const overhead = round2(subtotal * (overheadPercent / 100));
  const tax = round2((subtotal + overhead) * (taxPercent / 100));
  const total = round2(subtotal + overhead + tax);

  return { materials, demolition, installation, disposal, subtotal, overhead, tax, total };
}
