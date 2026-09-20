/**
 * Single source of truth for everything a visitor can act on:
 * phone numbers, WhatsApp, directions and the in-page anchors.
 *
 * The Mobile Action Bar and the Navbar CTA both read from here, so a
 * number only ever changes in one place.
 */

/* ------------------------------------------------------------------
   Contact
   Numbers are stored as bare 10-digit local numbers and expanded to
   E.164 (`+91…`) / `wa.me` form by the helpers below, so the dialling
   code lives in exactly one spot.
------------------------------------------------------------------- */

const COUNTRY_CODE = "91";

/**
 * Digits only — no spaces, dashes or country code.
 *
 * CONSOLIDATED 2026-09-20. The hotel now publishes a single line,
 * +91 93730 41417, for both voice and WhatsApp. The previous setup
 * kept two — voice on this number and WhatsApp on 9049915238 — which
 * meant the alternate-call row in `#location` was pointing at the
 * old WhatsApp number, and the WhatsApp row was a separate channel
 * guests could misdial. One number, one place it lives.
 */
const WHATSAPP_NUMBER = "9373041417";
const PRIMARY_PHONE = "9373041417";

/** `tel:` needs the full E.164 string to work from a mobile dialler. */
const toTel = (local: string) => `tel:+${COUNTRY_CODE}${local}`;

/** `wa.me` expects country code + number, digits only, no `+`. */
const toWhatsApp = (local: string, message: string) =>
  `https://wa.me/${COUNTRY_CODE}${local}?text=${encodeURIComponent(message)}`;

/** Pretty-prints a 10-digit local number as `+91 93730 41417`. */
const formatLocal = (local: string) =>
  `+91 ${local.slice(0, 5)} ${local.slice(5)}`;

/* ------------------------------------------------------------------
   Pre-filled WhatsApp templates
   Two distinct intents, two distinct templates. Reservations ask for
   the things the front desk needs to hold a table; orders ask for the
   things the kitchen needs to cook and dispatch. Mixing them gives a
   guest a form that asks for "delivery address" on a booking, which
   is the kind of friction that loses the booking.
------------------------------------------------------------------- */

/**
 * Reservation template — used by every "Book a Table" / "Reserve a
 * Place" / "Reserve on WhatsApp" button across the site (Navbar,
 * mobile drawer, Hero, `#reserve`, and the MobileActionBar).
 *
 * The fields appear in the order the desk reads them: who, how many,
 * when, where. `Preferred Seating` lists the three zones in
 * `#atmospheres` (terrace / AC / classic) — naming them by what the
 * guest actually saw on the page means they don't have to remember
 * whether "rooftop" and "terrace" are the same thing.
 */
export const RESERVATION_MESSAGE =
  "Hi Hotel Bagheecha! I would like to reserve a table.\n\nName: \nNumber of People: \nDate: \nTime: \nPreferred Seating (Terrace/AC/Classic): ";

/**
 * Direct-order template — used only by the "WhatsApp the Kitchen"
 * button in `#order`. It asks for delivery address (or "pickup") and
 * the order itself; the kitchen reads it and the order goes straight
 * into the prep queue.
 */
export const ORDER_MESSAGE =
  "Hi Hotel Bagheecha! I would like to place a direct order for delivery/takeaway.\n\nName: \nDelivery Address: \nOrder Details: ";

/** The exact reservation href, ready to drop into `href=`. */
export const WHATSAPP_RESERVATION_HREF = toWhatsApp(
  WHATSAPP_NUMBER,
  RESERVATION_MESSAGE,
);

/** The exact order href, ready to drop into `href=`. */
export const WHATSAPP_ORDER_HREF = toWhatsApp(WHATSAPP_NUMBER, ORDER_MESSAGE);

export const CONTACT = {
  whatsapp: {
    label: "WhatsApp",
    local: WHATSAPP_NUMBER,
    /**
     * Defaults to the reservation template — every "WhatsApp" link
     * the page carries is reservation-shaped, except the explicit
     * order button which uses `WHATSAPP_ORDER_HREF` directly.
     */
    href: WHATSAPP_RESERVATION_HREF,
    display: formatLocal(WHATSAPP_NUMBER),
  },
  call: {
    label: "Call",
    local: PRIMARY_PHONE,
    /** `tel:` targets only — display formatting is separate. */
    href: toTel(PRIMARY_PHONE),
    /** Rendered for humans; never parsed. */
    display: formatLocal(PRIMARY_PHONE),
  },
} as const;

/* ------------------------------------------------------------------
   Directions
------------------------------------------------------------------- */

/** Opens native turn-by-turn navigation on mobile, Maps on desktop. */
export const DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=Hotel+Bagheecha+Virar";

export const LOCATION = {
  name: "Hotel Bagheecha",
  locality: "Virar",
  region: "Maharashtra",
  directionsHref: DIRECTIONS_URL,
} as const;

