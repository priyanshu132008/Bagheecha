import type { ReactNode } from "react";

import { MaskReveal } from "@/components/motion/MaskReveal";
import Navbar from "@/components/nav/Navbar";
import Atmospheres from "@/components/sections/Atmospheres";
import Hero from "@/components/sections/Hero";
import Menu from "@/components/sections/Menu";
import { OrderOnline } from "@/components/sections/OrderOnline";
import Reserve from "@/components/sections/Reserve";
import { ReviewsCards } from "@/components/sections/ReviewsCards";
import Visit from "@/components/sections/Visit";
import { ActionButton } from "@/components/ui/ActionButton";
import MobileActionBar from "@/components/ui/MobileActionBar";
import { CONTACT, H2_MASSIVE, LEDE, LOCATION, WHATSAPP_RESERVATION_HREF } from "@/lib/constants/site";
import { getFeaturedDishes } from "@/lib/menu/queries";

/**
 * The page.
 *
 * THE LIGHT IS STILL THE POINT, WITH ONE OPENING FRAME THAT IS NOT.
 * Appetite is a daylight response, and a restaurant that looks like a
 * terminal is a restaurant you scroll past — so the page proper is warm
 * cream. But a hero is not the page: it is the title sequence, and this
 * one is deep plum under the kitchen's own eight dishes, because a
 * magazine opens on a cover and then turns to paper. The earlier build
 * was black *end to end*, which is a different and much worse thing.
 *
 * THE RHYTHM IS DARK / LIGHT / LIGHT-OR-DARK / LIGHT / LIGHT / LIGHT /
 * LIGHT. The hero is the dark opening frame; `#menus` is the only
 * section that chooses its own ground after that, because it is the
 * only one holding two books — cream for the kitchen card, plum for the
 * bar card — and it flips between them under the reader's hand. Below
 * the menus the page is cream: the reviews marquee, the 50/50 order
 * section, and the two closing chapters.
 *
 * The governing rule is still a strict 12-column grid and a single
 * repeated section shape: a narrow label rail in columns 1–3, content
 * starting in column 5. Every section still *opens* on that shape,
 * `#menus` included. What changed with the menu is that a 358-line list
 * cannot live in columns 5–12, so its body drops the rail and uses the
 * full width below a masthead that keeps it.
 *
 * Every dark/light distinction is expressed by `data-tone` rather than
 * by passing colours down, so the sections below are written once.
 *
 * `section-pad` is deliberately enormous (6–11rem per side). The
 * whitespace is the luxury here; the content is the punctuation.
 */

/** The repeated section shape. Rail left, content on the grid. */
function Section({
  id,
  eyebrow,
  tone = "light",
  children,
}: {
  id: string;
  eyebrow: string;
  tone?: "light" | "dark";
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      data-tone={tone}
      className="section-pad bg-surface transition-colors duration-500"
    >
      <div className="container-x grid grid-cols-12 gap-x-6 gap-y-8">
        <div className="col-span-12 lg:col-span-3">
          <MaskReveal as="p" className="eyebrow" duration={0.8}>
            {eyebrow}
          </MaskReveal>
        </div>

        <div className="col-span-12 lg:col-span-8 lg:col-start-5">
          {children}
        </div>
      </div>
    </section>
  );
}

/**
 * The closing chapters — a wider rail. The location and reservations
 * sections carry a massive display heading and a list of contact
 * numbers, and the original 12-col rail left 4 columns of dead space
 * beside the type. This variant widens the content column from col-5
 * to col-2 — content spans columns 2–11, so the heading can be set
 * huge without breaking the page edge.
 *
 * The eyebrow stays on the rail: it is the section label, and on a
 * grid the rail is what gives the page its first vertical line.
 */
function WideSection({
  id,
  eyebrow,
  tone = "light",
  children,
}: {
  id: string;
  eyebrow: string;
  tone?: "light" | "dark";
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      data-tone={tone}
      className="section-pad bg-surface transition-colors duration-500"
    >
      <div className="container-x grid grid-cols-12 gap-x-6 gap-y-8">
        <div className="col-span-12 lg:col-span-2">
          <MaskReveal as="p" className="eyebrow" duration={0.8}>
            {eyebrow}
          </MaskReveal>
        </div>

        <div className="col-span-12 lg:col-span-10">
          {children}
        </div>
      </div>
    </section>
  );
}

