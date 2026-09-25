import { EstimateLineItemResult, EstimatePhase } from "@/lib/estimate/types";
import { QuoteEmailData } from "./types";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const fmt = (n: number) => currency.format(n);

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PHASE_ORDER: EstimatePhase[] = ["DEMOLITION", "MATERIALS", "INSTALLATION", "DISPOSAL", "OTHER"];

const PHASE_LABEL: Record<EstimatePhase, string> = {
  DEMOLITION: "Demolition & Haul-Out",
  MATERIALS: "Materials",
  INSTALLATION: "Installation",
  DISPOSAL: "Debris Disposal",
  OTHER: "Other",
};

function unitLabel(unit: EstimateLineItemResult["unit"]): string {
  switch (unit) {
    case "SQFT":
      return "sq ft";
    case "LINEAR_FT":
      return "linear ft";
    case "CUBIC_YARD":
      return "cu yd";
    case "EACH":
      return "ea";
  }
}

function phaseTable(phase: EstimatePhase, items: EstimateLineItemResult[]): string {
  if (items.length === 0) return "";
  const phaseTotal = items.reduce((acc, li) => acc + li.totalCost, 0);
  const rows = items
    .map(
      (li) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1e5d8;font-size:14px;color:#292019;">${escapeHtml(li.description)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1e5d8;font-size:14px;color:#7a6a58;text-align:right;white-space:nowrap;">${li.quantity} ${unitLabel(li.unit)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1e5d8;font-size:14px;color:#7a6a58;text-align:right;white-space:nowrap;">${fmt(li.unitCost)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1e5d8;font-size:14px;color:#292019;text-align:right;white-space:nowrap;font-weight:600;">${fmt(li.totalCost)}</td>
      </tr>`,
    )
    .join("");

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-collapse:collapse;">
    <tr>
      <td colspan="4" style="padding:10px 12px;background:#f7f0e6;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#9a3412;border-radius:6px 6px 0 0;">
        ${escapeHtml(PHASE_LABEL[phase])} <span style="float:right;">${fmt(phaseTotal)}</span>
      </td>
    </tr>
    ${rows}
  </table>`;
}

function photoBlock(data: QuoteEmailData): string {
  const pairs = data.photos.filter((p) => p.beforeUrl || p.afterUrl);
  if (pairs.length === 0) return "";

  const blocks = pairs
    .map((p) => {
      const demoNote = p.afterIsDemo
        ? `<p style="margin:6px 0 0;font-size:12px;color:#b45309;">Demo preview — not a real AI render. Live rendering turns on once the AI photo service is connected.</p>`
        : "";
      return `
      <tr>
        <td style="padding:0 0 24px;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#292019;">${escapeHtml(p.spaceName)}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td width="50%" style="padding-right:6px;">
              <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:#9a8b7a;">Before</p>
              ${p.beforeUrl ? `<img src="${p.beforeUrl}" alt="Before" width="100%" style="border-radius:8px;display:block;" />` : ""}
            </td>
            <td width="50%" style="padding-left:6px;">
              <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:#9a8b7a;">After</p>
              ${p.afterUrl ? `<img src="${p.afterUrl}" alt="After" width="100%" style="border-radius:8px;display:block;" />` : ""}
              ${demoNote}
            </td>
          </tr></table>
        </td>
      </tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${blocks}</table>`;
}

/**
 * Builds the full itemized quote email as a self-contained HTML string
 * (inline styles only — this is meant to render correctly in real email
 * clients, not just a browser).
 */
export function buildQuoteEmailHtml(data: QuoteEmailData): string {
  const itemsByPhase = new Map<EstimatePhase, EstimateLineItemResult[]>();
  for (const phase of PHASE_ORDER) itemsByPhase.set(phase, []);
  for (const item of data.lineItems) itemsByPhase.get(item.phase)!.push(item);

  const phaseTables = PHASE_ORDER.map((phase) => phaseTable(phase, itemsByPhase.get(phase)!)).join("");

  const validUntilLine = data.validUntil
    ? `<p style="margin:0 0 4px;font-size:13px;color:#7a6a58;">Valid until ${data.validUntil.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>`
    : "";

  const notesBlock = data.notes
    ? `<div style="margin:24px 0;padding:14px 16px;background:#fafaf8;border-left:3px solid #fb923c;border-radius:4px;">
         <p style="margin:0;font-size:13px;color:#4a4034;white-space:pre-wrap;">${escapeHtml(data.notes)}</p>
       </div>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f0e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px;background:#292019;">
              <p style="margin:0;color:#fdba74;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Quote #${escapeHtml(data.quoteNumber)}</p>
              <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;">${escapeHtml(data.projectTypeLabel)}</h1>
              <p style="margin:4px 0 0;color:#c9bba9;font-size:13px;">Prepared by ${escapeHtml(data.contractorName)} · ${escapeHtml(data.region)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 4px;font-size:15px;color:#292019;">Hi ${escapeHtml(data.toName)},</p>
              <p style="margin:0 0 20px;font-size:14px;color:#4a4034;line-height:1.5;">
                Here's your itemized quote. Costs are broken down by phase below, along with an estimated on-site labor time.
              </p>

              ${photoBlock(data)}

              ${phaseTables}

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;">
                <tr>
                  <td style="padding:6px 12px;font-size:13px;color:#7a6a58;">Subtotal</td>
                  <td style="padding:6px 12px;font-size:13px;color:#292019;text-align:right;">${fmt(data.totals.subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 12px;font-size:13px;color:#7a6a58;">Overhead</td>
                  <td style="padding:6px 12px;font-size:13px;color:#292019;text-align:right;">${fmt(data.totals.overhead)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 12px;font-size:13px;color:#7a6a58;">Tax</td>
                  <td style="padding:6px 12px;font-size:13px;color:#292019;text-align:right;">${fmt(data.totals.tax)}</td>
                </tr>
                <tr>
                  <td style="padding:12px;font-size:16px;font-weight:700;color:#292019;border-top:2px solid #292019;">Total</td>
                  <td style="padding:12px;font-size:18px;font-weight:700;color:#9a3412;text-align:right;border-top:2px solid #292019;">${fmt(data.totals.total)}</td>
                </tr>
              </table>

              <div style="margin:20px 0;padding:14px 16px;background:#fff7ed;border-radius:8px;">
                <p style="margin:0;font-size:13px;color:#7c2d12;">
                  Estimated on-site labor: <strong>${data.laborHours.total} hours</strong> (~${data.laborHours.estimatedDays} working day${data.laborHours.estimatedDays === 1 ? "" : "s"})
                </p>
              </div>

              ${notesBlock}
              ${validUntilLine}
              <p style="margin:20px 0 0;font-size:13px;color:#9a8b7a;">Questions about this quote? Just reply to this email.</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

/** Plain-text fallback for email clients that don't render HTML. */
export function buildQuoteEmailText(data: QuoteEmailData): string {
  const lines: string[] = [
    `Quote #${data.quoteNumber} — ${data.projectTypeLabel}`,
    `Prepared by ${data.contractorName} · ${data.region}`,
    "",
    `Hi ${data.toName},`,
    "",
  ];

  for (const phase of PHASE_ORDER) {
    const items = data.lineItems.filter((li) => li.phase === phase);
    if (items.length === 0) continue;
    lines.push(`${PHASE_LABEL[phase]}:`);
    for (const li of items) {
      lines.push(`  - ${li.description}: ${li.quantity} ${unitLabel(li.unit)} x ${fmt(li.unitCost)} = ${fmt(li.totalCost)}`);
    }
    lines.push("");
  }

  lines.push(`Subtotal: ${fmt(data.totals.subtotal)}`);
  lines.push(`Overhead: ${fmt(data.totals.overhead)}`);
  lines.push(`Tax: ${fmt(data.totals.tax)}`);
  lines.push(`Total: ${fmt(data.totals.total)}`);
  lines.push("");
  lines.push(`Estimated on-site labor: ${data.laborHours.total} hours (~${data.laborHours.estimatedDays} working days)`);
  if (data.notes) {
    lines.push("");
    lines.push(data.notes);
  }
  if (data.validUntil) {
    lines.push("");
    lines.push(`Valid until ${data.validUntil.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`);
  }

  return lines.join("\n");
}
