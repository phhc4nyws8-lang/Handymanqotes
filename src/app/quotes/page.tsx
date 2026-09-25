import Link from "next/link";
import { listQuotes } from "@/lib/quotes/queries";
import { PROJECT_TYPE_LABEL } from "@/lib/quotes/labels";
import { totalsFromLineItems } from "@/lib/estimate/totals-from-line-items";

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-stone-200 text-stone-700",
  SENT: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-green-100 text-green-800",
  DECLINED: "bg-red-100 text-red-800",
};

export default async function QuotesDashboardPage() {
  const quotes = await listQuotes();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Quotes</h1>
        <Link
          href="/quotes/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          + New Quote
        </Link>
      </div>

      {quotes.length === 0 ? (
        <p className="mt-8 text-sm text-stone-500">No quotes yet. Create your first one to get started.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-stone-200 bg-white">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Quote #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {quotes.map((quote) => {
                const totals = totalsFromLineItems(quote.lineItems, quote.overheadPercent, quote.taxPercent);
                return (
                  <tr key={quote.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 font-medium text-stone-900">{quote.number}</td>
                    <td className="px-4 py-3 text-stone-700">{quote.customer.name}</td>
                    <td className="px-4 py-3 text-stone-700">{PROJECT_TYPE_LABEL[quote.projectType]}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[quote.status]}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-stone-900">
                      {quote.lineItems.length > 0 ? `$${totals.total.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/quotes/${quote.id}/edit`} className="text-brand-700 hover:underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
