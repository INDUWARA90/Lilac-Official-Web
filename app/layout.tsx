import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { publicEnv } from "@/lib/env";
import "./globals.css";

/**
 * Type family (brief "Design system → Type"):
 *  - a warm serif for headlines  → Fraunces
 *  - a clean modern sans for body/labels/buttons → Manrope
 *    (the brief suggests "General Sans", which isn't on Google Fonts; Manrope is
 *    a close, self-hostable stand-in. Swap here if the real face is licensed.)
 *
 * `next/font` self-hosts the files (no request to Google at runtime) and gives
 * us a CSS variable to hand to Tailwind's @theme in globals.css.
 */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  // Fraunces is a variable font with an optical-size axis; a soft, "warm" setting.
  axes: ["SOFT", "opsz"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: {
    default: "Lilac",
    template: "%s · Lilac",
  },
  description:
    "Lilac — the annual company event. Watch, enter, and confirm your place in the draw.",
  applicationName: "Lilac",
  robots: { index: false, follow: false }, // demo project; keep it out of search
  openGraph: {
    title: "Lilac",
    description:
      "Watch this year's film, enter the draw, and confirm your place.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="min-h-dvh bg-canvas text-ink">{children}</body>
    </html>
  );
}
