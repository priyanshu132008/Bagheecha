import { CONTACT, SITE, instagramUrl, isFilled } from "@/lib/constants/site";

/**
 * Footer — the closing chapter.
 *
 * The page rhythm already has a dark opening frame (the hero) and a
 * chapter after dark (`#menus` flips to plum for the bar card). The
 * footer closes the book the same way the hero opens it — first
 * frame plum, last frame plum, the cream chapters in the middle.
 * That's the "Aubergine & Cream" bookended structure the brand
 * brief asks for, made literal.
 *
 * Why a footer at all. The polish brief calls for statutory note,
 * copyright line, contact / address / Instagram / FSSAI residue,
 * and a brand wordmark echoing the hero's. Without a footer those
 * pieces have nowhere to land, and the document outline closes
 * mid-`<main>` — an accessibility audit looks for a `contentinfo`
 * landmark last, and a missing one is what every axe / Lighthouse
 * / Pa11y report flags as a quick fix that almost no page makes.
 *
 * Conditional rendering — Rule #1 carries. Every fact-driven row
 * uses `isFilled(...)` exactly the way `<Visit />` does. Address,
 * PIN, hours, Instagram and FSSAI render only when the owner has
 * filled the corresponding field. Today (every field blank) the
 * footer still carries the brand wordmark, the call / WhatsApp
 * links (the contact number is always present), the statutory
 * note, and the copyright line — the four pieces the brief asks
 * for that are never owner-conditional.
 *
 * The footer is mounted from `app/page.tsx` as a sibling of
 * `<main>` (not inside it). Contentinfo is a body-level landmark
 * that closes the document outline; nesting it inside `<main>`
 * would put it under the `main` role, which assistive tech reads
 * as part of the main content rather than the residual metadata.
 */

/* ------------------------------------------------------------------
   Shared typography for the footer columns. The plum ground +
   cream type is the inverse of every other section's light tone,
   so we reach for explicit `text-cream*` shades rather than the
   semantic `text-ink*` tokens (which would re-map to plum via
   `data-tone="dark"` and disappear on the plum ground).
------------------------------------------------------------------- */

const FOOTER_LABEL =
  "text-[10px] uppercase tracking-[0.28em] text-cream/70";

const FOOTER_VALUE = "text-[14px] leading-6 text-cream/85";

const FOOTER_LINK =
  "transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-cream";

/* ------------------------------------------------------------------
   The wordmark. The same `bagheecha*` lockup the hero opens on,
   sized down for the footer's quieter reading weight. The leading
   "Hotel" sits in an sr-only span so the link's accessible name is
   the real one; the asterisk is `aria-hidden` because it is the
   brand mark, not a character.
------------------------------------------------------------------- */
function FooterWordmark() {
  return (
    <a
      href="#top"
      aria-label={`${SITE.name} — back to top`}
      data-cursor="hover"
      className="inline-block font-display text-[clamp(2.5rem,6vw,4rem)] font-normal leading-none tracking-tighter text-cream"
    >
      <span className="sr-only">Hotel </span>
      bagheecha
      <span aria-hidden="true" className="text-vermillion">
        *
      </span>
    </a>
  );
}

