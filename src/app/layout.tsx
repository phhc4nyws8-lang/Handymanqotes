import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Handyman Quotes",
  description: "Itemized remodel quotes with AI before/after photos, for Northern California handyman jobs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
