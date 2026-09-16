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

/** Digits only — no spaces, dashes or country code. */
const WHATSAPP_NUMBER = "9049915238";
const PRIMARY_PHONE = "9373041417";
const SECONDARY_PHONE = "9049915238";

/** `tel:` needs the full E.164 string to work from a mobile dialler. */
const toTel = (local: string) => `tel:+${COUNTRY_CODE}${local}`;

/** `wa.me` expects country code + number, digits only, no `+`. */
const toWhatsApp = (local: string, message: string) =>
  `https://wa.me/${COUNTRY_CODE}${local}?text=${encodeURIComponent(message)}`;

/** Pre-filled so the guest never has to compose the first message. */
export const WHATSAPP_INQUIRY =
  "Hi Hotel Bagheecha! I'd like to enquire about booking a table. Date, time and number of guests:";

export const CONTACT = {
  whatsapp: {
    label: "WhatsApp",
    local: WHATSAPP_NUMBER,
    href: toWhatsApp(WHATSAPP_NUMBER, WHATSAPP_INQUIRY),
  },
  call: {
    label: "Call",
    local: PRIMARY_PHONE,
    /** `tel:` targets only — display formatting is separate. */
    href: toTel(PRIMARY_PHONE),
    /** Rendered for humans; never parsed. */
    display: `+91 ${PRIMARY_PHONE.slice(0, 5)} ${PRIMARY_PHONE.slice(5)}`,
  },
  callAlt: {
    label: "Call (alternate)",
    local: SECONDARY_PHONE,
    href: toTel(SECONDARY_PHONE),
    display: `+91 ${SECONDARY_PHONE.slice(0, 5)} ${SECONDARY_PHONE.slice(5)}`,
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
   Navigation — every href must resolve to a real id on the page.
------------------------------------------------------------------- */

export const NAV_LINKS = [
  { href: "#atmospheres", label: "Atmospheres" },
  { href: "#menus", label: "Menus" },
  { href: "#location", label: "Location" },
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
