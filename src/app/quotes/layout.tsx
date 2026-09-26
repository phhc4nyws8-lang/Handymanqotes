import { AppHeader } from "@/app/AppHeader";

export default function QuotesLayout({ children }: { children: React.ReactNode }) {
  // Mirrors the fallback logic in getImageGenerator()/getEmailSender() exactly —
  // each service independently falls back to its mock unless DEMO_MODE=false
  // AND that service's own keys are configured, so the two can be in different
  // states (e.g. real email but still-mocked photos).
  const globalDemoMode = process.env.DEMO_MODE !== "false";
  const photosAreDemo = globalDemoMode || !process.env.GEMINI_API_KEY;
  const emailIsDemo = globalDemoMode || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM;

  const demoParts = [photosAreDemo && 'AI "after" photos', emailIsDemo && "customer emails"].filter(Boolean);
  const missingConfig = [photosAreDemo && "GEMINI_API_KEY", emailIsDemo && "RESEND_API_KEY + EMAIL_FROM"].filter(Boolean);

  return (
    <div className="min-h-screen bg-stone-100">
      <AppHeader />
      {demoParts.length > 0 && (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">
          Demo mode: {demoParts.join(" and ")} {demoParts.length === 1 ? "is" : "are"} simulated, not real. Add{" "}
          {missingConfig.join(" and ")} (with DEMO_MODE=false) to go live.
        </div>
      )}
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
