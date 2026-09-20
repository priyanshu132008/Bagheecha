/**
 * Single source of truth for every fact a guest can act on or read.
 *
 * WHY THIS FILE EXISTS. The previous version lived at
 * `lib/constants/site.ts` and carried only phone, WhatsApp, directions
 * and the zone list. The polish pass moved every fact the site can
 * surface (capacity, hours, FSSAI, rating, address, PIN) into one
 * place, with strict rules:
 *
 *   1. Never invent. Anything the owner has not provided is an empty
 *      string here, with a `TODO(owner):` line above it explaining
 *      what to fill. Components MUST hide any row whose value is
 *      empty — never render a blank label, a bare "—", or a
 *      placeholder string.
 *
 *   2. One phone, one channel. Voice and WhatsApp share the same
 *      line (consolidated 2026-09-20). `CONTACT.whatsapp.href` is the
 *      reservation template by default; the order section substitutes
 *      `WHATSAPP_ORDER_HREF` directly.
 *
 *   3. Helpers are derived, not stored. `waLink(message)` is the only
 *      way to build a `wa.me` URL — it always reads `whatsapp` from
 *      this file, never from a literal.
 *
 * The shape below is the contract every section reads against; the
 * polish pass fills the empties in their order.
 */

const COUNTRY_CODE = "91";

/**
 * 10-digit local number for both voice and WhatsApp.
 * TODO(owner): confirm the public-facing line is still +91 93730 41417.
 */
const WHATSAPP_NUMBER = "9373041417";
const PRIMARY_PHONE = "9373041417";

const toTel = (local: string) => `tel:+${COUNTRY_CODE}${local}`;
const toWhatsAppLink = (local: string, message: string) =>
  `https://wa.me/${COUNTRY_CODE}${local}?text=${encodeURIComponent(message)}`;

const formatLocal = (local: string) =>
  `+91 ${local.slice(0, 5)} ${local.slice(5)}`;

/* ------------------------------------------------------------------
   Pre-filled WhatsApp templates
------------------------------------------------------------------- */

/**
 * Reservation template — opens with the full reservation form fields
 * in the order the desk reads them.
 */
export const RESERVATION_MESSAGE =
  "Hi Hotel Bagheecha! I would like to reserve a table.\n\n" +
  "Name: \n" +
  "Number of People: \n" +
  "Date: \n" +
  "Time: \n" +
  "Preferred Seating (Terrace Lounge / AC Fine Dining / Classic Dining): ";

/**
 * Direct-order template — used only by the Order section's WhatsApp CTA.
 */
export const ORDER_MESSAGE =
  "Hi Hotel Bagheecha! I would like to place a direct order for " +
  "delivery/takeaway.\n\n" +
  "Name: \n" +
  "Delivery Address: \n" +
  "Order Details: ";

/** Build a wa.me URL with a prefilled message. */
export const waLink = (message: string): string =>
  toWhatsAppLink(WHATSAPP_NUMBER, message);

/* ------------------------------------------------------------------
   Pre-baked hrefs
------------------------------------------------------------------- */

export const WHATSAPP_RESERVATION_HREF = waLink(RESERVATION_MESSAGE);
export const WHATSAPP_ORDER_HREF = waLink(ORDER_MESSAGE);

export const CONTACT = {
  whatsapp: {
    label: "WhatsApp",
    local: WHATSAPP_NUMBER,
    href: WHATSAPP_RESERVATION_HREF,
    display: formatLocal(WHATSAPP_NUMBER),
  },
  call: {
    label: "Call",
    local: PRIMARY_PHONE,
    href: toTel(PRIMARY_PHONE),
    display: formatLocal(PRIMARY_PHONE),
  },
} as const;

/* ------------------------------------------------------------------
   Identity & address
   Empty fields are TODO(owner). Components hide any row whose value
   is "" so the page never carries a blank label.
------------------------------------------------------------------- */

export const SITE = {
  name: "Hotel Bagheecha",
  shortName: "Bagheecha",
  // TODO(owner): confirm tagline or leave blank to omit
  tagline: "",

  // Address — every line is shown only when non-empty.
  // TODO(owner): confirm street address. The current setup displays
  // "Hotel Bagheecha, Virar" because no street was provided.
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  // TODO(owner): PIN code, no default. If empty, the row is hidden.
  pin: "",

  // TODO(owner): hours across the three zones. If empty, the row is
  // hidden. Format as a single display string — e.g. "Kitchen 12–3pm,
  // 7–11pm · Bar 5pm–1am".
  hours: "",

  // TODO(owner): capacity per room. Each is shown only when non-empty.
  // Used in the Spaces section as the third small line under each
  // room description.
  capacity: {
    terrace: "", // TODO(owner): e.g. "Seats 80 · 30 standing"
    ac: "", // TODO(owner): e.g. "Seats 60 · private booths"
    classic: "", // TODO(owner): e.g. "Seats 90 · 30 standing"
  },

  // TODO(owner): Maharashtra FSSAI licence number. If empty,
  // the footer omits the row.
  fssai: "",

  // TODO(owner): Google rating + count. The Reviews section hides the
  // "4.x stars on Google · N reviews" line if either is empty.
  googleRating: "",
  googleReviewCount: "",

  // TODO(owner): delivery radius, only used in #order as a small
  // line under the Direct card body. Empty hides the line.
  deliveryRadius: "",

  // TODO(owner): Instagram handle, only rendered in the footer when
  // set. Format: handle only — the URL builder adds the rest.
  instagram: "",

  // TODO(owner): maps embed URL. The Visit section hides the iframe
  // when empty and falls back to a maps.app/search URL for the hotel
  // name + Virar in the directions button.
  mapsEmbedUrl: "",

  // TODO(owner): parking / payments / accessibility notes. Each is
  // a single short sentence; empty hides the row.
  parkingNote: "",
  paymentsNote: "",
  accessibilityNote: "",
} as const;

