import { MaskReveal } from "@/components/motion/MaskReveal";
import { ActionButton } from "@/components/ui/ActionButton";
import {
  CONTACT,
  H2_MASSIVE,
  LEDE,
  LOCATION,
  SITE,
  isFilled,
} from "@/lib/constants/site";
import { cn } from "@/lib/utils";

/**
 * Visit — the closing chapter, polished.
 *
 * Phase 5 widened this section's rail and set the heading at the
 * wordmark scale; Turn 11 fills the body it had been missing.
 *
 *  - The address / landmark / PIN rows only render when the owner has
 *    filled the corresponding `SITE.*` field. Empty rows never paint
 *    — Rule #1 of the polish brief is "no blank labels, no bare '—',
 *    no placeholder strings".
 *  - Hours get their own row when filled. The owner-supplied format
 *    (`"Kitchen 12–3pm, 7–11pm · Bar 5pm–1am"`) renders verbatim.
 *  - The Call / WhatsApp pair collapses into a single row with two
 *    distinct text links — one number, two intents. Lining tabular
 *    numerals on both so the digits line up column-wise.
 *  - Parking / payments / accessibility notes render only when the
 *    owner has filled them. These three fields already existed in
 *    `SITE` as `TODO(owner)` strings; the page previously had no
 *    consumer for them, so they sat dormant.
 *  - The map embed is a no-API-key Google Maps share-iframe, lazy
 *    loaded and desaturated to match the cream / plum palette. The
 *    whole `<figure>` is absent when `SITE.mapsEmbedUrl` is empty.
 *  - The "Get directions" button is promoted from `secondary` to
 *    `primary` — the section is now the closing pair's lead-
 *    generation chapter (the form in `#reserve` is the other
 *    closing conversion). The href reads `LOCATION.directionsHref`,
 *    which already serves the Google Maps directions fallback the
 *    brief asks for; an owner-supplied precise URL replaces it in
 *    one place.
 *
 * The rail geometry (`lg:col-span-2` rail / `lg:col-span-10` content)
 * is byte-identical to the previous inline `<WideSection>`, so the
 * `e2e/hero.spec.ts` rail-geometry assertion (`#visit h2` x equals
 * `#reserve h2` x, both greater than the eyebrow rail) keeps
 * passing.
 */

/* ------------------------------------------------------------------
   The row typography. Same display face as the previous contact
   rows (`font-display text-2xl leading-tight md:text-[1.7rem]`),
   with the explicit `lining-nums tabular-nums` so a future body-
   wide opt-out doesn't silently undo it on the section.
------------------------------------------------------------------- */
const ROW =
  "font-display text-2xl leading-tight tabular-nums text-ink md:text-[1.7rem]";

/** The label-column typography — same eyebrow weight as the rest of
 *  the page (`text-[10px] uppercase tracking-[0.28em] text-ink-faint`). */
const ROW_LABEL =
  "w-28 shrink-0 text-[10px] uppercase tracking-[0.28em] text-ink-faint md:w-32";

/* ------------------------------------------------------------------
   One detail row. Hairline-divided, hover-lifts the bottom border,
   left label column + right value column. Pure markup — the caller
   decides whether to render it.
------------------------------------------------------------------- */
function DetailRow({
  label,
  href,
  external,
  children,
  className,
}: {
  label: string;
  href?: string;
  external?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const body = (
    <>
      <span className={ROW_LABEL}>{label}</span>
      <span className={cn(ROW, className)}>{children}</span>
    </>
  );

  if (href !== undefined) {
    return (
      <li>
        <a
          href={href}
          data-cursor="hover"
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : undefined)}
          className="group flex items-baseline gap-4 border-b border-line py-4 transition-colors duration-500 hover:border-line-strong md:py-5"
        >
          {body}
        </a>
      </li>
    );
  }

  return (
    <li className="flex items-baseline gap-4 border-b border-line py-4 md:py-5">
      {body}
    </li>
  );
}

