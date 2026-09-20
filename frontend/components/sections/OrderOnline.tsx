"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import { SITE, isFilled, waLink } from "@/lib/constants/site";

/**
 * OrderOnline — the chapter that converts.
 *
 * Below the reviews, sitting on its own row, this is the moment the
 * page stops being read and starts being acted on. The Turn 9 polish
 * breaks the previous joined `rounded-2xl` frame into two standalone
 * editorial cards:
 *
 *   - LEFT (Direct). Deep plum ground, cream type, ONE filled `primary`
 *     CTA. The link is built with `waLink(...)` rather than the
 *     structured `WHATSAPP_ORDER_HREF` template because the brief asks
 *     for a short, single-sentence opener ("Hi Bagheecha, I'd like to
 *     place an order.") rather than the six-field form that lands
 *     elsewhere. Guests landing on the section are not yet committed
 *     to an order; a friendly opener converts better than a form they
 *     have to fill in.
 *   - RIGHT (Swiggy). Warm sand ground (the new `--sand` primitive in
 *     `globals.css`), plum type, outline `secondary` CTA. The sand is
 *     deliberately *not* peach: peach is a tinted panel for a figure
 *     or a quote (never a panel meant to read as a CTA surface), and
 *     pulling it into the Swiggy card would visually pair the two
 *     cards as if they were both "tinted inserts" rather than two
 *     distinct routes. Sand is its own ground — a warmer, more neutral
 *     beige that sits next to plum without competing with it.
 *
 * The two cards sit in `grid-cols-1 lg:grid-cols-2` with `gap-6`/`gap-8`
 * between them. Each card carries its own border + radius (`rounded-xs`
 * = 2px, the brief's "max 2px radius") — a deliberate departure from
 * the rounded-2xl plate they used to share, because a frame that stands
 * alone reads as a plate; two plates inside one plate reads as a
 * comparison widget. The brief asks for two standalone cards, so each
 * owns its chrome.
 *
 * Below `lg` the cards stack. The grid does NOT carry `overflow-hidden`
 * or any rounded chrome itself — each card owns its border and its
 * radius.
 *
 * DELIVERY RADIUS NOTE. When the owner fills `SITE.deliveryRadius` in
 * `lib/constants/site.ts`, a small upper-case line ("Delivering within
 * X.") appears under the Direct card's body. Empty today (the field
 * is a TODO(owner:)); the line hides itself and no placeholder renders.
 *
 * SECTION MASTHEAD. There is no eyebrow + heading rail above the cards.
 * Every other polished section has one — `#reviews`, `#menus`,
 * `#spaces` — but the brief says "zero dead empty space above", and
 * adding a rail would add ~120px of whitespace at `lg`. The cards
 * sit directly under `#reviews`'s `section-pad` bottom padding.
 *
 * H2 vs H3. The brief's copy is `H3`, and the section has no `H2` —
 * the cards ARE the section's content, and each card's title is one
 * level inside. A `H2` would skip a level under `<main>`'s implicit
 * heading hierarchy.
 */

const SWIGGY_HREF = "https://www.swiggy.com/menu/1355572?source=sharing";

/** Display heading — same scale and rhythm the other sections use for
 *  card-level titles (was an `h2` in the previous version; now `h3`). */
const CARD_HEADING =
  "font-display text-[clamp(1.75rem,3.4vw,2.75rem)] font-normal leading-[1.05] tracking-[-0.02em]";

export function OrderOnline() {
  return (
    <section
      id="order"
      data-tone="light"
      aria-label="Order from Hotel Bagheecha"
      className="section-pad bg-surface"
    >
      <div className="container-x">
        {/* Two standalone editorial cards. The grid itself does NOT carry
            `overflow-hidden` or any rounded chrome — each card owns its
            border and its radius. Direct first/left (the hotel's own
            in-house route), Swiggy second/right (the third-party route). */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {/* ---------------------------------------------------------------
              LEFT — Direct from the kitchen. Plum ground, cream type, ONE
              filled `primary` CTA. The brief's brief: a guest messaging
              from a CTA should land in a WhatsApp chat with a short,
              friendly opener rather than a six-field form. The remaining
              fields (delivery address, order details) are negotiated in
              chat, which is what the in-house route is for.
          ---------------------------------------------------------------- */}
          <article
            data-tone="dark"
            className="flex flex-col justify-between gap-10 rounded-xs border border-line bg-plum p-10 text-cream md:p-14 lg:p-16"
          >
            <div>
              <p className="eyebrow text-cream/70">Direct from the kitchen</p>
              <h3 className={`mt-6 ${CARD_HEADING} text-balance text-cream`}>
                Kitchen to your door.
              </h3>
              <p className="mt-6 max-w-sm text-pretty text-[15px] leading-7 text-cream/80">
                Skip the app and message us. We cook it, we pack it, we
                send it — same menu, same prices, no platform fees.
              </p>
              {isFilled(SITE.deliveryRadius) && (
                <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-cream/70">
                  Delivering within {SITE.deliveryRadius}.
                </p>
              )}
            </div>

            <div>
              <ActionButton
                href={waLink("Hi Bagheecha, I'd like to place an order.")}
                variant="primary"
                size="lg"
                external
                className="w-full justify-center sm:w-auto"
              >
                Order on WhatsApp
              </ActionButton>
            </div>
          </article>

          {/* ---------------------------------------------------------------
              RIGHT — Order on Swiggy. Warm sand ground (the new `--sand`
              primitive in `globals.css`), plum type, outline `secondary`
              CTA. The card carries its own `data-tone="light"` semantics
              via the explicit `text-plum` colour rather than `text-ink`,
              so the section's `data-tone="light"` doesn't pull the card
              into the page-ground ink system.
          ---------------------------------------------------------------- */}
          <article className="flex flex-col justify-between gap-10 rounded-xs border border-line bg-[var(--sand)] p-10 text-plum md:p-14 lg:p-16">
            <div>
              <p className="eyebrow text-plum/70">On the app</p>
              <h3 className={`mt-6 ${CARD_HEADING} text-balance text-plum`}>
                Order on Swiggy.
              </h3>
              <p className="mt-6 max-w-sm text-pretty text-[15px] leading-7 text-plum/80">
                The full menu on the app you already use — packed the
                way we&apos;d serve it in the room.
              </p>
            </div>

            <div>
              <ActionButton
                href={SWIGGY_HREF}
                variant="secondary"
                size="lg"
                external
                className="w-full justify-center sm:w-auto"
              >
                Open Swiggy
              </ActionButton>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
