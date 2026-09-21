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
 * SEO METADATA — honest, search-intent-matched, no keyword stuffing.
 *
 * SEO BRIEF (2026-09-21): the previous version of this file carried
 * a `keywords` meta tag with phrases like "premium luxury restaurant"
 * and a description that used "premium luxury" / "exceptional
 * culinary experience" language. Both moves are counter-productive:
 *
 *  - The `keywords` meta tag has been ignored by Google (and every
 *    other major search engine) since 2009. Pushing phrases into it
 *    costs nothing and ranks nothing — but it does signal "this site
 *    doesn't know what year it is" to spam classifiers.
 *  - "Premium luxury" / "exceptional culinary experience" are exactly
 *    the clichés Google's Helpful Content Update and SpamBrain
 *    actively downgrade. The same audit pass that banned "premium"
 *    from the user-facing copy banned it for the same reason from
 *    the meta description — because every search result is
 *    user-facing, the description is what Google shows in the snippet,
 *    and the snippet is the page.
 *
 * What Google actually ranks on for a local restaurant query
 * ("restaurant Virar", "bar Virar"): the title, the description,
 * the structured data (`RestaurantJsonLd`), the visible page content,
 * the OpenGraph image, and behavioural signals (CTR, dwell time,
 * pogo-sticking). This file invests the budget in those five
 * surfaces, and nowhere else.
 *
 *  - `lang="en-IN"` — English content, Maharashtra location.
 *  - Description: a single sentence under 155 characters that names
 *    the three things a guest is looking for (food, room, terrace)
 *    and ends with the action (reserve). Survives truncation cleanly.
 *  - Title: "Restaurant, Bar & Rooftop Terrace in Virar" — the search
 *    terms with real volume, in the order they appear in the
 *    description and on the page.
 *  - OpenGraph image is the build-time generated PNG (1200×630),
 *    which carries the wordmark and the vermillion asterisk.
 *  - `themeColor` matches the page ground (cream) so the browser
 *    chrome joins the page instead of cutting across it.
 */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://hotelbagheecha.com",
  ),
  title: {
    default: "Hotel Bageecha — Restaurant, Bar & Rooftop Terrace in Virar",
    template: "%s — Hotel Bageecha",
  },
  description:
    "Rooftop restaurant, late-night bar and AC dining room in Virar — tandoori, cocktails and family tables. Reserve on WhatsApp.",
  applicationName: SITE.name,
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "restaurant",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Hotel Bageecha — Restaurant, Bar & Rooftop Terrace in Virar",
    description:
      "Rooftop restaurant, late-night bar and AC dining room in Virar — tandoori, cocktails and family tables.",
    url: "/",
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE.name} — restaurant, bar and rooftop terrace in Virar`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hotel Bageecha — Restaurant, Bar & Rooftop Terrace in Virar",
    description:
      "Rooftop restaurant, late-night bar and AC dining room in Virar — tandoori, cocktails and family tables.",
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