"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import { CONTACT } from "@/lib/constants/site";

/**
 * OrderOnline — a 50/50 split, the loudest call to action on the page.
 *
 * Below the reviews, sitting on its own row, this is the moment the
 * page stops being read and starts being acted on. Two equal halves,
 * opposite tones:
 *
 *   - LEFT: Soft Peach on cream, "Order via Swiggy" — the third-party
 *     route. The colour is `--peach` so it is a tinted panel, not a
 *     page ground; the deep-plum wordmark sits on it with comfortable
 *     contrast.
 *   - RIGHT: Deep Plum with warm cream type, "Direct Kitchen-to-Door" —
 *     the hotel's own in-house delivery. The link opens a WhatsApp
 *     message rather than a checkout, because an in-house delivery is
 *     a conversation, not a transaction.
 *
 * Display type is the house H2 — `clamp(1.9rem,4.2vw,3.5rem)` —
 * which is large but not the only large thing in view. Both halves
 * get one massive label and one outlined button, and the two buttons
 * are the only interactive elements in view, which is what stops the
 * row from feeling like a comparison table.
 *
 * The whole section is one CSS-Grid row, `grid-cols-1 lg:grid-cols-2`,
 * so on a phone the two halves stack. The CTA in each half is full
 * width on mobile and natural on desktop.
 *
 * SWIGGY URL. The exact link the user gave, which is the live Swiggy
 * page for the hotel's menu. We do not shorten or transform it — it
 * has a `source=sharing` parameter that the partner asked for.
 */

const SWIGGY_HREF = "https://www.swiggy.com/menu/1355572?source=sharing";

/** A pre-filled WhatsApp message for the in-house delivery route. */
const DELIVERY_INQUIRY =
  "Hi Hotel Bagheecha! I'd like to order in — please share today's menu and delivery times.";

const WHATSAPP_DELIVERY_HREF = CONTACT.whatsapp.href.replace(
  encodeURIComponent(
    "Hi Hotel Bagheecha! I'd like to enquire about booking a table. Date, time and number of guests:",
  ),
  encodeURIComponent(DELIVERY_INQUIRY),
);

const HEADING =
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
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl lg:grid-cols-2">
          {/* ---------------------------------------------------------------
              LEFT — Swiggy. Peach background, plum type. A third-party
              delivery app, so the link opens in a new tab.
          ---------------------------------------------------------------- */}
          <div className="flex flex-col justify-between gap-10 bg-peach p-10 text-plum md:p-14 lg:p-16">
            <div>
              <p className="eyebrow text-plum/70">Order via</p>
              <h2 className={`mt-6 ${HEADING} text-balance text-plum`}>
                Order via
                <br />
                Swiggy.
              </h2>
              <p className="mt-6 max-w-sm text-pretty text-[15px] leading-7 text-plum/80">
                The full menu, on the app you already use. Picked up and
                packed the same way it is served in the room.
              </p>
            </div>

            <div>
              <ActionButton
                href={SWIGGY_HREF}
                variant="outline"
                size="lg"
                external
                className="w-full justify-center sm:w-auto"
              >
                Open Swiggy
              </ActionButton>
            </div>
          </div>

          {/* ---------------------------------------------------------------
              RIGHT — Direct. Plum background, cream type. The hotel's
              own in-house delivery, on WhatsApp.
          ---------------------------------------------------------------- */}
          <div
            data-tone="dark"
            className="flex flex-col justify-between gap-10 bg-plum p-10 text-cream md:p-14 lg:p-16"
          >
            <div>
              <p className="eyebrow text-cream/70">Direct</p>
              <h2 className={`mt-6 ${HEADING} text-balance text-cream`}>
                Direct
                <br />
                Kitchen-to-Door.
              </h2>
              <p className="mt-6 max-w-sm text-pretty text-[15px] leading-7 text-cream/80">
                Skip the app, message the kitchen. We cook it, we pack it,
                we send it. Same menu, same prices, no platform fees.
              </p>
            </div>

            <div>
              <ActionButton
                href={WHATSAPP_DELIVERY_HREF}
                variant="outline"
                size="lg"
                external
                className="w-full justify-center sm:w-auto"
              >
                WhatsApp the Kitchen
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}