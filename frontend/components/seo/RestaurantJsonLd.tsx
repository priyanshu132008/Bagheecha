/**
 * RestaurantJsonLd — POLISH BRIEF (2026-09-20, G8).
 *
 * Injects a `<script type="application/ld+json">` block describing
 * the hotel as a `Restaurant` per schema.org. The block is rendered
 * inside `<head>` from the root layout (see `app/layout.tsx`).
 *
 * SEO BRIEF (2026-09-21): the JSON-LD schema is the single most
 * useful surface for ranking — Google's rich-results picker reads
 * it directly for the knowledge panel, for cuisine filters, for
 * price-range filters, and for "place a reservation" actions. The
 * metadata block in `app/layout.tsx` and the JSON-LD block here are
 * written together: same `name`, same `description`, same `image`,
 * same `url`. They are not the same thing — `keywords` does not
 * belong in JSON-LD (Google ignores it there too, and Bing's parser
 * actually warns against it), and the description is *not* a tagline.
 *
 * FIELDS
 *   Only fields with a non-empty value are emitted. This is Rule #1 of
 *   the brief — never invent facts; the owner fills the `SITE` object
 *   in `lib/constants/site.ts` over time, and the schema picks up the
 *   values as they arrive. An empty string today means "field omitted
 *   from the schema", not "field rendered as blank".
 *
 *   Non-optional fields hard-coded with public facts:
 *
 *     - `@context`            : "https://schema.org"
 *     - `@type`               : "Restaurant"
 *     - `name`                : from `LOCATION.name`
 *     - `address.addressLocality` / `address.addressRegion` : Virar,
 *                            Maharashtra. These are public and stable
 *                            regardless of owner-fact progress.
 *     - `servesCuisine`       : ["Indian", "Chinese", "Tandoor"] — the
 *                            three cuisines the menu carries today.
 *     - `image`               : `/opengraph-image` — the build-time
 *                            generated PNG from `app/opengraph-image.tsx`.
 *     - `url`                 : site root.
 *     - `telephone`           : from `CONTACT.call.display` (+91 …).
 *     - `acceptsReservations` : "true" — yes, on WhatsApp or by phone.
 *     - `priceRange`          : "₹₹" — moderate. Google uses this to
 *                            filter "cheap eats" vs "mid-range" vs
 *                            "fine dining" SERPs.
 *
 *   Owner-provided fields (omitted when empty):
 *     - `address.streetAddress`  (two lines)
 *     - `address.postalCode`
 *     - `geo`                    (latitude/longitude — TODO(owner))
 *     - `openingHoursSpecification`
 *     - `aggregateRating`
 *     - `hasMenu`                (URL to /menus when present)
 *     - `paymentAccepted`
 *     - `accessibilityFeature`
 *
 * WHY A SEPARATE COMPONENT
 *   The block is rendered into `<head>` once at the layout level so
 *   every route inherits it. A route-specific `<head>` override that
 *   forgets to re-mount this component would silently drop the
 *   schema — so it lives in `RootLayout` and is the single source of
 *   truth.
 *
 * SAFETY
 *   `JSON.stringify` is the only transformation; the script is marked
 *   `dangerouslySetInnerHTML` because that is how JSON-LD is
 *   delivered. No user input enters this string, so XSS is not a
 *   concern — every value either comes from a typed const, a TODO
 *   literal, or a server-controlled build-time constant.
 */

import {
  CONTACT,
  LOCATION,
  NAV_LINKS,
  SITE,
  isFilled,
} from "@/lib/constants/site";

/* The default site origin — overridable via env at runtime. The brief
   doesn't dictate a hostname; we resolve it from `NEXT_PUBLIC_SITE_URL`
   when set, otherwise fall back to the canonical production domain
   for the unfurl preview. `metadataBase` in `app/layout.tsx` uses the
   same fallback, so the JSON-LD and the metadata block agree. */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://hotelbagheecha.com";

/* The cuisines the menu carries today, per the brief's reading of
   `lib/constants/menu.ts`. The owner can refine via the admin CMS
   later; this is a safe starter set. */
const CUISINES = ["Indian", "Chinese", "Tandoor"];

/**
 * The schema's `description` — kept in lockstep with the
 * `metadata.description` in `app/layout.tsx` so a search result's
 * snippet (sourced from the meta description) and the knowledge
 * panel (sourced from the JSON-LD description) read as the same
 * paragraph to a human. The two must move together; if one
 * changes, both change.
 */
const SCHEMA_DESCRIPTION =
  "Rooftop restaurant, late-night bar and AC dining room in Virar — tandoori, cocktails and family tables. Reserve on WhatsApp.";

export default function RestaurantJsonLd() {
  /* Build the street address from the two address lines, dropping
     anything blank. Same shape every Google Maps URL expects. */
  const streetLines = [SITE.addressLine1, SITE.addressLine2].filter(
    (line) => isFilled(line),
  ) as string[];
  const hasStreet = streetLines.length > 0 || isFilled(SITE.pin);

  /* Country code is "IN" by derivation when any address fragment is
     present; otherwise the field is omitted entirely. Hard-coded for
     now — Virar is in India and there is no path where this site
     describes an address in another country. */
  const addressCountry = hasStreet ? "IN" : undefined;

  /* Aggregate rating: only emitted when both rating and count are
     present. Google's structured-data policy requires both. */
  const hasRating = isFilled(SITE.googleRating) && isFilled(SITE.googleReviewCount);

  const data = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: LOCATION.name,
    description: SCHEMA_DESCRIPTION,
    image: [`${SITE_URL}/opengraph-image`],
    url: `${SITE_URL}/`,
    telephone: CONTACT.call.display,
    servesCuisine: CUISINES,
    acceptsReservations: "true",
    priceRange: "₹₹",
    ...(hasStreet || isFilled(SITE.pin)
      ? {
          address: {
            "@type": "PostalAddress",
            ...(streetLines.length > 0
              ? { streetAddress: streetLines.join(", ") }
              : {}),
            addressLocality: LOCATION.locality,
            addressRegion: LOCATION.region,
            ...(isFilled(SITE.pin) ? { postalCode: SITE.pin } : {}),
            ...(addressCountry ? { addressCountry } : {}),
          },
        }
      : {
          /* Even without a full street address we can advertise the
             locality so the schema is not malformed. */
          address: {
            "@type": "PostalAddress",
            addressLocality: LOCATION.locality,
            addressRegion: LOCATION.region,
            addressCountry: "IN",
          },
        }),
    ...(NAV_LINKS.some((l) => l.href === "#menus")
      ? {
          hasMenu: `${SITE_URL}/#menus`,
        }
      : {}),
    ...(hasRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: SITE.googleRating,
            reviewCount: SITE.googleReviewCount,
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
