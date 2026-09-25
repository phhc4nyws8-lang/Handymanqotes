import { AppHeader } from "@/app/AppHeader";

export default function QuotesLayout({ children }: { children: React.ReactNode }) {
  const demoMode = process.env.DEMO_MODE !== "false";

  return (
    <div className="min-h-screen bg-stone-100">
      <AppHeader />
      {demoMode && (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">
          Demo mode is on — AI &quot;after&quot; photos and customer emails are simulated, not real. Add GEMINI_API_KEY /
          RESEND_API_KEY and set DEMO_MODE=false to go live.
        </div>
      )}
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
