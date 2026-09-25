"use client";

import { useActionState } from "react";
import { sendQuoteEmailAction, ActionResult } from "@/lib/quotes/actions";

const initial: ActionResult = { error: null };

export function SendEmailPanel({
  quoteId,
  customerEmail,
  hasLineItems,
  alreadySent,
}: {
  quoteId: string;
  customerEmail: string;
  hasLineItems: boolean;
  alreadySent: boolean;
}) {
  const [state, formAction, pending] = useActionState(sendQuoteEmailAction, initial);

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <p className="text-sm text-stone-600">
        {alreadySent ? "This quote has already been sent to" : "Send the itemized quote to"} <strong>{customerEmail}</strong>.
      </p>
      <form action={formAction} className="mt-3">
        <input type="hidden" name="quoteId" value={quoteId} />
        <button
          type="submit"
          disabled={pending || !hasLineItems}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Sending..." : alreadySent ? "Resend Quote" : "Send Quote"}
        </button>
        {!hasLineItems && <p className="mt-1 text-xs text-stone-400">Calculate the estimate first.</p>}
      </form>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