/* ------------------------------------------------------------------
   The contact column. Call, WhatsApp, Instagram (if filled), FSSAI
   (if filled). The Call / WhatsApp pair mirrors the combined row
   in `<Visit />` — one number, two intents — so a guest who finds
   the same number twice on the page understands it's the same line,
   not a typo.
------------------------------------------------------------------- */
function ContactColumn() {
  return (
    <div className="col-span-12 sm:col-span-6 lg:col-span-3 lg:col-start-10">
      <p className={FOOTER_LABEL}>Contact</p>
      <ul className="mt-6 space-y-3">
        <li className={FOOTER_VALUE}>
          <a
            href={CONTACT.call.href}
            data-cursor="hover"
            className={FOOTER_LINK}
          >
            {CONTACT.call.display}
          </a>
        </li>
        <li className={FOOTER_VALUE}>
          <a
            href={CONTACT.whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="hover"
            className={FOOTER_LINK}
          >
            WhatsApp
          </a>
        </li>
        {isFilled(SITE.instagram) && (
          <li className={FOOTER_VALUE}>
            <a
              href={instagramUrl(SITE.instagram)}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="hover"
              className={FOOTER_LINK}
            >
              @{SITE.instagram.replace(/^@/, "")}
            </a>
          </li>
        )}
        {isFilled(SITE.fssai) && (
          <li className="text-[12px] uppercase tracking-[0.22em] text-cream/60">
            FSSAI {SITE.fssai}
          </li>
        )}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------
   The visit column. Address, PIN, hours — all conditional. PIN sits
   on its own line with a `PIN` prefix so the digits are scoped.
------------------------------------------------------------------- */
function VisitColumn() {
  const hasAddress =
    isFilled(SITE.addressLine1) || isFilled(SITE.addressLine2);

  return (
    <div className="col-span-12 sm:col-span-6 lg:col-span-3 lg:col-start-7">
      <p className={FOOTER_LABEL}>Visit</p>
      <ul className="mt-6 space-y-3">
        {hasAddress && (
          <li className={FOOTER_VALUE}>
            {isFilled(SITE.addressLine1) && (
              <span className="block">{SITE.addressLine1}</span>
            )}
            {isFilled(SITE.addressLine2) && (
              <span className="block">{SITE.addressLine2}</span>
            )}
          </li>
        )}
        {isFilled(SITE.pin) && (
          <li className="text-[12px] uppercase tracking-[0.22em] text-cream/60">
            PIN {SITE.pin}
          </li>
        )}
        {isFilled(SITE.hours) && (
          <li className={`sentence ${FOOTER_VALUE}`}>{SITE.hours}</li>
        )}
      </ul>
    </div>
  );
}

/**
 * The footer. Server-rendered — no client interactivity, no hooks,
 * pure markup. Lives at the document root as a sibling of `<main>`.
 */
export default function Footer() {
  return (
    <footer
      data-tone="dark"
      aria-label={`${SITE.name} — site information`}
      className="bg-plum text-cream"
    >
      <div className="container-x">
        {/* --------------------------------------------------------------
            Top band: brand block (cols 1–5) + visit (cols 7–9) +
            contact (cols 10–12). At `sm` the columns are full-width
            stacked; at `sm+` they sit two-per-row; at `lg` they sit
            three-per-row, the closing-pair rail's complement.
        --------------------------------------------------------------- */}
        <div className="grid grid-cols-12 gap-x-6 gap-y-12 pt-24 pb-16 md:pt-32 md:pb-20">
          {/* Brand block. The wordmark + a single line of brand copy
              that echoes the hero's subtext, so the footer's voice
              matches the page's. `max-w-sm` keeps the line measure
              inside the brand column. */}
          <div className="col-span-12 lg:col-span-5">
            <FooterWordmark />
            <p className="mt-6 max-w-sm text-pretty text-[14px] leading-6 text-cream/70">
              A rooftop terrace, two dining rooms and a bar that keeps
              late hours — all under one roof in Virar.
            </p>
          </div>

          <VisitColumn />
          <ContactColumn />
        </div>

        {/* --------------------------------------------------------------
            Hairline + statutory / copyright band.

            The hairline uses `border-cream/15` rather than the
            semantic `--line` token because we are on the dark tone
            and `--line` would resolve to `var(--line-cream)`, which
            is the same colour at a different alpha (16%). Naming the
            colour directly makes the intent unambiguous on review.
        --------------------------------------------------------------- */}
        <div className="border-t border-cream/15 py-8">
          <p className="max-w-3xl text-[11px] uppercase tracking-[0.22em] text-cream/70">
            Please drink responsibly. Alcohol is served only to guests
            of legal drinking age.
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-cream/60">
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
