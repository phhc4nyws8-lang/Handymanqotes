import { Resend } from "resend";
import { EmailSendResult, EmailSender, QuoteEmailData } from "./types";
import { buildQuoteEmailHtml, buildQuoteEmailText } from "./template";

export class ResendEmailSender implements EmailSender {
  private readonly client: Resend;
  private readonly from: string;

  constructor(apiKey: string, from: string) {
    this.client = new Resend(apiKey);
    this.from = from;
  }

  async sendQuote(data: QuoteEmailData): Promise<EmailSendResult> {
    const { data: sent, error } = await this.client.emails.send({
      from: this.from,
      to: data.toEmail,
      subject: `Your ${data.projectTypeLabel} Quote #${data.quoteNumber}`,
      html: buildQuoteEmailHtml(data),
      text: buildQuoteEmailText(data),
    });

    if (error) {
      return { status: "FAILED", providerMessageId: null, error: error.message };
    }

    return { status: "SENT", providerMessageId: sent?.id ?? null, error: null };
  }
}
