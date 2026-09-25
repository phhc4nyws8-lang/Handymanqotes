import { EmailSender } from "./types";
import { MockEmailSender } from "./mock";

export type { EmailSendResult, EmailSender, QuoteEmailData, QuotePhotoPair } from "./types";
export { buildQuoteEmailHtml, buildQuoteEmailText } from "./template";
export { MockEmailSender } from "./mock";

let cached: EmailSender | null = null;

export async function getEmailSender(): Promise<EmailSender> {
  if (cached) return cached;

  const demoMode = process.env.DEMO_MODE !== "false";
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!demoMode && apiKey && from) {
    const { ResendEmailSender } = await import("./resend");
    cached = new ResendEmailSender(apiKey, from);
  } else {
    cached = new MockEmailSender();
  }

  return cached;
}