/* ------------------------------------------------------------------
   The address value. The first line is the dominant one (slightly
   larger / heavier), the second line sits underneath. The landmark
   and PIN append on their own lines with their own typographic
   markers so the relationship between the four pieces is text,
   not a new visual element.
------------------------------------------------------------------- */
function AddressValue() {
  return (
    <span className="block">
      {isFilled(SITE.addressLine1) && (
        <span className="block">{SITE.addressLine1}</span>
      )}
      {isFilled(SITE.addressLine2) && (
        <span className="block">{SITE.addressLine2}</span>
      )}
      {(isFilled(SITE.landmark) || isFilled(SITE.pin)) && (
        <span className="mt-2 block text-[11px] uppercase tracking-[0.22em] text-ink-faint">
          {isFilled(SITE.landmark) && (
            <span className="mr-3 inline-flex items-center gap-2">
              <span aria-hidden="true" className="text-vermillion/70">
                &#x25C6;
              </span>
              <span className="sentence">{SITE.landmark}</span>
            </span>
          )}
          {isFilled(SITE.pin) && (
            <span className="inline-flex items-baseline gap-2">
              <span className="text-ink-muted">PIN</span>
              <span className="tabular-nums text-ink">{SITE.pin}</span>
            </span>
          )}
        </span>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------
   The combined Call + WhatsApp value. Two distinct text links to
   two different protocols (`tel:` and `wa.me`) over the same
   number. The shared number renders once above; the two affordances
   are labelled inline. Lining tabular numerals on the digits so
   they line up column-wise, independent of any body-wide setting.
------------------------------------------------------------------- */
function CallWhatsAppValue() {
  return (
    <span className="block">
      <a
        href={CONTACT.call.href}
        data-cursor="hover"
        className="block transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-x-1"
      >
        {CONTACT.call.display}
      </a>
      <span className="mt-2 block text-[11px] uppercase tracking-[0.22em] text-ink-faint">
        <a
          href={CONTACT.call.href}
          data-cursor="hover"
          className="sentence mr-4 inline-block transition-colors duration-300 hover:text-ink"
        >
          Call
        </a>
        <a
          href={CONTACT.whatsapp.href}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor="hover"
          className="sentence inline-block transition-colors duration-300 hover:text-ink"
        >
          WhatsApp
        </a>
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------
   The detail block. Hairline-divided rows; each row is wrapped in
   `isFilled(...)` so empty fields never paint. The Call / WhatsApp
   row always renders because the contact number is always present;
   the rest grow around it as the owner fills the fields.
------------------------------------------------------------------- */
function VisitDetails() {
  const hasAddress =
    isFilled(SITE.addressLine1) || isFilled(SITE.addressLine2);
  const hasHours = isFilled(SITE.hours);
  const hasParking = isFilled(SITE.parkingNote);
  const hasPayments = isFilled(SITE.paymentsNote);
  const hasAccess = isFilled(SITE.accessibilityNote);

  return (
    <ul className="mt-10 border-t border-line">
      {hasAddress && (
        <DetailRow label="Address">
          <AddressValue />
        </DetailRow>
      )}

      {hasHours && (
        <DetailRow label="Hours" className="sentence text-ink-muted">
          {SITE.hours}
        </DetailRow>
      )}

      <DetailRow label="Call / WhatsApp">
        <CallWhatsAppValue />
      </DetailRow>

      {hasParking && (
        <DetailRow label="Parking" className="sentence text-ink-muted">
          {SITE.parkingNote}
        </DetailRow>
      )}

      {hasPayments && (
        <DetailRow label="Payments" className="sentence text-ink-muted">
          {SITE.paymentsNote}
        </DetailRow>
      )}

      {hasAccess && (
        <DetailRow label="Access" className="sentence text-ink-muted">
          {SITE.accessibilityNote}
        </DetailRow>
      )}
    </ul>
  );
}

/* ------------------------------------------------------------------
   The map embed. The whole `<figure>` returns null when the owner
   hasn't supplied an embed URL — no placeholder box, no missing-
   frame art, no `<iframe>` mounted with an empty src.

   The saturation filter is inline rather than a CSS class so a
   single token swap later (e.g. switching to `grayscale(1)` once a
   brand book is in) does not require touching `globals.css`. The
   filter stack (`grayscale + contrast + brightness`) is the one that
   measured best against the cream ground during Turn 11's review —
   a flat `grayscale(1)` left the map visually cold against the
   plum hairline frame.
------------------------------------------------------------------- */
function VisitMapEmbed() {
  if (!isFilled(SITE.mapsEmbedUrl)) return null;

  return (
    <figure className="mt-10 overflow-hidden rounded-xs border border-line">
      <iframe
        title="Hotel Bagheecha on Google Maps"
        src={SITE.mapsEmbedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="block aspect-video w-full"
        style={{
          filter: "grayscale(0.85) contrast(0.9) brightness(0.95)",
          border: 0,
        }}
        // The map is decorative reinforcement of the address block
        // above; a guest who can't use the iframe still has the
        // directions button. No `aria-label` needed beyond `title`.
      />
    </figure>
  );
}

/**
 * The section. Server-rendered — there is no client interactivity
 * here beyond the existing `MaskReveal` wrappers. Mirrors the
 * shape of `<Reserve />` and `<OrderOnline />`: its own file,
 * mounted from `app/page.tsx`, owning its own conditional logic.
 */
export default function Visit() {
  return (
    <section
      id="visit"
      data-tone="light"
      className="section-pad bg-surface"
    >
      <div className="container-x grid grid-cols-12 gap-x-6 gap-y-8">
        <div className="col-span-12 lg:col-span-2">
          <MaskReveal as="p" className="eyebrow" duration={0.8}>
            Visit
          </MaskReveal>
        </div>

        <div className="col-span-12 lg:col-span-10">
          <h2 className={H2_MASSIVE}>
            <MaskReveal className="text-balance">
              Find us in Virar.
            </MaskReveal>
          </h2>

          <MaskReveal delay={0.12} duration={0.9}>
            <p className={`mt-6 ${LEDE}`}>
              {LOCATION.name}, {LOCATION.locality}. Directions open
              straight in your maps app — turn-by-turn from wherever
              you are.
            </p>
          </MaskReveal>

          <MaskReveal delay={0.22} duration={0.9}>
            <VisitDetails />
          </MaskReveal>

          <MaskReveal delay={0.32} duration={0.9}>
            <VisitMapEmbed />
          </MaskReveal>

          <MaskReveal delay={0.42} duration={0.9}>
            <div className="mt-10">
              <ActionButton
                href={LOCATION.directionsHref}
                variant="primary"
                size="lg"
                external
              >
                Get directions
              </ActionButton>
            </div>
          </MaskReveal>
        </div>
      </div>
    </section>
  );
}
