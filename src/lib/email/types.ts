import { EstimateLaborHours, EstimateLineItemResult, EstimateTotals } from "@/lib/estimate/types";

export interface QuotePhotoPair {
  spaceName: string;
  beforeUrl: string | null;
  afterUrl: string | null;
  afterIsDemo: boolean;
}

export interface QuoteEmailData {
  toEmail: string;
  toName: string;
  quoteNumber: string;
  projectTypeLabel: string;
  region: string;
  contractorName: string;
  lineItems: EstimateLineItemResult[];
  totals: EstimateTotals;
  laborHours: EstimateLaborHours;
  photos: QuotePhotoPair[];
  validUntil: Date | null;
  notes: string | null;
}

export interface EmailSendResult {
  status: "SENT" | "FAILED" | "DEMO_SKIPPED";
  providerMessageId: string | null;
  error: string | null;
}

/**
 * Sends the finished, itemized quote to the customer. Swappable so Resend
 * can be replaced by another provider without touching calling code.
 */
export interface EmailSender {
  sendQuote(data: QuoteEmailData): Promise<EmailSendResult>;
}