/* ------------------------------------------------------------------
   Maps URLs
------------------------------------------------------------------- */

/**
 * Open-turn-by-turn directions URL. Always returns *something* —
 * either an owner-provided URL or a Google Maps search for the
 * hotel name + Virar. The Visit section's "Get directions" button
 * and the Mobile Action Bar's directions use this.
 */
export const DIRECTIONS_URL =
  // TODO(owner): if a precise destination URL is desired, paste the
  // Google Maps `https://www.google.com/maps/dir/...` URL here.
  // Until then we use the search fallback.
  "https://www.google.com/maps/dir/?api=1&destination=Hotel+Bagheecha+Virar";

/* ------------------------------------------------------------------
   Navigation
   The nav surfaces exactly these labels, in this order, per the
   polish brief. Section ids below MUST match an `<section id>` on
   the page or the scroll-spy highlight will hide.
------------------------------------------------------------------- */

export const NAV_LINKS = [
  { href: "#spaces", label: "Spaces" },
  { href: "#menus", label: "Menus" },
  { href: "#order", label: "Order" },
  { href: "#visit", label: "Visit" },
] as const;

export const RESERVE_HREF = "#reserve";

/* ------------------------------------------------------------------
   The three seating zones
   The polish brief renames the third zone from "Classic Dining"
   (already correct) and rewrites all three blurbs and CTAs. The
   existing `lib/constants/site.ts` already used "Classic Dining" —
   confirm and copy below.
------------------------------------------------------------------- */

export const ZONES = [
  {
    id: "terrace",
    name: "Terrace Lounge",
    blurb:
      "Open-air seating under a timber roof, palm trees at the edge of the view, and cocktails poured till late.",
    tag: "Open-air · Bar service · Evenings",
    // TODO(owner): fill from SITE.capacity.terrace when set
    capacity: "",
    /** WhatsApp message the page uses for the room's CTA. */
    ctaMessage:
      "Hi Bagheecha, I'd like to reserve a table on the Terrace Lounge.",
    ctaLabel: "Reserve the terrace",
  },
  {
    id: "ac",
    name: "AC Fine Dining",
    blurb:
      "An air-conditioned room, quiet enough to talk. Made for birthdays, anniversaries and family tables that run long.",
    tag: "Air-conditioned · Celebrations · Families",
    // TODO(owner): fill from SITE.capacity.ac when set
    capacity: "",
    ctaMessage:
      "Hi Bagheecha, I'd like to reserve a table in the AC Fine Dining room.",
    ctaLabel: "Reserve the AC room",
  },
  {
    id: "classic",
    name: "Classic Dining",
    blurb:
      "The everyday non-AC room for fast lunches, big groups and the regulars who know the menu.",
    tag: "Non-AC · Quick service · Big groups",
    // TODO(owner): fill from SITE.capacity.classic when set
    capacity: "",
    ctaMessage:
      "Hi Bagheecha, I'd like to reserve a table in the Classic Dining room.",
    ctaLabel: "Reserve the classic room",
  },
] as const;

export type ZoneId = (typeof ZONES)[number]["id"];

/* ------------------------------------------------------------------
   Hero copy
   The polish brief rewrites the eyebrow and subtext. The wordmark
   `bagheecha*` stays in Hero.tsx as JSX — this file only carries the
   surrounding copy that the brief explicitly requested.
------------------------------------------------------------------- */

export const HERO = {
  eyebrow: "RESTAURANT & BAR · VIRAR",
  subtext:
    "A rooftop terrace, two dining rooms and a bar that keeps late hours — all under one roof in Virar.",
} as const;

/* ------------------------------------------------------------------
   Type guards — components check `isFilled(value)` before rendering
   a row. Use string trimming: an empty string with whitespace is
   still empty.
------------------------------------------------------------------- */

export const isFilled = (value: string | undefined | null): boolean =>
  typeof value === "string" && value.trim().length > 0;