/* ------------------------------------------------------------------
   Identity, address & facts

   POLISH BRIEF (2026-09-20, Rule #1): anything the owner has not
   provided lives here as an empty string with a `TODO(owner):` line
   above it. Components MUST hide any row whose value is empty — never
   render a blank label, a bare "—", or a placeholder string. This is
   the live source of truth (the parallel `lib/config/site.ts` is
   deprecated; see its header).
------------------------------------------------------------------- */
export const SITE = {
  name: LOCATION.name,
  shortName: "Bagheecha",
  /** TODO(owner): confirm tagline or leave blank to omit */
  tagline: "",
  /** TODO(owner): confirm street address. The current setup displays
   *  "Hotel Bagheecha, Virar" because no street was provided. */
  addressLine1: "",
  addressLine2: "",
  /** TODO(owner): nearby landmark — empty hides the row. */
  landmark: "",
  /** TODO(owner): PIN code, no default. If empty, the row is hidden. */
  pin: "",
  /** TODO(owner): hours across the three zones. If empty, the row is
   *  hidden. Format as a single display string — e.g. "Kitchen 12–3pm,
   *  7–11pm · Bar 5pm–1am". */
  hours: "",
  /** TODO(owner): capacity per room. Each is shown only when non-empty. */
  capacity: {
    terrace: "",
    ac: "",
    classic: "",
  },
  /** TODO(owner): Maharashtra FSSAI licence number. If empty, the
   *  footer omits the row. */
  fssai: "",
  /** TODO(owner): Google rating + count. Empty hides the line. */
  googleRating: "",
  googleReviewCount: "",
  /** Turn 8: a typed mirror of the rating fields above. When both
   *  are non-null, `ReviewsCards` renders a "4.6 on Google · 312
   *  reviews" badge above the carousel; either being null hides it.
   *  Numbers stay in JS — `.toFixed(1)` and `.toLocaleString("en-IN")`
   *  formatting lives in the component. Placeholder values demonstrate
   *  the badge UI; replace with real Google Place data when the owner
   *  provides it. The string fields above are kept untouched so any
   *  other consumer of `isFilled(SITE.googleRating)` continues to work. */
  googleRatingNumber: 4.6 as number | null,
  googleReviewCountNumber: 312 as number | null,
  /** TODO(owner): delivery radius, only used in #order as a small
   *  line under the Direct card body. Empty hides the line. */
  deliveryRadius: "",
  /** TODO(owner): Instagram handle, only rendered in the footer when
   *  set. Format: handle only — the URL builder adds the rest. */
  instagram: "",
  /** TODO(owner): parking / payments / accessibility notes. Each is
   *  a single short sentence; empty hides the row. */
  parkingNote: "",
  paymentsNote: "",
  accessibilityNote: "",
} as const;

/** Type guard — components check `isFilled(value)` before rendering
 *  a row. Use string trimming: an empty string with whitespace is
 *  still empty. */
export const isFilled = (value: string | undefined | null): boolean =>
  typeof value === "string" && value.trim().length > 0;

/* ------------------------------------------------------------------
   Navigation — every href must resolve to a real id on the page.

   POLISH BRIEF (2026-09-20, canonical nav). The previous nav read
   "Atmospheres / Menus / Location" — three of the four were already
   section labels, but the missing "Order" entry meant the order
   section was reachable only by scrolling, and the closing "Reserve"
   chapter had no entry either. The canonical nav is now four items,
   ordered by the way a guest reads the page: Spaces (where to sit),
   Menus (what to eat), Order (how to get it home), Visit (where to
   find us).

   The Reserve chapter is still anchored at `#reserve` for the primary
   CTA's `href`, but it is reached via the in-page CTA, not via the
   top nav — a guest who is ready to book does not need a fourth
   destination.
------------------------------------------------------------------- */

export const NAV_LINKS = [
  { href: "#spaces", label: "Spaces" },
  { href: "#menus", label: "Menus" },
  { href: "#order", label: "Order" },
  { href: "#visit", label: "Visit" },
] as const;

/** Anchor the primary CTAs point at (the reservation form lands here). */
export const RESERVE_HREF = "#reserve";

/* ------------------------------------------------------------------
   The three seating zones — the site's core selling point.
------------------------------------------------------------------- */

export const ZONES = [
  {
    id: "terrace",
    name: "Terrace Lounge",
    tagline: "Open-air, high-energy, last to close",
    detail:
      "Rooftop seating under a timber roof, signature cocktails, premium bottles and pot service.",
  },
  {
    id: "ac",
    name: "AC Fine Dining",
    tagline: "Cool, quiet, built for celebrating",
    detail:
      "Air-conditioned comfort with banquette booths — family dinners and long, unhurried evenings.",
  },
  {
    id: "nonac",
    name: "Classic Dining",
    tagline: "Casual, quick, always open",
    detail:
      "The everyday non-AC room for fast lunches, big groups and the regulars who know the menu.",
  },
] as const;

export type ZoneId = (typeof ZONES)[number]["id"];
