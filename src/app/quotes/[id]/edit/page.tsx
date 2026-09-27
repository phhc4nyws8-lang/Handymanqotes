import { notFound } from "next/navigation";
import Link from "next/link";
import { getQuoteDetail, listPriceBook } from "@/lib/quotes/queries";
import { removeSpaceAction, removeSelectionAction } from "@/lib/quotes/actions";
import { PROJECT_TYPE_LABEL, CATEGORY_LABEL, UNIT_LABEL } from "@/lib/quotes/labels";
import { AddSpaceForm } from "./AddSpaceForm";
import { AddSelectionForm } from "./AddSelectionForm";
import { SpacePhotos } from "./SpacePhotos";
import { EstimatePanel } from "./EstimatePanel";
import { QuoteSettingsForm } from "./QuoteSettingsForm";
import { SendEmailPanel } from "./SendEmailPanel";

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [quote, priceBook] = await Promise.all([getQuoteDetail(id), listPriceBook()]);
  if (!quote) notFound();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Link href="/quotes" className="text-sm text-stone-500 hover:underline">
            ← All quotes
          </Link>
        </div>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">
              {quote.number} — {PROJECT_TYPE_LABEL[quote.projectType]}
            </h1>
            <p className="text-sm text-stone-500">
              {quote.customer.name} · {quote.customer.email} {quote.customer.phone ? `· ${quote.customer.phone}` : ""}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-700">{quote.status}</span>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Rooms & Materials</h2>
        {quote.spaces.map((space) => {
          const beforePhoto = [...space.photos].reverse().find((p) => p.kind === "BEFORE");
          const afterPhoto = [...space.photos].reverse().find((p) => p.kind === "AFTER");
          return (
            <div key={space.id} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-semibold text-stone-900">
                  {space.name}{" "}
                  <span className="font-normal text-stone-400">
                    ({space.lengthFt}&apos; × {space.widthFt}&apos; × {space.heightFt}&apos;)
                  </span>
                </h3>
                <form action={removeSpaceAction} className="shrink-0">
                  <input type="hidden" name="quoteId" value={quote.id} />
                  <input type="hidden" name="spaceId" value={space.id} />
                  <button type="submit" className="py-1 text-xs text-red-500 hover:underline">
                    Remove room
                  </button>
                </form>
              </div>

              <div className="mt-3">
                <SpacePhotos
                  quoteId={quote.id}
                  spaceId={space.id}
                  beforeUrl={beforePhoto?.url ?? null}
                  afterUrl={afterPhoto?.url ?? null}
                  afterIsDemo={afterPhoto?.provider === "mock"}
                />
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Materials</p>
                {space.materialSelections.length === 0 ? (
                  <p className="mt-1 text-sm text-stone-400">No materials selected yet.</p>
                ) : (
                  <ul className="mt-1 space-y-1">
                    {space.materialSelections.map((sel) => (
                      <li key={sel.id} className="flex flex-wrap items-center justify-between gap-2 rounded bg-stone-50 px-2 py-1.5 text-sm">
                        <span>
                          <span className="font-medium text-stone-700">{CATEGORY_LABEL[sel.category]}:</span>{" "}
                          {sel.materialPrice.name}
                          {sel.quantityOverride ? ` (${sel.quantityOverride} ${UNIT_LABEL[sel.materialPrice.unit]})` : ""}
                        </span>
                        <form action={removeSelectionAction} className="shrink-0">
                          <input type="hidden" name="quoteId" value={quote.id} />
                          <input type="hidden" name="selectionId" value={sel.id} />
                          <button type="submit" className="py-1 text-xs text-red-500 hover:underline">
                            Remove
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2">
                  <AddSelectionForm quoteId={quote.id} spaceId={space.id} priceBook={priceBook} />
                </div>
              </div>
            </div>
          );
        })}

        <AddSpaceForm quoteId={quote.id} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-900">Quote Settings</h2>
        <div className="mt-3">
          <QuoteSettingsForm
            quoteId={quote.id}
            overheadPercent={quote.overheadPercent}
            taxPercent={quote.taxPercent}
            notes={quote.notes}
            validUntil={quote.validUntil}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-900">Estimate</h2>
        <div className="mt-3 rounded-lg border border-stone-200 bg-white p-4">
          <EstimatePanel
            quoteId={quote.id}
            lineItems={quote.lineItems}
            overheadPercent={quote.overheadPercent}
            taxPercent={quote.taxPercent}
            laborHoursTotal={quote.laborHoursTotal}
            estimatedDays={quote.estimatedDays}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-900">Send to Customer</h2>
        <div className="mt-3">
          <SendEmailPanel
            quoteId={quote.id}
            customerEmail={quote.customer.email}
            hasLineItems={quote.lineItems.length > 0}
            alreadySent={quote.status !== "DRAFT"}
          />
        </div>
        {quote.emailLogs.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-stone-500">
            {quote.emailLogs.map((log) => (
              <li key={log.id}>
                {log.sentAt.toLocaleString()} — {log.status} {log.error ? `(${log.error})` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
