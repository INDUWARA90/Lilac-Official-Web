import type { Metadata } from "next";
import { Fraunces, Manrope, Abhaya_Libre } from "next/font/google";
import { publicEnv } from "@/lib/env";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "opsz"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

// Sinhala wordmark ("ලයිලැක්"). Not a variable font, so weights are listed
// explicitly. Only the sinhala subset is needed, which keeps the download small.
const abhaya = Abhaya_Libre({
  variable: "--font-abhaya",
  subsets: ["sinhala"],
  weight: ["600", "700"],
  display: "swap",
});

// ...metadata unchanged...

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${manrope.variable} ${abhaya.variable}`}
    >
      <body className="bg-wash min-h-dvh text-ink">{children}</body>
    </html>
  );
}