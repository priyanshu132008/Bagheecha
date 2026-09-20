import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { MotionConfig } from "framer-motion";
import "./globals.css";
import CustomCursor from "@/components/ui/CustomCursor";
import RestaurantJsonLd from "@/components/seo/RestaurantJsonLd";
import { SITE } from "@/lib/constants/site";

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

/**
 * POLISH BRIEF (2026-09-20, G8): metadata audit + JSON-LD restaurant schema.
 *
 *  - `lang="en-IN"` — the site is in English and serves Maharashtra;
 *    `en-IN` is the BCP-47 tag for that pairing and is what the
 *    metadata block should advertise so screen readers, search and
 *    translation tooling all reach the same conclusion.
 *  - Description under 155 characters, written as a single sentence
 *    that survives truncation in a search-result snippet.
 *  - OpenGraph image, locale, and Twitter card metadata so the page
 *    unfurls cleanly into a card on any platform that supports it.
 *  - `themeColor` matches the page ground; light, not dark, because
 *    the public site is a daylight restaurant.
 *  - `icons` re-declares the canonical favicon routes so the SVG
 *    primary (modern browsers) and the multi-res ICO fallback (older
 *    browsers and certain aggregators) both render.
 */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://hotelbagheecha.com",
  ),
  title: {
    default: "Hotel Bagheecha — Restaurant, Terrace Lounge & Bar in Virar",
    template: "%s — Hotel Bagheecha",
  },
  description:
    "Rooftop terrace, two dining rooms and a bar in Virar. Tandoori, cocktails and family tables — book on WhatsApp.",
  applicationName: SITE.name,
  keywords: [
    "restaurant Virar",
    "terrace lounge Virar",
    "bar Virar",
    "fine dining Virar West",
    "rooftop restaurant Mumbai",
    "Hotel Bagheecha",
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "restaurant",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Hotel Bagheecha — Restaurant, Terrace Lounge & Bar in Virar",
    description:
      "Rooftop terrace, two dining rooms and a bar in Virar. Book on WhatsApp.",
    url: "/",
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE.name} — terrace lounge, fine dining and bar in Virar`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hotel Bagheecha — Restaurant, Terrace Lounge & Bar in Virar",
    description:
      "Rooftop terrace, two dining rooms and a bar in Virar. Book on WhatsApp.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  /* Cream, matching the page ground — on a phone this is the
     browser chrome, and a mismatched bar above the page reads as a
     seam. Light, not dark: the house is a daylight restaurant now. */
  themeColor: "#f7f5f0",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        {/* Restaurant JSON-LD — POLISH BRIEF (2026-09-20, G8). Injected
            here so it survives route-level metadata overrides and
            remains part of every page's <head>. Fields are populated
            from `lib/constants/site.ts` and omitted per Rule #1 when
            the owner has not provided a value. */}
        <RestaurantJsonLd />
      </head>
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