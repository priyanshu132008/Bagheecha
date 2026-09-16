import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { MotionConfig } from "framer-motion";
import "./globals.css";
import CustomCursor from "@/components/ui/CustomCursor";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Hotel Bagheecha — Terrace Lounge & Fine Dining, Virar",
    template: "%s — Hotel Bagheecha",
  },
  description:
    "Virar's premier terrace lounge, bar and fine-dining restaurant. Open-air rooftop evenings, signature cocktails, tandoori feasts and family celebrations.",
  openGraph: {
    title: "Hotel Bagheecha — Terrace Lounge & Fine Dining, Virar",
    description:
      "Rooftop lounge, bar and fine dining. Three moods, one address.",
    type: "website",
  },
};

export const viewport: Viewport = {
  /* Cream, matching the page ground — on a phone this is the
     browser chrome, and a mismatched bar above the page reads as a
     seam. Light, not dark: the house is a daylight restaurant now. */
  themeColor: "#f7f5f0",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-plum font-sans">
        {/* Film-grain plate — fixed, above everything, non-interactive */}
        <div className="grain" aria-hidden="true" />
        <CustomCursor />
        {/*
          Reduced motion is handled here, once, rather than by branching on
          `useReducedMotion()` inside every animated component.

          That hook reads the media query during the first client render,
          so any component that uses it to change its motion props renders
          different inline styles on the server and the client — which is a
          hydration mismatch, and React responds by throwing the subtree
          away and re-rendering it. `reducedMotion="user"` resolves the
          same preference inside Framer's animation layer instead, leaving
          the markup identical: transform animations snap to their end
          value while opacity still cross-fades.
        */}
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </body>
    </html>
  );
}