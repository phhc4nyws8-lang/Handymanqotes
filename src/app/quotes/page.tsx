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
  const rows = quotes.map((quote) => ({
    quote,
    totals: totalsFromLineItems(quote.lineItems, quote.overheadPercent, quote.taxPercent),
  }));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">Quotes</h1>
        <Link
          href="/quotes/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          + New Quote
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-stone-500">No quotes yet. Create your first one to get started.</p>
      ) : (
        <>
          {/* Card list — small screens */}
          <ul className="mt-6 space-y-3 sm:hidden">
            {rows.map(({ quote, totals }) => (
              <li key={quote.id}>
                <Link
                  href={`/quotes/${quote.id}/edit`}
                  className="block rounded-lg border border-stone-200 bg-white p-4 active:bg-stone-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-stone-900">{quote.number}</p>
                      <p className="text-sm text-stone-600">{quote.customer.name}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[quote.status]}`}>
                      {quote.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-stone-500">{PROJECT_TYPE_LABEL[quote.projectType]}</span>
                    <span className="font-semibold text-stone-900">
                      {quote.lineItems.length > 0 ? `$${totals.total.toLocaleString()}` : "—"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Table — sm and up */}
          <div className="mt-6 hidden overflow-hidden rounded-lg border border-stone-200 bg-white sm:block">
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
                {rows.map(({ quote, totals }) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
