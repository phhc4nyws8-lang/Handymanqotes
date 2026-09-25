import { EmailSendResult, EmailSender, QuoteEmailData } from "./types";
import { buildQuoteEmailHtml } from "./template";

/**
 * Demo-mode stand-in: never contacts a real email provider and never sends
 * anything to the customer's actual inbox. It renders the same HTML a real
 * send would produce and logs it, so the full quote flow can be verified
 * end-to-end before RESEND_API_KEY is added and DEMO_MODE is turned off.
 */
export class MockEmailSender implements EmailSender {
  async sendQuote(data: QuoteEmailData): Promise<EmailSendResult> {
    const html = buildQuoteEmailHtml(data);
    console.log(
      `[demo mode] Would send quote #${data.quoteNumber} to ${data.toEmail} (${html.length} bytes of HTML). ` +
        `No email was actually sent — set DEMO_MODE=false and RESEND_API_KEY to send for real.`,
    );
    return { status: "DEMO_SKIPPED", providerMessageId: null, error: null };
  }
}