/**
 * The display sizes the closing chapters share — now imported from
 * `lib/constants/site.ts` so both `#visit` and `<Reserve />` consume
 * the same string. See `site.ts` for the rationale.
 */

/**
 * The contact-row typography. Closing-chapter contact rows get the
 * same display face as the heading, but at a single, restrained size
 * (`text-2xl`) so a phone number reads as information without
 * competing with the heading that introduces the section.
 */
const ROW =
  "font-display text-2xl leading-tight text-ink md:text-[1.7rem]";

export default async function Home() {
  /**
   * The page-level data fetches.
   *
   * Hero pulls its own mosaic data here so it stays a thin client
   * component (`HeroMosaicBackground` owns the swap state, not the
   * server-side page). `Menu` runs its own parallel fetches internally
   * — it fetches five things in `Promise.all`, and reaching for them
   * here would mean six round trips serialised.
   *
   * If the database is unreachable, every getter short-circuits to the
   * constants in `lib/constants/menu.ts` and the site renders as
   * before. The only thing the page itself needs is the eight kitchen
   * plates that drive the hero crossfade.
   */
  const featuredDishes = await getFeaturedDishes();

  return (
    <>
      <Navbar />

      {/* `overflow-x-clip` is the global viewport failsafe: if any
          child ever extends past 100vw (the horizontal bar rail was
          the offender), the page itself refuses to scroll wide and
          the white-void-to-the-right never appears. `clip` rather than
          `hidden` — `hidden` would make this element a scroll
          container on both axes, which silently breaks every
          `position: sticky` descendant (the atmospheres pin, the
          header). `clip` clips without establishing a scroll context. */}
      <main className="flex flex-1 flex-col overflow-x-clip">
        <Hero featuredDishes={featuredDishes} />

        <Atmospheres />

        {/* --------------------------------------------------------------
            Menus — the two books. This is the one section that changes
            ground while you are looking at it: cream for the kitchen
            card, plum for the bar card. See `Menu.tsx`.
        --------------------------------------------------------------- */}
        <Menu />

        {/* --------------------------------------------------------------
            Reviews — boxless editorial spread on cream. Oversized
            Playfair-italic pull-quotes fade-swap one at a time, with
            vermillion stars in the byline and no card wrappers. Phase 9.
        --------------------------------------------------------------- */}
        <ReviewsCards />

        {/* --------------------------------------------------------------
            Order — 50/50 split, Swiggy on the left, direct delivery on
            the right. Phase 5.
        --------------------------------------------------------------- */}
        <OrderOnline />

        {/* --------------------------------------------------------------
            Visit — Turn 11 polish. The closing-pair rail (column 2)
            stays so `#visit` and `#reserve` read as one book, and the
            heading / lede reveal in the same rhythm the rest of the
            page uses. What changed is what lives under the lede: the
            address, hours and notes are pulled from `SITE.*` and
            rendered conditionally on `isFilled(...)` (Rule #1: empty
            fields never paint). Call / WhatsApp collapse into one row
            with two distinct links, the map iframe is lazy-loaded +
            desaturated, and the "Get directions" CTA is promoted to
            `primary`. See `components/sections/Visit.tsx`.
        --------------------------------------------------------------- */}
        <Visit />

        {/* --------------------------------------------------------------
            Reserve — Turn 10 polish. The closing-pair rail (column 2)
            stays so `#visit` and `#reserve` read as one book, and the
            heading / lede reveal in the same rhythm the rest of the
            page uses. What changed is what lives under the lede: a
            client-side form collects Name / Guests / Date / Time /
            Seating, validates inline, and launches WhatsApp with a
            freshly-composed message via the existing `waLink()`
            helper. See `components/sections/Reserve.tsx`.
        --------------------------------------------------------------- */}
        <Reserve />
      </main>

      <MobileActionBar />
    </>
  );
}